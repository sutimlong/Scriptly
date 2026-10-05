import { useState, useEffect } from 'react';
import { useSlate } from 'slate-react';
import { Editor, Transforms, Element as SlateElement } from 'slate';
import type { CustomText } from '../../custom-types';

export const isMarkActive = (editor: Editor, format: keyof CustomText) => {
  const marks = Editor.marks(editor) as CustomText | null;
  return marks ? marks[format] === true : false;
};

export const toggleMark = (editor: Editor, format: keyof CustomText) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

export const isBlockActive = (editor: Editor, format: string, blockType = 'type') => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (n as any)[blockType] === format,
    })
  );

  return !!match;
};

export const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = format === 'numbered-list' || format === 'bulleted-list';

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      ['numbered-list', 'bulleted-list'].includes((n as any).type),
    split: true,
  });

  const newProperties: Partial<SlateElement> = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  } as any;

  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block as any);
  }
};

interface EditorToolbarProps {
  onBack?: () => void;
  onAddScene?: () => void;
  onAddDescription?: () => void;
  onAddDialogue?: () => void;
  onSave?: () => void;
  onExportPDF?: () => void;
  title?: string;
  onTitleChange?: (title: string) => void;
  savingStatus?: string;
  editor: Editor;
  zoom: number;
  setZoom: (z: number) => void;
  onShowSidebar: () => void;
}

export const EditorToolbar = ({ onBack, onAddScene, onAddDescription, onAddDialogue, onSave, onExportPDF }: EditorToolbarProps) => {
  const editor = useSlate();
  const [fonts, setFonts] = useState<string[]>([]);

  useEffect(() => {
    // Try to get system fonts using the Local Font Access API
    const loadFonts = async () => {
      try {
        if ('queryLocalFonts' in window) {
          const availableFonts = await (window as any).queryLocalFonts();
          const fontFamilies = new Set<string>();
          for (const font of availableFonts) {
            fontFamilies.add(font.family);
          }
          setFonts(Array.from(fontFamilies).sort());
        }
      } catch (err) {
        console.error('Error fetching fonts:', err);
      }
    };
    loadFonts();
  }, []);

  return (
    <div className="script-toolbar">
      <div className="toolbar-group left">
        <button className="toolbar-btn" onClick={onBack}>上一頁</button>
        <button className="toolbar-btn" onClick={onSave}>儲存</button>
        <button className="toolbar-btn" onClick={onExportPDF}>輸出PDF</button>
      </div>

      <div className="toolbar-group center">
        <select 
          className="font-select" 
          value={(Editor.marks(editor) as any)?.fontFamily || "MOEKai"}
          onChange={(e) => {
            const font = e.target.value;
            Editor.addMark(editor, 'fontFamily', font);
          }}
        >
          <option value="MOEKai">教育部標準楷書</option>
          <option value="MOESong">教育部標準宋體</option>
          <option value="MOELiSu">教育部標準隸書</option>
          <option value="Noto Sans TC">思源黑體</option>
          {fonts.length > 0 && <optgroup label="系統字體">
            {fonts.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </optgroup>}
        </select>
        <button
          className={`toolbar-btn icon-btn ${isMarkActive(editor, 'bold') ? 'active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); toggleMark(editor, 'bold'); }}
        >
          <b>粗體</b>
        </button>
        <button
          className={`toolbar-btn icon-btn ${isMarkActive(editor, 'italic') ? 'active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); toggleMark(editor, 'italic'); }}
        >
          <i>斜體</i>
        </button>
        <button
          className={`toolbar-btn icon-btn ${isMarkActive(editor, 'underline') ? 'active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); toggleMark(editor, 'underline'); }}
        >
          <u>底線</u>
        </button>
      </div>

      <div className="toolbar-group right">
        <button className="toolbar-btn" onMouseDown={(e) => {
          e.preventDefault();
          if (onAddScene) onAddScene();
          else toggleBlock(editor, 'scene');
        }}>新增場景</button>
        <button className="toolbar-btn" onMouseDown={(e) => {
          e.preventDefault();
          if (onAddDescription) onAddDescription();
          else toggleBlock(editor, 'paragraph');
        }}>新增描述</button>
        <button className="toolbar-btn" onMouseDown={(e) => {
          e.preventDefault();
          if (onAddDialogue) onAddDialogue();
          else toggleBlock(editor, 'dialogue');
        }}>新增對白</button>
      </div>
    </div>
  );
};
