import React, { useState } from 'react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, GripVertical, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

export interface Character {
  id: string;
  name: string;
  description: string;
  photoUrl?: string;
  nicknames?: string[];
}

interface CharacterBuilderProps {
  characters: Character[];
  onChange: (chars: Character[]) => void;
  onBack: () => void;
  onComplete: () => void;
  onSaveDraft: () => void;
  hasScriptContent?: boolean;
  onForward?: () => void;
}

const CHARACTER_QA = [
  {
    q: 'Q1：一個立體的角色需要具備哪些維度？',
    a: '業界常使用「3D 角色（Three-Dimensional Character）」的概念來塑造人物，分為三個層次：\n生理維度（Physiology）： 包含年齡、外貌特徵、肢體習慣（例如：焦慮時會撕手指死皮）、健康狀況或殘疾。這決定了角色在畫面上的視覺形象與行動能力。\n社會維度（Sociology）： 包含階級、教育背景、職業、家庭關係、信仰與社會網絡。這決定了角色如何看待世界，以及遇到困難時能夠動用哪些資源。\n心理維度（Psychology）： 包含道德觀、隱藏的恐懼、性格缺陷、防衛機制。這是角色的靈魂，也是整部電影要探討的核心命題。'
  },
  {
    q: 'Q2：角色建構中最關鍵的「想要（Want）」與「需要（Need）」是什麼？',
    a: '這是決定戲劇張力與角色成長的兩大核心支柱：\n想要（Want / 外在目標）： 角色在故事表面上極力追求的事物。它是具體的、可被看見的動作（例如：搶劫銀行、贏得全國大賽、追回前任）。「想要」推動著劇情（Plot）的發展。\n需要（Need / 內在成長）： 角色在心理層面真正匱乏的東西，通常與必須學會的教訓有關（例如：學會信任他人、放下過去的創傷、承認自己的脆弱）。「需要」推動著角色弧線（Character Arc）的轉變。\n故事的高潮，往往是逼迫角色面臨終極抉擇——必須放棄外在的「想要」，才能獲得內在的「需要」。'
  },
  {
    q: 'Q3：什麼是角色的「創傷（Ghost）」與「弱點（Flaw）」？',
    a: '創傷（Ghost / Wound）： 發生在故事開始之前，一件深深影響角色的往事。這個幽靈在潛意識裡糾纏著角色，使其對世界產生了某種錯誤的認知（Lie）。\n弱點（Flaw）： 因為「創傷」而衍生出來的性格缺陷或防衛機制。例如：因為曾經被親近的人背叛（創傷），導致角色變得極度多疑、控制欲極強（弱點）。在故事發展中，這個弱點會不斷使角色做出錯誤決定，將情況變得更糟。'
  },
  {
    q: 'Q4：如何避免寫出來的所有角色，說話語氣都一模一樣？',
    a: '為每個角色設定專屬的「聲音（Voice）」。可以透過以下細節來建立差異化：\n詞彙量與句型： 教育程度高或具特定職業背景的角色可能使用長句與專業術語；街頭出身的角色可能句子短促、充滿俚語與粗口。\n潛台詞（Subtext）： 角色習慣直言不諱，還是習慣拐彎抹角？遇到衝突時，是會大聲指責，還是用酸言酸語迴避問題？\n態度與世界觀： 面對同一杯半滿的水，悲觀主義者、樂觀主義者與憤世嫉俗者的台詞將完全不同。'
  },
  {
    q: 'Q5：新手在建構角色時最常犯的錯誤有哪些？',
    a: '完美無缺（瑪麗蘇 / 龍傲天現象）： 角色太過強大、善良，沒有致命弱點。完美的角色無法經歷挫折與成長，觀眾也無法產生共鳴。\n淪為「推動劇情的工具」： 角色做出的選擇不符合其性格，僅僅是因為「劇情需要這樣發展」才能讓故事繼續。\n設定過於瑣碎卻無用： 寫了長達十頁的角色最愛吃的食物、最喜歡的顏色，卻沒有挖掘「最害怕失去什麼」或「最大的道德盲點」這類能產生戲劇衝突的關鍵設定。'
  },
  {
    q: 'Q6：有什麼實用的練習可以快速檢驗角色的立體度？',
    a: '可以嘗試進行「壓力面試」或「電梯測試」。\n將劇本中的主要角色丟進一個與劇情無關的極端情境（例如：一起受困在悶熱、隨時會墜落的電梯裡）。\n誰會試圖強制撬開電梯門？\n誰會縮在角落恐慌發作？\n誰會開始推卸責任與責怪別人？\n誰會試圖講冷笑話緩和氣氛？'
  }
];

const Accordion = ({ q, a }: { q: string, a: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="accordion">
      <button className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <span>{q}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="accordion-content"
          >
            <div className="accordion-inner">
              {a.split('\\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const CharacterBuilder: React.FC<CharacterBuilderProps> = ({ characters, onChange, onBack, onComplete, onSaveDraft, hasScriptContent, onForward }) => {
  
  // Crop state
  const [croppingCharacterId, setCroppingCharacterId] = useState<string | null>(null);
  const [croppingImageUrl, setCroppingImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const addCharacter = () => {
    const newChar: Character = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      description: '',
      nicknames: []
    };
    onChange([...(characters || []), newChar]);
  };

  const updateCharacter = (id: string, field: keyof Character, value: any) => {
    onChange((characters || []).map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCharacter = (id: string) => {
    onChange((characters || []).filter(c => c.id !== id));
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCroppingImageUrl(url);
      setCroppingCharacterId(id);
    }
    // reset input so same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = async () => {
    if (croppingImageUrl && croppedAreaPixels && croppingCharacterId) {
      try {
        const croppedImage = await getCroppedImg(croppingImageUrl, croppedAreaPixels);
        if (croppedImage) {
          updateCharacter(croppingCharacterId, 'photoUrl', croppedImage);
        }
      } catch (e) {
        console.error(e);
      }
    }
    closeCropper();
  };

  const closeCropper = () => {
    setCroppingImageUrl(null);
    setCroppingCharacterId(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const safeCharacters = characters || [];
  const isComplete = safeCharacters.length > 0 && safeCharacters.every(c => c.name.trim() !== '' && c.description.trim() !== '');
  const hasAnyInput = safeCharacters.some(c => c.name.trim() !== '' || c.description.trim() !== '');

  return (
    <div className="inner-content" style={{ maxWidth: '900px' }}>
      <button className="back-button" onClick={onBack}>
        <ChevronLeft size={24} />
        <span>上一頁</span>
      </button>

      {hasScriptContent && onForward && (
        <button className="forward-button" onClick={onForward}>
          <span>前往劇本</span>
          <ChevronRight size={24} />
        </button>
      )}

      <h2 className="inner-header">角色建構</h2>
      <p className="inner-description">建立角色的背景故事、動機、弱點、說話習慣。</p>

      <Reorder.Group 
        axis="y" 
        values={safeCharacters} 
        onReorder={onChange} 
        style={{ listStyle: 'none', padding: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        {safeCharacters.map(char => (
          <Reorder.Item 
            key={char.id} 
            value={char} 
            className="reorder-item-card"
            style={{ 
              display: 'flex', 
              background: 'white', 
              border: '1px solid #d1d5db',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              position: 'relative',
              backgroundColor: 'white' // Prevents transparency during drag
            }}
          >
            {/* Drag Handle & Trash */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '16px 8px',
              borderRight: '1px solid #d1d5db',
              background: '#f9fafb',
              cursor: 'grab'
            }}>
              <GripVertical size={20} color="#9ca3af" />
              <button 
                onClick={() => removeCharacter(char.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginTop: 'auto' }}
                title="刪除角色"
              >
                <Trash2 size={20} color="#ef4444" />
              </button>
            </div>

            {/* Photo and Name Column */}
            <div style={{ width: '200px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderRight: '1px solid #d1d5db' }}>
              <label style={{ 
                aspectRatio: '1 / 1',
                width: '100%',
                border: char.photoUrl ? 'none' : '1px dashed #d1d5db', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#6b7280',
                background: char.photoUrl ? 'transparent' : '#f9fafb',
                minHeight: '150px',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {char.photoUrl ? (
                  <img src={char.photoUrl} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
                ) : (
                  "上傳照片"
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload(char.id, e)} 
                  style={{ display: 'none' }} 
                />
              </label>
              <input 
                type="text" 
                placeholder="角色名稱" 
                value={char.name}
                onChange={e => updateCharacter(char.id, 'name', e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #d1d5db', 
                  textAlign: 'center',
                  fontSize: '1rem'
                }} 
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(char.nicknames || []).map((nickname, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="text"
                      placeholder="暱稱"
                      value={nickname}
                      onChange={e => {
                        const newNicknames = [...(char.nicknames || [])];
                        newNicknames[index] = e.target.value;
                        updateCharacter(char.id, 'nicknames', newNicknames);
                      }}
                      style={{ 
                        flex: 1, 
                        padding: '4px 8px', 
                        border: '1px solid #d1d5db', 
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        minWidth: 0
                      }}
                    />
                    <button
                      onClick={() => {
                        const newNicknames = [...(char.nicknames || [])];
                        newNicknames.splice(index, 1);
                        updateCharacter(char.id, 'nicknames', newNicknames);
                      }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      title="移除暱稱"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newNicknames = [...(char.nicknames || []), ''];
                    updateCharacter(char.id, 'nicknames', newNicknames);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.85rem',
                    color: '#6b7280',
                    background: '#f3f4f6',
                    border: '1px dashed #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ＋ 新增暱稱
                </button>
              </div>
            </div>

            {/* Description Column */}
            <div style={{ flex: 1, padding: '16px' }}>
              <textarea 
                placeholder="建立角色的背景故事、動機、弱點、說話習慣"
                value={char.description}
                onChange={e => updateCharacter(char.id, 'description', e.target.value)}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '180px',
                  border: '1px solid #d1d5db',
                  padding: '12px',
                  resize: 'none',
                  fontSize: '1rem',
                  lineHeight: '1.6'
                }}
              />
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginTop: '40px', paddingBottom: '60px' }}>
        <button 
          onClick={addCharacter}
          style={{ 
            padding: '12px 32px', 
            border: '1px solid #374151', 
            borderRadius: '30px',
            background: 'white', 
            color: '#374151',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
        >
          新增角色
        </button>

        <div style={{ display: 'flex', gap: '16px' }}>
          {isComplete && (
            <button 
              className="complete-button"
              onClick={onComplete}
            >
              我完成了角色建構
            </button>
          )}

          {hasAnyInput && (
            <button 
              className="save-draft-button"
              onClick={onSaveDraft}
            >
              還沒完成但先儲存
            </button>
          )}
        </div>
      </div>

      <div className="guide-section" style={{ marginTop: '40px', paddingBottom: '40px' }}>
        <h3 className="guide-title">角色建構寫作引導</h3>
        <div className="accordion-list">
          {CHARACTER_QA.map((qa, index) => (
            <Accordion key={index} q={qa.q} a={qa.a} />
          ))}
        </div>
      </div>

      {/* Cropper Modal */}
      {croppingImageUrl && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'relative',
            width: '80%',
            height: '60%',
            background: '#333',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <Cropper
              image={croppingImageUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', color: 'white', width: '60%' }}>
            <span>縮放:</span>
            <input 
              type="range" 
              min={1} 
              max={3} 
              step={0.1} 
              value={zoom} 
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, cursor: 'pointer' }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            <button 
              onClick={closeCropper}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#4b5563',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              取消
            </button>
            <button 
              onClick={handleCropComplete}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              確定上傳
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
