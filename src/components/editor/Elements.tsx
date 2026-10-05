import { useState, useRef, useEffect } from 'react';
import type { RenderElementProps, RenderLeafProps } from 'slate-react';
import { useSlate, useReadOnly } from 'slate-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Element = (props: any) => {
  const { attributes, children, element, scenes } = props;
  const style: React.CSSProperties = { 
    textAlign: (element as any).align,
    position: 'relative', // Ensure Slate's absolute placeholder aligns with the block
  };

  switch (element.type) {
    case 'heading':
      return (
        <h2 style={style} {...attributes}>
          {children}
        </h2>
      );
    case 'scene':
      return <SceneElement attributes={attributes} element={element} style={style} scenes={scenes}>{children}</SceneElement>;
    case 'paragraph':
    default:
      return <ParagraphElement attributes={attributes} element={element} style={style} scenes={scenes}>{children}</ParagraphElement>;
  }
};

import { ReactEditor } from 'slate-react';
import { Path, Range, Transforms, Editor as SlateEditor } from 'slate';

const ParagraphElement = ({ attributes, children, element, style, scenes }: any) => {
  const editor = useSlate();
  let suggestion = '';
  let suggestionScene: any = null;
  let isFocused = false;
  let text = '';
  
  if (editor.selection) {
    try {
      const path = ReactEditor.findPath(editor, element);
      if (Range.isCollapsed(editor.selection) && Path.equals(path, editor.selection.anchor.path.slice(0, path.length))) {
        isFocused = true;
        text = element.children?.[0]?.text || '';
        
        const match = text.match(/^(\d+)\.\s*(.*)$/);
        if (match) {
          const num = parseInt(match[1]);
          const typedText = match[2].toLowerCase();
          
          if (num > 0 && scenes && num <= scenes.length) {
            const scene = scenes[num - 1];
            const sceneText = [scene.setting, scene.location, scene.time].filter(Boolean).join('  ');
            
            if (!typedText || (sceneText.toLowerCase().startsWith(typedText) && sceneText.length > typedText.length)) {
              suggestionScene = scene;
              suggestion = typedText ? sceneText.slice(typedText.length) : sceneText;
            }
          }
        }
      }
    } catch(e) {}
  }

  const handleAutoAdd = (e?: any) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (suggestionScene && isFocused) {
      const path = ReactEditor.findPath(editor, element);
      const correctText = [suggestionScene.setting, suggestionScene.location, suggestionScene.time].filter(Boolean).join('  ');
      
      Transforms.insertText(editor, correctText, {
        at: {
          anchor: SlateEditor.start(editor, path),
          focus: SlateEditor.end(editor, path)
        }
      });
      Transforms.setNodes(editor, { type: 'scene', sceneId: suggestionScene.id } as any, { at: path });
    }
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const listener = () => {
      if (isFocused && suggestionScene) {
        handleAutoAdd();
      }
    };
    document.addEventListener('slate-autocomplete', listener);
    return () => {
      document.removeEventListener('slate-autocomplete', listener);
    };
  });

  return (
    <div style={{ position: 'relative' }}>
      <p style={{ ...style }} {...attributes}>
        {children}
      </p>
      {suggestion && (
        <div contentEditable={false} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', whiteSpace: 'pre-wrap', color: 'transparent', zIndex: 1, fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit', textAlign: style.textAlign }}>
          {text}
          <span style={{ color: '#9ca3af' }}>{suggestion}</span>
        </div>
      )}
      {suggestion && (
        <div contentEditable={false} style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          marginTop: '8px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          color: '#4b5563',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          userSelect: 'none'
        }}>
          <span>推薦按下 <kbd style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}>Tab</kbd> 自動補齊，或</span>
          <button 
            onMouseDown={handleAutoAdd}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.85rem'
            }}
          >
            自動加入
          </button>
        </div>
      )}
    </div>
  );
};

export const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return (
    <span 
      {...attributes} 
      style={{ 
        fontSize: leaf.fontSize ? `${leaf.fontSize}px` : undefined,
        fontFamily: leaf.fontFamily || undefined,
        fontWeight: leaf.bold ? 'bold' : undefined,
        fontStyle: leaf.italic ? 'italic' : undefined,
        textDecoration: leaf.underline ? 'underline' : undefined,
        backgroundColor: (leaf as any).highlight ? '#fef08a' : undefined,
        transition: 'background-color 0.2s',
      }}
    >
      {children}
    </span>
  );
};

import { createPortal } from 'react-dom';

const SceneElement = ({ attributes, children, element, style, scenes }: any) => {
  const editor = useSlate();
  const isReadOnly = useReadOnly();
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  
  // Find the scene outline description and index
  let sceneIndex = -1;
  let sceneDescription = '';
  
  if (scenes && element.sceneId) {
    sceneIndex = scenes.findIndex((s: any) => s.id === element.sceneId);
    if (sceneIndex !== -1) {
      sceneDescription = scenes[sceneIndex].description;
    }
  } else if (scenes) {
    // Fallback: match by text
    const text = element.children?.[0]?.text || '';
    sceneIndex = scenes.findIndex((s: any) => {
      const sceneText = [s.setting, s.location, s.time].filter(Boolean).join('  ');
      return sceneText === text;
    });
    if (sceneIndex !== -1) {
      sceneDescription = scenes[sceneIndex].description;
    }
  }

  // Calculate scene number dynamically based on outline index
  let displayNumber = sceneIndex !== -1 ? sceneIndex + 1 : 1;
  
  // Fallback to document order if not found in outline
  if (sceneIndex === -1) {
    let count = 0;
    for (const node of editor.children) {
      if ((node as any).type === 'scene') {
        count++;
        if (node === element) {
          displayNumber = count;
          break;
        }
      }
    }
  }

  return (
    <div 
      style={{ ...style, fontWeight: 'bold', marginTop: '1.5em', display: 'flex', position: 'relative' }} 
      {...attributes}
      onMouseEnter={(e) => { 
        if (!isReadOnly) {
          const rect = e.currentTarget.getBoundingClientRect();
          setTooltipPos({
            top: rect.top,
            left: rect.left - 24,
          });
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span 
        contentEditable={false} 
        style={{ userSelect: 'none', marginRight: '4px', whiteSpace: 'nowrap', color: '#1f2937' }}
      >
        {displayNumber}. 
      </span>
      <div style={{ flex: 1 }}>{children}</div>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isHovered && sceneDescription && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              contentEditable={false}
              style={{
                position: 'fixed',
                top: tooltipPos.top,
                left: tooltipPos.left,
                transform: 'translateX(-100%)',
                width: '240px',
                padding: '12px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                zIndex: 99999,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '0.9rem',
                fontWeight: 'normal',
                color: '#4b5563',
                pointerEvents: 'none',
                whiteSpace: 'pre-wrap',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#111827', fontSize: '0.8rem' }}>分場大綱內文</div>
              <div>{sceneDescription}</div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
