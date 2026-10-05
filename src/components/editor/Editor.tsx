import { useCallback, useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { createEditor } from 'slate';
import type { Descendant } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { Editor, Transforms, Range, Point, Text, Path, Element as SlateElement } from 'slate';
import { Element, Leaf } from './Elements';
import { EditorToolbar, toggleBlock, toggleMark } from './Toolbar';
import { HelpCircle, X, Save, Keyboard } from 'lucide-react';
import type { Scene } from '../SceneOutline';
import type { Character } from '../CharacterBuilder';
import { Reorder } from 'framer-motion';
import {
  usePagination,
  PAGE_HEIGHT_PX,
  PAGE_WIDTH_PX,
  PAGE_PADDING_TOP,
  PAGE_PADDING_BOTTOM,
  PAGE_PADDING_LR,
  PAGE_GAP,
} from '../../hooks/usePagination';
import MOEKaiFontUrl from '../../assets/fonts/edukai.ttf?url';
import MOESongFontUrl from '../../assets/fonts/edusong.ttf?url';
import MOELiSuFontUrl from '../../assets/fonts/edulisu.ttf?url';
import NotoSansTCFontUrl from '../../assets/fonts/notosans.ttf?url';
interface ScriptEditorProps {
  onBack: () => void;
  fileName?: string;
  content: Descendant[];
  onChange: (value: Descendant[]) => void;
  scenes: Scene[];
  characters: Character[];
  onScenesChange: (scenes: Scene[]) => void;
  onCharactersChange: (chars: Character[]) => void;
  onSave: () => void;
  onAddSceneOutline: () => void;
  onAddCharacter: () => void;
  onGoToSceneOutline: () => void;
  onGoToCharacter: () => void;
}

export const ScriptEditor = ({
  onBack,
  content,
  onChange,
  scenes,
  characters,
  onScenesChange,
  onCharactersChange,
  onSave,
  onAddSceneOutline,
  onAddCharacter,
  onGoToSceneOutline,
  onGoToCharacter
}: ScriptEditorProps) => {
  const editor = useMemo(() => {
    const e = withHistory(withReact(createEditor()));
    const { insertBreak } = e;

    e.insertBreak = () => {
      const { selection } = e;
      if (selection) {
        const [match] = Editor.nodes(e, {
          match: n => !Editor.isEditor(n) && (n as any).type === 'scene',
        });

        if (match) {
          insertBreak();
          Transforms.setNodes(e, { type: 'paragraph' } as any);
          return;
        }
      }
      insertBreak();
    };

    const { deleteBackward, deleteForward, deleteFragment, apply } = e;
    
    e.apply = (op) => {
      if (op.type === 'merge_node') {
        try {
          const { path } = op;
          const [node] = Editor.node(e, path);
          const prevPath = Path.previous(path);
          const [prevNode] = Editor.node(e, prevPath);
          
          if (
            (node as any).type === 'scene' || 
            (prevNode as any).type === 'scene'
          ) {
            // Unconditionally prevent ANY merging that involves a scene block
            return;
          }
        } catch (err) {
          // Ignore path resolution errors
        }
      }
      apply(op);
    };
    
    e.deleteForward = (unit) => {
      const { selection } = e;
      if (selection && Range.isCollapsed(selection)) {
        const end = Editor.end(e, selection.anchor.path.slice(0, 1));
        if (Point.equals(selection.anchor, end)) {
          // If we are at the end of a block, check if the CURRENT or NEXT block is a scene
          const [currentNode] = Editor.node(e, selection.anchor.path.slice(0, 1));
          const next = Editor.next(e, { at: selection.anchor.path.slice(0, 1) });
          
          if ((currentNode as any).type === 'scene' || (next && (next[0] as any).type === 'scene')) {
            // Prevent merging scenes together or pulling paragraphs into scenes
            return;
          }
        }
      }
      deleteForward(unit);
    };

    e.deleteFragment = (direction) => {
      const { selection } = e;
      if (selection && Range.isExpanded(selection)) {
        const edges = Range.edges(selection);
        const startPath = edges[0].path.slice(0, 1);
        const endPath = edges[1].path.slice(0, 1);
        
        if (!Path.equals(startPath, endPath)) {
          const scenes = Array.from(Editor.nodes(e, {
            at: selection,
            match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'scene'
          }));
          
          if (scenes.length > 0) {
            Editor.withoutNormalizing(e, () => {
              const [start, end] = Range.edges(selection);
              
              const endBlockPath = end.path.slice(0, 1);
              const endBlockStart = Editor.start(e, endBlockPath);
              Transforms.delete(e, { at: { anchor: endBlockStart, focus: end }, hanging: false });
              
              for (let i = endBlockPath[0] - 1; i > startPath[0]; i--) {
                Transforms.removeNodes(e, { at: [i] });
              }
              
              const startBlockEnd = Editor.end(e, startPath);
              Transforms.delete(e, { at: { anchor: start, focus: startBlockEnd }, hanging: false });
              
              Transforms.select(e, start);
            });
            return;
          }
        }
      }
      deleteFragment(direction);
    };

    e.deleteBackward = (unit) => {
      const { selection } = e;
      if (selection && Range.isCollapsed(selection)) {
        const path = selection.anchor.path.slice(0, 1);
        const start = Editor.start(e, path);
        
        if (Point.equals(selection.anchor, start)) {
          const [currentNode] = Editor.node(e, path);
          
          if ((currentNode as any).type === 'scene') {
            Transforms.setNodes(e, { type: 'paragraph' } as any, { at: path });
            Transforms.unsetNodes(e, 'sceneId', { at: path });
            return;
          } else {
            // If it's a paragraph, check if the previous block is a scene
            const prev = Editor.previous(e, { at: path });
            if (prev && (prev[0] as any).type === 'scene') {
              // Prevent merging paragraph into the previous scene block
              return;
            }
          }
        }
      }
      deleteBackward(unit);
    };

    return e;
  }, []);
  const [wordCount, setWordCount] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [showFormatInfo, setShowFormatInfo] = useState(false);
  const [showShortcutsInfo, setShowShortcutsInfo] = useState(false);
  const [showAddScene, setShowAddScene] = useState(false);
  const [showSceneSelection, setShowSceneSelection] = useState(false);
  const [sceneSelectionCandidates, setSceneSelectionCandidates] = useState<any[]>([]);
  const [sceneSelectionPath, setSceneSelectionPath] = useState<Path | null>(null);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const [sceneSetting, setSceneSetting] = useState('內景');
  const [sceneLocation, setSceneLocation] = useState('');
  const [sceneTime, setSceneTime] = useState('日');
  const [hoveredCharacterNames, setHoveredCharacterNames] = useState<string[] | null>(null);
  const [hoveredOutlineSceneId, setHoveredOutlineSceneId] = useState<string | null>(null);
  const [showAddDialogue, setShowAddDialogue] = useState(false);

  const handleExportPDF = async () => {
    const el = wrapperRef.current;
    if (!el) {
      alert("無法取得輸出內容");
      return;
    }

    try {
      // Collect all stylesheets
      let styles = '';
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            styles += rule.cssText + '\n';
          }
        } catch (e) {}
      }

      // Collect inline styles if any
      const inlineStyles = Array.from(document.querySelectorAll('style'))
        .map(s => s.innerHTML)
        .join('\n');

      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>輸出PDF</title>
            <style>
              @font-face {
                font-family: 'MOEKai';
                src: url('${new URL(MOEKaiFontUrl, window.location.origin).href}') format('truetype');
                font-weight: normal;
                font-style: normal;
              }
              @font-face {
                font-family: 'MOESong';
                src: url('${new URL(MOESongFontUrl, window.location.origin).href}') format('truetype');
                font-weight: normal;
                font-style: normal;
              }
              @font-face {
                font-family: 'MOELiSu';
                src: url('${new URL(MOELiSuFontUrl, window.location.origin).href}') format('truetype');
                font-weight: normal;
                font-style: normal;
              }
              @font-face {
                font-family: 'Noto Sans TC';
                src: url('${new URL(NotoSansTCFontUrl, window.location.origin).href}') format('truetype');
                font-weight: normal;
                font-style: normal;
              }
              ${styles}
              ${inlineStyles}
              @page {
                size: A4;
                margin: 23.55mm 21.17mm; /* Matches screen padding: Top/Bottom 89px, Left/Right 80px */
              }
              body { 
                background: white !important; 
                margin: 0;
                padding: 0;
              }
              .print-container {
                width: 100%;
                margin: 0;
                padding: 0;
                font-family: 'MOEKai', 'BiaoKai', 'DFKai-SB', 'Kaiti TC', 'KaiTi', 'Noto Serif TC', serif;
                font-size: 12pt;
                line-height: 16pt;
                color: #000;
                box-sizing: border-box;
              }
              /* Strip slate inline styles and prevent pagination breaking */
              .print-container [data-slate-editor="true"] {
                padding: 0 !important;
                min-height: 0 !important;
                height: auto !important;
                width: auto !important;
                margin: 0 !important;
                box-shadow: none !important;
              }
              .print-container * {
                visibility: visible !important;
                background: transparent !important;
                position: static !important; /* CRITICAL: prevents Chromium from slicing lines in half */
                page-break-inside: auto !important;
                break-inside: auto !important;
              }
              /* But avoid breaking inside a single line */
              .print-container p, .print-container h1, .print-container h2, .print-container h3, .print-container div.slate-scene {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${el.innerHTML}
            </div>
          </body>
        </html>
      `;

      const { ipcRenderer } = (window as any).require('electron');
      const res = await ipcRenderer.invoke('export-pdf', '未命名劇本', fullHtml);
      if (!res.success && !res.cancelled) {
        alert(`輸出 PDF 失敗：${res.error}`);
      }
    } catch (e) {
      console.error(e);
      alert(`請在 Electron 環境下執行以支援 PDF 輸出。(${e.message || e})`);
    }
  };

  const openSceneDialog = () => {
    setSavedSelection(editor.selection);
    setShowAddScene(true);
  };

  const insertSceneToEditor = (textToInsert: string, sceneId?: string) => {
    // Make sure we have a selection or fallback to the end
    if (!editor.selection) {
      Transforms.select(editor, Editor.end(editor, []));
    }
    
    // Check if current block is empty
    const currentBlock = Editor.above(editor, { match: n => !Editor.isEditor(n) && Editor.isBlock(editor, n as any) });
    
    if (currentBlock) {
      const path = currentBlock[1];
      const isCurrentEmpty = Editor.string(editor, path) === '';
      
      let targetIndex = path[0];
      if (!isCurrentEmpty) {
        targetIndex = path[0] + 1;
      }

      // Enforce two empty lines before the scene (unless it's the very first block)
      if (targetIndex > 0) {
        let emptyLinesBefore = 0;
        for (let i = targetIndex - 1; i >= 0; i--) {
          if (Editor.string(editor, [i]) === '') {
            emptyLinesBefore++;
          } else {
            break;
          }
        }

        const linesToAdd = Math.max(0, 2 - emptyLinesBefore);
        
        for (let i = 0; i < linesToAdd; i++) {
          Transforms.insertNodes(
            editor, 
            { type: 'paragraph', children: [{ text: '' }] } as any, 
            { at: [targetIndex] }
          );
          targetIndex++; // Shift targetIndex down as we insert above it
        }
      }

      if (isCurrentEmpty) {
        // Set the current empty block to a scene and insert text
        Transforms.setNodes(editor, { type: 'scene', sceneId } as any, { at: [targetIndex] });
        Transforms.insertText(editor, textToInsert, { at: [targetIndex] });
        Transforms.select(editor, Editor.end(editor, [targetIndex]));
      } else {
        // Insert a new scene block below
        const newNode = {
          type: 'scene',
          sceneId,
          children: [{ text: textToInsert }]
        };
        Transforms.insertNodes(editor, newNode as any, { at: [targetIndex], select: true });
      }
    }
  };

  const handleAddSceneSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sceneLocation.trim()) {
      alert('請輸入地點');
      return;
    }

    let targetSelection = savedSelection;
    if (!targetSelection) {
      targetSelection = {
        anchor: Editor.end(editor, []),
        focus: Editor.end(editor, []),
      };
    }
    Transforms.select(editor, targetSelection);

    const textToInsert = [sceneSetting, sceneLocation, sceneTime].filter(Boolean).join('  ');
    insertSceneToEditor(textToInsert);
    
    setShowAddScene(false);
    setSceneLocation('');
    setSceneSetting('內景');
    setSceneTime('日');
  };

  const handleOutlineCardClick = (scene: Scene, index: number) => {
    const sceneNumber = index + 1;
    const textToSearch = [scene.setting, scene.location, scene.time].filter(Boolean).join('  ');

    const matchIter = Editor.nodes(editor, {
      at: [],
      match: (n, p) => {
        if (Editor.isEditor(n)) return false;
        
        // 判斷標準 1: 直接比對 sceneId
        if ((n as any).type === 'scene' && (n as any).sceneId === scene.id) {
          return true;
        }
        
        // 判斷標準 2: 透過文字開頭的場次場號比對
        const text = Editor.string(editor, p);
        if ((n as any).type === 'scene' || text.match(/^(?:(\d+)\.\s*)?(內景|外景)/)) {
          const numMatch = text.match(/^(\d+)\./);
          if (numMatch && parseInt(numMatch[1]) === sceneNumber) {
            return true;
          }
        }
        return false;
      }
    });
    const match = Array.from(matchIter)[0];

    if (match) {
      const [node, path] = match;
      try {
        const domNode = ReactEditor.toDOMNode(editor, node);
        const scrollContainer = scrollRef.current;
        if (scrollContainer && domNode) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const nodeRect = domNode.getBoundingClientRect();
          
          const targetScrollTop = scrollContainer.scrollTop + (nodeRect.top - containerRect.top) - (containerRect.height / 2) + (nodeRect.height / 2);
          
          scrollContainer.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
        }
        Transforms.select(editor, path);
      } catch (e) {
        console.error('Failed to scroll to node', e);
      }
    } else {
      insertSceneToEditor(textToSearch, scene.id);
    }
  };

  const handleCharacterCardClick = (character: Character) => {
    if (!editor.selection) {
      Transforms.select(editor, Editor.end(editor, []));
    }

    let insertedCharacterPath: number[] = [];

    const currentBlock = Editor.above(editor, { match: n => !Editor.isEditor(n) && Editor.isBlock(editor, n as any) });
    if (currentBlock) {
      const [node, path] = currentBlock;
      const text = Editor.string(editor, path);
      if (text.includes('：')) {
        Transforms.splitNodes(editor, { always: true });
        Transforms.insertText(editor, `${character.name}：`);
        if (editor.selection) insertedCharacterPath = editor.selection.anchor.path.slice(0, 1);
      } else if (text.startsWith('△ ') || (node as any).type === 'scene') {
        Transforms.select(editor, Editor.end(editor, path));
        Transforms.insertNodes(
          editor,
          [
            { type: 'paragraph', children: [{ text: '' }] },
            { type: 'paragraph', children: [{ text: `${character.name}：` }] }
          ] as any,
          { select: true }
        );
        if (editor.selection) insertedCharacterPath = editor.selection.anchor.path.slice(0, 1);
      } else {
        if (path[0] > 0) {
          const prevPath = [path[0] - 1];
          const [prevNode] = Editor.node(editor, prevPath);
          const prevText = Editor.string(editor, prevPath);
          if (prevText.startsWith('△ ') || (prevNode as any).type === 'scene') {
            Transforms.insertNodes(
              editor,
              { type: 'paragraph', children: [{ text: '' }] } as any,
              { at: path }
            );
          }
        }
        Transforms.insertText(editor, `${character.name}：`);
        if (editor.selection) insertedCharacterPath = editor.selection.anchor.path.slice(0, 1);
      }
    } else {
      Transforms.insertText(editor, `${character.name}：`);
      if (editor.selection) insertedCharacterPath = editor.selection.anchor.path.slice(0, 1);
    }

    // Check the next line based on the character path
    if (insertedCharacterPath.length > 0) {
      const nextPath = [insertedCharacterPath[0] + 1];
      if (nextPath[0] < editor.children.length) {
        try {
          const [nextNode] = Editor.node(editor, nextPath);
          const nextText = Editor.string(editor, nextPath);
          if (nextText.startsWith('△ ') || (nextNode as any).type === 'scene') {
            // Insert empty line below character
            Transforms.insertNodes(
              editor,
              { type: 'paragraph', children: [{ text: '' }] } as any,
              { at: nextPath }
            );
          }
        } catch (e) {
          // Ignore if path doesn't exist
        }
      }
    }
  };

  const handleScenesDragEnd = () => {
    // 1. Group all editor children by sceneId or text
    const groups: { sceneId: string | null; nodes: any[] }[] = [];
    let currentGroup: { sceneId: string | null; nodes: any[] } = { sceneId: null, nodes: [] };
    
    editor.children.forEach(node => {
      if ((node as any).type === 'scene') {
        if (currentGroup.nodes.length > 0) {
          groups.push(currentGroup);
        }
        
        // Try to match by sceneId first, fallback to text matching
        let id = (node as any).sceneId;
        const text = (node as any).children?.[0]?.text || '';
        
        if (!id) {
          const matchedScene = scenes.find(s => {
            const sceneText = [s.setting, s.location, s.time].filter(Boolean).join('  ');
            return sceneText === text;
          });
          if (matchedScene) id = matchedScene.id;
        }
        
        currentGroup = { sceneId: id || null, nodes: [node] };
      } else {
        currentGroup.nodes.push(node);
      }
    });
    if (currentGroup.nodes.length > 0) {
      groups.push(currentGroup);
    }

    const orderedSceneIds = scenes.map(s => s.id);
    const nullGroups = groups.filter(g => !g.sceneId || !orderedSceneIds.includes(g.sceneId));
    const sceneGroups = groups.filter(g => g.sceneId && orderedSceneIds.includes(g.sceneId));
    
    sceneGroups.sort((a, b) => {
      return orderedSceneIds.indexOf(a.sceneId!) - orderedSceneIds.indexOf(b.sceneId!);
    });

    const newChildrenRaw = [
      ...nullGroups.map(g => g.nodes).flat(),
      ...sceneGroups.map(g => g.nodes).flat()
    ];

    if (newChildrenRaw.length === 0) return;

    // Enforce exactly 2 empty lines before each scene heading if there's text above it
    const newChildren: any[] = [];
    for (let i = 0; i < newChildrenRaw.length; i++) {
      const child = newChildrenRaw[i];
      if (child.type === 'scene') {
        // Remove trailing empty lines from the previous block
        while (newChildren.length > 0 && newChildren[newChildren.length - 1].children?.[0]?.text === '') {
          newChildren.pop();
        }
        // If there is any content above, add exactly two empty lines
        if (newChildren.length > 0) {
          newChildren.push({ type: 'paragraph', children: [{ text: '' }] });
          newChildren.push({ type: 'paragraph', children: [{ text: '' }] });
        }
      }
      newChildren.push(child);
    }

    // Only update if the order actually changed to prevent cursor issues
    const isDifferent = newChildren.length !== editor.children.length || newChildren.some((child, i) => child !== editor.children[i]);
    if (!isDifferent) return;

    Transforms.delete(editor, {
      at: {
        anchor: Editor.start(editor, []),
        focus: Editor.end(editor, []),
      },
    });
    Transforms.insertNodes(editor, newChildren as any, { at: [0] });
    Transforms.removeNodes(editor, { at: [newChildren.length] });
  };

  const handleAddDescription = () => {
    let targetSelection = editor.selection;
    if (!targetSelection) {
      targetSelection = {
        anchor: Editor.end(editor, []),
        focus: Editor.end(editor, []),
      };
      Transforms.select(editor, targetSelection);
    }

    const currentBlock = Editor.above(editor, { match: n => !Editor.isEditor(n) && Editor.isBlock(editor, n as any) });
    if (!currentBlock) return;
    
    const [node, path] = currentBlock;
    const text = Editor.string(editor, path);
    const isCurrentEmpty = text === '';
    
    let shouldAddEmptyLine = false;
    
    if (isCurrentEmpty) {
      if (path[0] > 0) {
        const prevPath = [path[0] - 1];
        const prevText = Editor.string(editor, prevPath);
        if (prevText.includes('：')) {
          shouldAddEmptyLine = true;
        }
      }
    } else {
      if (text.includes('：')) {
        shouldAddEmptyLine = true;
      }
    }

    if (shouldAddEmptyLine) {
      if (isCurrentEmpty) {
        // The current line is already empty, so it serves as the gap.
        // Just insert the description below it.
        const newNode = {
          type: 'paragraph',
          children: [{ text: '△ ' }]
        };
        Transforms.insertNodes(editor, newNode as any, { select: true });
      } else {
        // We are on the dialogue line itself. Insert an empty line then the description.
        Transforms.insertNodes(
          editor,
          [
            { type: 'paragraph', children: [{ text: '' }] },
            { type: 'paragraph', children: [{ text: '△ ' }] }
          ] as any,
          { select: true }
        );
      }
    } else {
      if (!isCurrentEmpty) {
        const newNode = {
          type: 'paragraph',
          children: [{ text: '△ ' }]
        };
        Transforms.insertNodes(editor, newNode as any, { select: true });
      } else {
        // We are on an empty line and NO dialogue is above. 
        // Just turn this empty line into a description line.
        Transforms.setNodes(editor, { type: 'paragraph' } as any);
        Transforms.insertText(editor, '△ ');
      }
    }
  };

  const scrollRef  = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { pageCount, currentPage } = usePagination(wrapperRef, scrollRef, editor, zoom);


  // Canvas height = all pages + gaps between them
  const canvasHeight =
    pageCount * PAGE_HEIGHT_PX + Math.max(0, pageCount - 1) * PAGE_GAP;

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const flexContainerRef = useRef<HTMLDivElement>(null);
  const currentZoomRef = useRef(zoom);
  const zoomDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync ref with external zoom changes
  useEffect(() => {
    currentZoomRef.current = zoom;
    if (canvasContainerRef.current) {
      canvasContainerRef.current.style.transform = `scale(${zoom / 100})`;
    }
    if (flexContainerRef.current) {
      flexContainerRef.current.style.minHeight = `${canvasHeight * (zoom / 100) + 64}px`;
    }
  }, [zoom, canvasHeight]);

  // Global handler to intercept window-level zoom shortcuts
  useEffect(() => {
    const handleGlobalZoom = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '-' || e.code === 'Minus' || e.code === 'NumpadSubtract') {
          e.preventDefault();
          e.stopPropagation();
          setZoom(z => Math.max(50, z - 10));
        } else if (e.key === '=' || e.key === '+' || e.code === 'Equal' || e.code === 'NumpadAdd') {
          e.preventDefault();
          e.stopPropagation();
          setZoom(z => Math.min(200, z + 10));
        } else if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') {
          e.preventDefault();
          e.stopPropagation();
          setZoom(100);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalZoom, { capture: true });
    return () => window.removeEventListener('keydown', handleGlobalZoom, { capture: true });
  }, []);

  // Trackpad pinch-to-zoom support
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Mac trackpad pinch-to-zoom triggers wheel with ctrlKey=true
      if (e.ctrlKey) {
        e.preventDefault(); // Prevent browser tab from zooming
        
        const zoomChange = -e.deltaY * 0.5; // Sensitivity factor
        const prevZoom = currentZoomRef.current;
        const newZoom = Math.min(200, Math.max(50, prevZoom + zoomChange));
        
        if (newZoom !== prevZoom) {
          const ratio = newZoom / prevZoom;
          
          // Current mouse position relative to the scroll container's viewport
          const rect = el.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          // Current absolute position of mouse in the scrollable content
          const docX = el.scrollLeft + mouseX;
          const docY = el.scrollTop + mouseY;
          
          // When transformOrigin is 'top center', the origin of scale is horizontally at the center of the flex container,
          // and vertically at 32px (because of margin-top: 32px on the canvas container).
          // To find the origin X relative to the scrollable content:
          // flexContainerRef.current.clientWidth is the width of the scrollable content (max of viewport and scaled canvas)
          const originX = flexContainerRef.current ? flexContainerRef.current.clientWidth / 2 : el.scrollWidth / 2;
          const originY = 32;

          // The new position of the point that was under the mouse
          const newDocX = originX + (docX - originX) * ratio;
          const newDocY = originY + (docY - originY) * ratio;
          
          currentZoomRef.current = newZoom;
          
          // Apply changes immediately to DOM to bypass React re-render delay
          if (canvasContainerRef.current) {
            canvasContainerRef.current.style.transform = `scale(${newZoom / 100})`;
          }
          if (flexContainerRef.current) {
             flexContainerRef.current.style.minHeight = `${canvasHeight * (newZoom / 100) + 64}px`;
             flexContainerRef.current.style.minWidth = `${PAGE_WIDTH_PX * (newZoom / 100)}px`;
          }
          
          // Shift scroll so the newDocX/Y is under the mouseX/mouseY
          el.scrollLeft = newDocX - mouseX;
          el.scrollTop = newDocY - mouseY;

          if (zoomDebounceRef.current) clearTimeout(zoomDebounceRef.current);
          zoomDebounceRef.current = setTimeout(() => {
            setZoom(Math.round(newZoom));
          }, 50);
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [canvasHeight]);

  const renderElement = useCallback(
    (props: any) => <Element {...props} scenes={scenes} />,
    [scenes],
  );
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);

  const decorate = useCallback(
    ([node, path]: any) => {
      const ranges: any[] = [];

      if (!hoveredCharacterNames && !hoveredOutlineSceneId) {
        return ranges;
      }

      if (Text.isText(node)) {
        const { text } = node;
        
        // Scene Outline Hover Highlight
        if (hoveredOutlineSceneId) {
          const parentEntry = Editor.parent(editor, path);
          if (parentEntry) {
             const parent = parentEntry[0];
             if ((parent as any).type === 'scene' && (parent as any).sceneId === hoveredOutlineSceneId) {
                ranges.push({
                  anchor: { path, offset: 0 },
                  focus: { path, offset: text.length },
                  highlight: true,
                });
             }
          }
        }
        
        if (hoveredCharacterNames) {
          for (const matchName of hoveredCharacterNames) {
            if (!matchName) continue;
            let idx = text.indexOf(matchName);
            while (idx !== -1) {
              ranges.push({
                anchor: { path, offset: idx },
                focus: { path, offset: idx + matchName.length },
                highlight: true,
              });
              idx = text.indexOf(matchName, idx + matchName.length);
            }
          }
        } // Close if (hoveredCharacterNames)
      } // Close if (Text.isText(node))

      return ranges;
    },
    [hoveredCharacterNames, hoveredOutlineSceneId, editor]
  );

  return (
    <Slate
      editor={editor}
      initialValue={content}
      onChange={(newValue) => {
        onChange(newValue);
        const text = newValue
          .map(
            (n) =>
              (n as any).children?.map((c: any) => c.text).join('') || '',
          )
          .join('');
        setWordCount(text.trim().length);

        // Auto-detect scene heading
        const hasSetNode = editor.operations.some(op => op.type === 'set_node');
        if (editor.selection && !hasSetNode) {
          const currentBlock = Editor.above(editor, { match: n => !Editor.isEditor(n) && Editor.isBlock(editor, n as any) });
          if (currentBlock) {
            const [node, path] = currentBlock;
            if ((node as any).type !== 'scene') {
              const blockText = Editor.string(editor, path);
              if (blockText.trim().length > 0) {
                const sceneRegex = /^(?:(\d+)\.\s*)?(內景|外景)\s+(.+?)\s+(.+)$/;
                const newSceneMatch = blockText.trim().match(sceneRegex);

                if (newSceneMatch) {
                  const numStr = newSceneMatch[1];
                  const explicitSceneNum = numStr ? parseInt(numStr) : null;
                  
                  let matchedScene = null;
                  let shouldShowDialog = false;

                  if (explicitSceneNum && explicitSceneNum > 0 && explicitSceneNum <= scenes.length) {
                    matchedScene = scenes[explicitSceneNum - 1];
                  }

                  if (!matchedScene) {
                    const normalizeStr = (str: string) => str.replace(/^(\d+\.)?\s*/, '').replace(/[-\s－]/g, '').toLowerCase();
                    const normalizedBlockText = normalizeStr(blockText);
                    const matchedScenes = scenes.filter((s: any) => {
                      const sceneText = [s.setting, s.location, s.time].filter(Boolean).join('  ');
                      return normalizeStr(sceneText) === normalizedBlockText;
                    });

                    if (matchedScenes.length > 1) {
                      shouldShowDialog = true;
                      setTimeout(() => {
                        setSceneSelectionCandidates(matchedScenes);
                        setSceneSelectionPath(path);
                        setShowSceneSelection(true);
                      }, 0);
                    } else if (matchedScenes.length === 1) {
                      matchedScene = matchedScenes[0];
                    }
                  }

                  if (matchedScene) {
                    const correctText = [matchedScene.setting, matchedScene.location, matchedScene.time].filter(Boolean).join('  ');
                    setTimeout(() => {
                      Transforms.setNodes(editor, { type: 'scene', sceneId: matchedScene.id } as any, { at: path });
                      Transforms.delete(editor, {
                        at: {
                          anchor: Editor.start(editor, path),
                          focus: Editor.end(editor, path)
                        }
                      });
                      Transforms.insertText(editor, correctText, { at: Editor.start(editor, path) });
                    }, 0);
                  } else if (!shouldShowDialog) {
                    const setting = newSceneMatch[2];
                    const location = newSceneMatch[3].trim();
                    const time = newSceneMatch[4].trim();
                    const newSceneId = 'scene-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                    const newScene = {
                      id: newSceneId,
                      setting,
                      location,
                      time,
                      description: '（新場景說明...）',
                      characters: [],
                      props: []
                    };
                    
                    const correctText = `${setting}  ${location}  ${time}`;
                    
                    setTimeout(() => {
                      onScenesChange([...scenes, newScene]);
                      Transforms.setNodes(editor, { type: 'scene', sceneId: newSceneId } as any, { at: path });
                      Transforms.delete(editor, {
                        at: {
                          anchor: Editor.start(editor, path),
                          focus: Editor.end(editor, path)
                        }
                      });
                      Transforms.insertText(editor, correctText, { at: Editor.start(editor, path) });
                    }, 0);
                  }
                }
              }
            } else {
              const blockText = Editor.string(editor, path);
              const editMatch = blockText.trim().match(/^(?:(?:\d+\.)?\s*)?(內景|外景)\s+(.+?)\s+(.+)$/);
              if (editMatch) {
                const setting = editMatch[1];
                const location = editMatch[2].trim();
                const time = editMatch[3].trim();
                const sceneId = (node as any).sceneId;
                const existingScene = scenes.find((s: any) => s.id === sceneId);
                if (existingScene && (existingScene.setting !== setting || existingScene.location !== location || existingScene.time !== time)) {
                  setTimeout(() => {
                    const updatedScenes = scenes.map((s: any) => 
                      s.id === sceneId ? { ...s, setting, location, time } : s
                    );
                    onScenesChange(updatedScenes);
                  }, 0);
                }
              }
            }
          }
        }
      }}
    >

      {/* ── Toolbar ── */}
      <EditorToolbar 
        onBack={onBack} 
        onAddScene={openSceneDialog} 
        onAddDescription={handleAddDescription} 
        onAddDialogue={() => {
          setSavedSelection(editor.selection);
          setShowAddDialogue(true);
        }}
        onSave={onSave}
        onExportPDF={handleExportPDF}
      />

      {/* ── Three-pane workspace ── */}
      <div className="script-workspace" style={{ position: 'relative' }}>
        {/* Left sidebar */}
        <div className="script-sidebar left">
          <div className="sidebar-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>分場大綱</span>
            <button onClick={onGoToSceneOutline} style={{ fontSize: '0.8rem', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>前往編輯</button>
          </div>
          <Reorder.Group axis="y" values={scenes} onReorder={onScenesChange} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {scenes.map((scene, i) => (
              <Reorder.Item key={scene.id} value={scene} style={{ marginBottom: '12px' }} onDragEnd={handleScenesDragEnd}>
                <div 
                  className="outline-card" 
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredOutlineSceneId(scene.id)}
                  onMouseLeave={() => setHoveredOutlineSceneId(null)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleOutlineCardClick(scene, i);
                  }}
                >
                  <div className="outline-number" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    S{i + 1}
                  </div>
                  <div className="outline-content">
                    {scene.setting}  {scene.location}  {scene.time}
                    {scene.description && <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '4px' }}>{scene.description}</div>}
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
          <button className="add-outline-btn" onClick={onAddSceneOutline}>＋ 新增分場大綱</button>
        </div>

        {/* ── Centre: vertically paginated A4 editor ── */}
        <div className="script-a4-scroll-area" ref={scrollRef}>
          <div ref={flexContainerRef} style={{ minHeight: canvasHeight * (zoom / 100) + 64, minWidth: PAGE_WIDTH_PX * (zoom / 100), display: 'flex', justifyContent: 'center', alignItems: 'flex-start', width: '100%' }}>
            <div
              ref={canvasContainerRef}
              className="script-pages-canvas"
              style={{
                position: 'relative',
                width: PAGE_WIDTH_PX,
                margin: '32px auto',
                minHeight: canvasHeight,
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
            >
            {/* ───── Layer 0: A4 page backgrounds (Vertical) ───── */}
            {Array.from({ length: pageCount }, (_, i) => (
              <div
                key={`bg-${i}`}
                className="script-a4-page-bg"
                style={{
                  position: 'absolute',
                  top: i * (PAGE_HEIGHT_PX + PAGE_GAP), // PAGE_GAP is now 0
                  left: 0,
                  width: PAGE_WIDTH_PX,
                  height: PAGE_HEIGHT_PX,
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* ───── Layer 1: Single Slate editable ───── */}
            <div
              ref={wrapperRef}
              style={{ position: 'relative', zIndex: 1 }}
            >
              <Editable
                decorate={decorate}
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder="開始撰寫您的劇本…"
                spellCheck={false}
                autoFocus

                style={{
                  paddingTop: PAGE_PADDING_TOP,
                  paddingLeft: PAGE_PADDING_LR,
                  paddingRight: PAGE_PADDING_LR,
                  outline: 'none',
                  minHeight: canvasHeight,
                  lineHeight: '16pt',
                  fontSize: '12pt',
                  fontFamily:
                    '"MOEKai", "BiaoKai", "DFKai-SB", "Kaiti TC", "KaiTi", "Noto Serif TC", serif',
                  color: '#1f2937',
                  boxSizing: 'border-box',
                  wordBreak: 'break-word',
                  cursor: 'text',
                }}
                onKeyDown={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    const key = e.key.toLowerCase();
                    const code = e.code;
                    
                    if (key === 'a' || code === 'KeyA') {
                      e.preventDefault();
                      try {
                        Transforms.select(editor, {
                          anchor: Editor.start(editor, []),
                          focus: Editor.end(editor, []),
                        });
                      } catch (err) {
                        console.warn('Select all failed', err);
                      }
                      return;
                    }
                    if (key === 'z' || code === 'KeyZ') {
                      e.preventDefault();
                      if (e.shiftKey) {
                        editor.redo();
                      } else {
                        editor.undo();
                      }
                      return;
                    }
                    if (key === 's' || code === 'KeyS') {
                      e.preventDefault();
                      onSave();
                      return;
                    }
                    if (key === 'b' || code === 'KeyB') {
                      e.preventDefault();
                      toggleMark(editor, 'bold');
                      return;
                    }
                    if (key === 'i' || code === 'KeyI') {
                      e.preventDefault();
                      toggleMark(editor, 'italic');
                      return;
                    }
                    if (key === 'u' || code === 'KeyU') {
                      e.preventDefault();
                      toggleMark(editor, 'underline');
                      return;
                    }
                    if (key === 'e' || code === 'KeyE') {
                      e.preventDefault();
                      handleExportPDF();
                      return;
                    }
                    
                    switch (key) {
                      case '1':
                        e.preventDefault();
                        openSceneDialog();
                        return;
                      case '2':
                        e.preventDefault();
                        handleAddDescription();
                        return;
                      case '3':
                        e.preventDefault();
                        setSavedSelection(editor.selection);
                        setShowAddDialogue(true);
                        return;
                      case '/':
                        e.preventDefault();
                        setShowShortcutsInfo(s => !s);
                        return;
                    }
                    
                    // Removed fallback block since e.key is now primarily used
                  }

                  if (e.key === 'Tab') {
                    e.preventDefault(); // Lock Tab key to only trigger editor features and never change focus
                    if (typeof document !== 'undefined') {
                      document.dispatchEvent(new CustomEvent('slate-autocomplete'));
                    }
                    return;
                  }

                  if (e.isComposing || e.nativeEvent.isComposing || e.keyCode === 229) {
                    return;
                  }

                  if (e.key === 'Enter') {
                    const currentBlock = Editor.above(editor, { match: n => !Editor.isEditor(n) && Editor.isBlock(editor, n as any) });
                    if (currentBlock) {
                      const [node, path] = currentBlock;
                      const blockText = Editor.string(editor, path);
                      
                      // If the line only contains the auto-inserted triangle and space, clear it
                      if (blockText === '△ ') {
                        e.preventDefault();
                        Transforms.delete(editor, {
                          at: {
                            anchor: Editor.start(editor, path),
                            focus: Editor.end(editor, path)
                          }
                        });
                        return;
                      }

                      // If the line is completely empty, don't auto-add triangle, just do normal Enter
                      if (blockText.trim() === '') {
                        return;
                      }

                      // If the line is a character line (contains '：'), insert empty line + triangle line
                      if (blockText.includes('：')) {
                        if (editor.selection && Range.isCollapsed(editor.selection)) {
                          const end = Editor.end(editor, path);
                          if (Point.equals(editor.selection.anchor, end)) {
                            e.preventDefault();
                            Transforms.insertNodes(
                              editor,
                              [
                                { type: 'paragraph', children: [{ text: '' }] },
                                { type: 'paragraph', children: [{ text: '△ ' }] }
                              ] as any
                            );
                            return;
                          }
                        }
                      }

                      if ((node as any).type === 'scene' || (node as any).type === 'paragraph') {
                        // Check if cursor is at the end of the block
                        if (editor.selection && Range.isCollapsed(editor.selection)) {
                          const end = Editor.end(editor, path);
                          if (Point.equals(editor.selection.anchor, end)) {
                            e.preventDefault();
                            Transforms.insertNodes(editor, { type: 'paragraph', children: [{ text: '△ ' }] } as any);
                            return;
                          }
                        }
                      }
                    }
                  }
                }}
              />
              <style>{`
                [data-slate-editor] > * {
                  margin-top: 0;
                  margin-bottom: 0;
                  padding-bottom: 0;
                }
              `}</style>
            </div>
          </div>
        </div>
        </div>

        {/* Floating Quick Action Toolbar */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '12px',
            background: '#ffffff',
            padding: '8px 16px',
            borderRadius: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            zIndex: 50,
          }}
        >
          <button 
            onMouseDown={(e) => { e.preventDefault(); openSceneDialog(); }}
            style={{ padding: '6px 16px', borderRadius: '16px', border: '1px solid #d1d5db', background: 'transparent', cursor: 'pointer', color: '#374151', fontSize: '0.9rem', transition: 'all 0.2s' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            新增場景
          </button>
          <button 
            onMouseDown={(e) => { e.preventDefault(); handleAddDescription(); }}
            style={{ padding: '6px 16px', borderRadius: '16px', border: '1px solid #d1d5db', background: 'transparent', cursor: 'pointer', color: '#374151', fontSize: '0.9rem', transition: 'all 0.2s' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            新增描述
          </button>
          <button 
            onMouseDown={(e) => { 
              e.preventDefault(); 
              setSavedSelection(editor.selection);
              setShowAddDialogue(true); 
            }}
            style={{ padding: '6px 16px', borderRadius: '16px', border: '1px solid #d1d5db', background: 'transparent', cursor: 'pointer', color: '#374151', fontSize: '0.9rem', transition: 'all 0.2s' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            新增對白
          </button>
        </div>

        {/* Floating Help Button */}
        <button
          onClick={() => setShowFormatInfo(true)}
          style={{
            position: 'absolute',
            bottom: '24px',
            right: '274px', // 250px (sidebar) + 24px padding
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            color: '#6b7280',
            zIndex: 50,
          }}
          title="劇本格式說明"
        >
          <HelpCircle size={20} />
        </button>

        {/* Shortcuts Button */}
        <button
          onClick={() => setShowShortcutsInfo(true)}
          style={{
            position: 'absolute',
            bottom: '80px',
            right: '274px', // 250px (sidebar) + 24px padding
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            color: '#6b7280',
            zIndex: 50,
          }}
          title="快捷鍵說明"
        >
          <Keyboard size={20} />
        </button>

        {/* Shortcuts Info Dialog */}
        {showShortcutsInfo && (
          <div 
            onClick={() => setShowShortcutsInfo(false)}
            style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
          }}>
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
              background: 'white',
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '90%',
              position: 'relative',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}>
              <button
                onClick={() => setShowShortcutsInfo(false)}
                style={{
                  position: 'absolute',
                  top: '16px', right: '16px',
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: '#9ca3af'
                }}
              >
                <X size={24} />
              </button>
              <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.25rem', color: '#111827' }}>
                快捷鍵說明
              </h3>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: '#4b5563', margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <li><strong>Cmd/Ctrl + S：</strong> 儲存劇本</li>
                <li><strong>Cmd/Ctrl + B：</strong> 粗體 (Bold)</li>
                <li><strong>Cmd/Ctrl + 1：</strong> 新增場景</li>
                <li><strong>Cmd/Ctrl + I：</strong> 斜體 (Italic)</li>
                <li><strong>Cmd/Ctrl + 2：</strong> 新增描述</li>
                <li><strong>Cmd/Ctrl + U：</strong> 底線 (Underline)</li>
                <li><strong>Cmd/Ctrl + 3：</strong> 新增對白</li>
                <li><strong>Cmd/Ctrl + +：</strong> 放大</li>
                <li><strong>Cmd/Ctrl + /：</strong> 切換快捷鍵面板</li>
                <li><strong>Cmd/Ctrl + -：</strong> 縮小</li>
                <li><strong>Cmd/Ctrl + 0：</strong> 重置縮放</li>
              </ul>
            </div>
          </div>
        )}

        {/* Format Info Dialog */}
        {showFormatInfo && (
          <div 
            onClick={() => setShowFormatInfo(false)}
            style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
          }}>
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
              background: 'white',
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              position: 'relative',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}>
              <button 
                onClick={() => setShowFormatInfo(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af'
                }}
              >
                <X size={20} />
              </button>
              <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.25rem', color: '#1f2937' }}>劇本格式說明</h3>
              <p style={{ lineHeight: 1.6, color: '#4b5563', marginBottom: 0 }}>
                此格式採用公共電視劇本標準格式，詳情請上 
                <a 
                  href="https://file.moc.gov.tw/Download.ashx?u=LzAwMS9VcGxvYWQvT2xkRmlsZXMvQWRtaW5VcGxvYWRzL2ZpbGVzLzIwMTcwOS85OGYzMGU0OS0xM2Q5LTQzMzktYTE4ZS1kMjhkZTdjMDA3YTIucGRm&n=MTA25bm05bqm5YqH5pys5YWn5paH5a%2Br5L2c5Y%2BD6ICD5qC85byPLnBkZg%3D%3D" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'inline-block',
                    margin: '0 6px',
                    padding: '2px 8px',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}
                >
                  請點我
                </a>
                參考。
              </p>
            </div>
          </div>
        )}
        {/* Print Preview Dialog Removed */}

        {/* Add Dialogue Dialog */}
        {showAddDialogue && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              width: '400px',
              maxWidth: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#111827', display: 'flex', justifyContent: 'space-between' }}>
                <span>選擇角色</span>
                <button 
                  onClick={() => setShowAddDialogue(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                >
                  <X size={20} />
                </button>
              </h3>
              
              {characters.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px 0' }}>
                  目前還沒有建立任何角色，請先前往「角色」面板建立。
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                  {characters.map(char => (
                    <div
                      key={char.id}
                      onClick={() => {
                        if (savedSelection) {
                          Transforms.select(editor, savedSelection);
                        }
                        handleCharacterCardClick(char);
                        setShowAddDialogue(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    >
                      {char.photoUrl ? (
                        <img src={char.photoUrl} alt={char.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', marginRight: '12px' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f3f4f6', marginRight: '12px' }} />
                      )}
                      <span style={{ fontWeight: 'bold', color: '#374151' }}>{char.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scene Selection Dialog */}
        {showSceneSelection && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
          }}>
            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '12px',
              width: '500px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.25rem', color: '#1f2937' }}>選擇場景大綱版本</h3>
              <p style={{ color: '#4b5563', marginBottom: '16px', lineHeight: '1.5' }}>偵測到多個相同地點的場景，請選擇要對應哪一場的大綱：</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {sceneSelectionCandidates.map((scene, idx) => {
                  const sIdx = scenes.findIndex(s => s.id === scene.id);
                  const sceneNum = sIdx !== -1 ? sIdx + 1 : idx + 1;
                  return (
                    <div 
                      key={scene.id}
                      onClick={() => {
                        if (!sceneSelectionPath) return;
                        const correctText = [scene.setting, scene.location, scene.time].filter(Boolean).join('  ');
                        try {
                          Transforms.setNodes(editor, { type: 'scene', sceneId: scene.id } as any, { at: sceneSelectionPath });
                          Transforms.delete(editor, {
                            at: {
                              anchor: Editor.start(editor, sceneSelectionPath),
                              focus: Editor.end(editor, sceneSelectionPath)
                            }
                          });
                          Transforms.insertText(editor, correctText, { at: Editor.start(editor, sceneSelectionPath) });
                        } catch(e) {}
                        setShowSceneSelection(false);
                      }}
                      style={{
                        padding: '16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    >
                      <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                        第 {sceneNum} 場 - {scene.setting} {scene.location} {scene.time}
                      </div>
                      {scene.description && (
                        <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                          {scene.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setShowSceneSelection(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Scene Dialog */}
        {showAddScene && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
          }}>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleAddSceneSubmit(); }}
              style={{
                background: 'white',
                padding: '32px',
                borderRadius: '12px',
                width: '400px',
                position: 'relative',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.25rem', color: '#1f2937' }}>新增場景</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ width: '60px', fontWeight: 500 }}>景別</label>
                  <select 
                    value={sceneSetting} 
                    onChange={(e) => setSceneSetting(e.target.value)}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    <option value="內景">內景</option>
                    <option value="外景">外景</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ width: '60px', fontWeight: 500 }}>地點</label>
                  <input 
                    type="text" 
                    placeholder="輸入地點..."
                    value={sceneLocation}
                    onChange={(e) => setSceneLocation(e.target.value)}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ width: '60px', fontWeight: 500 }}>時間</label>
                  <select 
                    value={sceneTime} 
                    onChange={(e) => setSceneTime(e.target.value)}
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    <option value="日">日</option>
                    <option value="夜">夜</option>
                    <option value="晨">晨</option>
                    <option value="昏">昏</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={() => setShowAddScene(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
                >
                  取消
                </button>
                <button 
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#374151', color: 'white', cursor: 'pointer' }}
                >
                  確定
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Right sidebar */}
        <div className="script-sidebar right">
          <div className="sidebar-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>角色</span>
            <button onClick={onGoToCharacter} style={{ fontSize: '0.8rem', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>前往編輯</button>
          </div>
          {(() => {
            const editorText = editor.children.map((n: any) => n.children?.[0]?.text || '').join('\n');
            const lines = editorText.split('\n');
            const speakers = lines
              .map(line => {
                const match = line.match(/^(.*?)[：:]/);
                return match ? match[1].replace(/\s+/g, '') : null;
              })
              .filter(Boolean) as string[];

            let totalMentions = 0;
            const counts: Record<string, number> = {};
            
            characters.forEach(c => {
              const names = [c.name, ...(c.nicknames || [])].map(n => n.replace(/\s+/g, ''));
              let count = 0;
              speakers.forEach(name1 => {
                if (name1.length > 0 && names.some(name2 => name2.length > 0 && (name1.includes(name2) || name2.includes(name1)))) {
                  count++;
                }
              });
              counts[c.id] = count;
              totalMentions += count;
            });

            return (
              <Reorder.Group axis="y" values={characters} onReorder={onCharactersChange} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {characters.map((char) => {
                  const percentage = totalMentions > 0 ? Math.round((counts[char.id] / totalMentions) * 100) : 0;

                  return (
                <Reorder.Item key={char.id} value={char} style={{ marginBottom: '12px' }}>
                  <div 
                    className="character-card" 
                    style={{ cursor: 'pointer', position: 'relative' }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCharacterCardClick(char);
                    }}
                    onMouseEnter={() => setHoveredCharacterNames([char.name, ...(char.nicknames || [])])}
                    onMouseLeave={() => setHoveredCharacterNames(null)}
                  >
                    <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '12px' }}>
                      {percentage}%
                    </div>
                    {char.photoUrl && (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', marginBottom: '8px', flexShrink: 0 }}>
                        <img src={char.photoUrl} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#1f2937' }}>{char.name}</h4>
                    {char.description && <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.4 }}>{char.description}</p>}
                  </div>
                </Reorder.Item>
              );
            })}
              </Reorder.Group>
            );
          })()}
          <button className="add-outline-btn" onClick={onAddCharacter}>＋ 新增角色</button>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="script-statusbar">
        <div className="status-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>
            第 {currentPage} 頁，共 {pageCount} 頁
          </span>
          <span className="status-words">字數：{wordCount}</span>
          <span className="status-zoom" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e5e7eb', padding: '2px 8px', borderRadius: '12px' }}>
            <button onClick={() => setZoom(z => Math.max(50, z - 10))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
            <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
          </span>
        </div>
        <div className="status-center">
          <span>直向閱讀模式</span>
        </div>
        <div className="status-right">
          <button 
            onClick={onSave}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#4b5563', fontSize: '0.9rem', padding: '4px 8px', borderRadius: '6px'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Save size={16} /> 儲存
          </button>
        </div>
      </div>
    </Slate>
  );
};
