import { useState, useLayoutEffect, useEffect } from 'react';
import { Transforms, Editor } from 'slate';
import { ReactEditor } from 'slate-react';

// ─── A4 dimensions at 96 DPI ──────────────────────────────────────
export const PAGE_HEIGHT_PX     = 1123;  // 29.7cm
export const PAGE_WIDTH_PX      = 794;   // 21cm
export const PAGE_PADDING_TOP   = 89;    // (Adjusted for exactly 35 lines, 945px content height)
export const PAGE_PADDING_BOTTOM = 89; 
export const PAGE_PADDING_LR    = 80;    // visual left/right padding
export const PAGE_GAP           = 40;    // visual gap between pages

export const CONTENT_HEIGHT = PAGE_HEIGHT_PX - PAGE_PADDING_TOP - PAGE_PADDING_BOTTOM; // 931px

export interface PaginationResult {
  pageCount: number;
  currentPage: number;
}

/**
 * Math-based auto-split using pure Slate API.
 * Estimates the split point based on height ratio, avoiding DOM mapping errors.
 */
function autoSplitGiantBlock(path: number[], editor: Editor, splitChars: number, isScene: boolean) {
  try {
    const startPoint = Editor.start(editor, path);
    const splitPoint = Editor.after(editor, startPoint, { distance: splitChars, unit: 'character' });
    
    if (splitPoint) {
      Transforms.splitNodes(editor, { at: splitPoint, always: true });
      // If we just split a scene, the overflow should become a normal paragraph to avoid creating duplicate fake scenes
      if (isScene) {
        const nextPath = [...path];
        nextPath[nextPath.length - 1] += 1; // The newly split node is right after
        Transforms.setNodes(editor, { type: 'paragraph' } as any, { at: nextPath });
        Transforms.unsetNodes(editor, 'sceneId', { at: nextPath });
      }
      return true;
    }
  } catch (e) {
    console.warn("Math-based auto-split failed:", e);
  }
  return false;
}

/**
 * usePagination — Vertical Block-Level Pagination with Auto-Split
 */
export function usePagination(
  wrapperRef: React.RefObject<HTMLElement | null>,
  scrollRef:  React.RefObject<HTMLElement | null>,
  editor: Editor,
  zoom: number = 100
): PaginationResult {
  const [pageCount,   setPageCount]   = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const slateEl = wrapper.querySelector<HTMLElement>('[data-slate-editor]');
    if (!slateEl) return;

    const blocks = Array.from(slateEl.children) as HTMLElement[];
    if (blocks.length === 0) {
      setPageCount(1);
      return;
    }

    let pageContentY = 0;
    let pages = 1;

    for (const block of blocks) {
      // offsetHeight ignores CSS scale, ensuring exact pagination regardless of zoom
      const blockH = block.offsetHeight;
      let targetMarginTop = '';

      // Auto-split super long paragraphs that span more than a full page
      if (blockH > CONTENT_HEIGHT + 10) {
         try {
           const slateNode = ReactEditor.toSlateNode(editor, block);
           const path = ReactEditor.findPath(editor, slateNode);
           // @ts-ignore
           const text = slateNode.children ? slateNode.children.map(c => c.text).join('') : '';
           const totalChars = text.length;
           
           if (totalChars > 0) {
             const safeTargetHeight = Math.max(27, CONTENT_HEIGHT - 27);
             const ratio = safeTargetHeight / blockH;
             const splitChars = Math.max(1, Math.floor(totalChars * ratio));
             const isScene = (slateNode as any).type === 'scene';
             
             // Queue the split to prevent React warnings during useLayoutEffect
             Promise.resolve().then(() => {
               autoSplitGiantBlock(path, editor, splitChars, isScene);
             });
           }
         } catch(e) {}
      }

      if (pageContentY > 0 && pageContentY + blockH > CONTENT_HEIGHT) {
        const remaining = CONTENT_HEIGHT - pageContentY;
        const spacer = remaining + PAGE_PADDING_BOTTOM + PAGE_GAP + PAGE_PADDING_TOP;
        targetMarginTop = `${spacer}px`;
        pageContentY = blockH;
        pages++;
      } else {
        pageContentY += blockH;
      }

      while (pageContentY > CONTENT_HEIGHT) {
        pageContentY -= CONTENT_HEIGHT;
        pages++;
      }

      // Only mutate the DOM if the margin actually needs to change.
      // This prevents React/Slate from aborting IME composition during normal typing!
      if (block.style.marginTop !== targetMarginTop) {
        block.style.marginTop = targetMarginTop;
      }
    }

    setPageCount(pages);
  }, [editor, zoom, wrapperRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const top = el.scrollTop;
      const pageSlot = (PAGE_HEIGHT_PX + PAGE_GAP) * (zoom / 100);
      setCurrentPage(Math.max(1, Math.floor(top / pageSlot) + 1));
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    // Trigger once on mount/zoom to set correct initial page
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef, zoom]);

  return { pageCount, currentPage };
}
