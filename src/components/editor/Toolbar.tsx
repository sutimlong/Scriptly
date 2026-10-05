import { useState, useEffect } from 'react';
import { useSlate } from 'slate-react';
import { Editor } from 'slate';
import { isMarkActive, toggleMark, toggleBlock } from './ToolbarUtils';

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
