import React, { useState } from 'react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, GripVertical, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

export interface Scene {
  id: string;
  setting: string;
  location: string;
  time: string;
  description: string;
}

interface SceneOutlineProps {
  scenes: Scene[];
  onChange: (scenes: Scene[]) => void;
  onBack: () => void;
  onComplete: () => void;
  onSaveDraft: () => void;
  hasScriptContent?: boolean;
  onForward?: () => void;
}

const SCENE_QA = [
  {
    q: 'Q1：什麼是「分場大綱 (Step Outline)」與「節拍表 (Beat Sheet)」？它們完全一樣嗎？',
    a: '在影視編劇與小說創作中，這兩個詞經常被混用，但它們在功能與精細度上其實有著微妙的差異：\n節拍表 (Beat Sheet)： 偏向宏觀的情感與故事結構。它源自好萊塢（如著名的《救貓咪》15個節拍），主要標示出故事的關鍵轉折點（如：觸發事件、進入第二幕、中點、靈魂黑夜、高潮）。一個「節拍」可能是一場戲，也可能是由三四場戲組成的一個段落，重點在於「故事的推進與角色心境的轉變」。\n分場大綱 (Step Outline)： 偏向微觀的執行藍圖。它比節拍表更詳細，是真正意義上的「一場戲接著一場戲」的清單。作者會按照故事發生的時間順序，把每一場戲（Scene）的人、事、時、地、物以及發生的事件，用簡短的幾句話條列出來。\n總結來說： 你通常會先用「節拍表」確定故事的骨架（起承轉合），然後再將其擴充成「分場大綱」，作為真正開始寫劇本/小說前的施工圖紙。'
  },
  {
    q: 'Q2：為什麼在寫劇本或小說前，一定要先寫分場大綱？不能直接寫嗎？',
    a: '直接動筆寫（俗稱「褲襠派/飛越派」Pantsers）雖然能享受未知的靈感爆發，但極容易在寫到中後段時崩盤。分場大綱提供以下三大不可替代的優勢：\n低成本試錯與修改： 發現故事中段邏輯不通時，移動或刪除大綱上的幾行字（或幾張索引卡），比你寫了三萬字或五十頁劇本後才忍痛刪除，要輕鬆且理智得多。\n檢視節奏與配速 (Pacing)： 當你把所有場景攤開來看，你會立刻發現「這兩個人在咖啡廳聊了五場戲，太拖泥帶水了」或是「從發現線索到與兇手對峙，中間少了一個鋪陳」。\n消除寫作瓶頸： 面對空白的螢幕最容易焦慮。有了分場大綱，你每天的任務就只是「把今天的這三場戲擴寫出來」，大大降低了動筆的心理門檻。'
  },
  {
    q: 'Q3：一個標準的「分場」應該包含哪些核心元素？',
    a: '一場戲不只是「角色從A點走到B點」，它必須具備戲劇意義。在你的分場大綱中，每一場（每一條項目）都應該涵蓋以下資訊：\n場景標題 (Scene Heading)： 內/外景 (INT/EXT) - 地點 - 日/夜。例如：內景 - 廢棄工廠 - 夜\n出場角色： 這一場有誰在場？\n核心行動 (Action)： 發生了什麼具體事件？（例如：主角試圖偷走保險箱裡的機密文件）\n衝突與障礙 (Conflict)： 是什麼阻止角色達成目標？（例如：警衛突然提早巡邏）\n價值轉折 (Value Turn / Shift)： 這是最重要的一點。這場戲結束時，情況是變好（+）還是變壞（-）？角色是否獲得了新資訊？如果一場戲從頭到尾主角的狀態沒有任何改變，這場戲通常可以刪除。'
  },
  {
    q: 'Q4：我該如何開始動手寫我的第一個分場大綱？（實作步驟）',
    a: '不要一開始就從「第一場」寫到「第八十場」，這會讓你迷失在細節裡。請遵循「由大到小」的建構法：\n確立大帳篷（定下關鍵節拍）：\n先寫下故事的 5 到 8 個重大轉折。例如：開場畫面、主角接下任務（觸發事件）、第一次遭遇重大失敗（中點）、失去一切（靈魂黑夜）、最終決戰（高潮）。\n填補骨架（連接節拍）：\n思考「主角如何從 A 點走到 B 點？」開始在這些重大轉折之間，填入必要的橋段。例如，要達到「最終決戰」，主角必須先經歷「尋找武器」、「與盟友和好」、「潛入敵營」這幾場戲。\n細化為分場（一場一場展開）：\n現在，把所有的橋段切分成實際的「場景」。將每個場景編上號碼（S1, S2, S3...），並填入 Q3 提到的核心元素。\n壓力測試：\n從頭到尾讀一遍。問自己：因果關係成立嗎？（因為上一場發生了 X，所以這一場導致了 Y。而不是「然後」發生了 Y。）'
  },
  {
    q: 'Q5：分場大綱通常長什麼樣子？有固定的格式嗎？',
    a: '業界最常見的工具有三種：實體索引卡 (Index Cards)、Excel 試算表、或是純文字清單。\n這裡提供一個純文字清單的標準格式範例：\nS1. 內景 - 銀行大廳 - 日\n角色： 搶匪 A、搶匪 B、經理\n行動： 搶匪 A 壓制群眾，搶匪 B 逼迫經理打開金庫。\n轉折： 搶匪以為控制了局面（+），但經理偷偷按下了無聲警報器（-）。\nS2. 內景 - 警車內（行駛中） - 日\n角色： 老警探、菜鳥警察\n行動： 老警探在抱怨即將退休的無聊生活，無線電突然傳來銀行搶劫的代碼。\n轉折： 菜鳥感到興奮（+），老警探感到煩躁不安（-），兩人急速調頭前往現場。\nS3. 外景 - 銀行正門 - 日\n角色： 搶匪 A、搶匪 B、老警探、菜鳥\n行動： 搶匪帶著錢袋衝出大門，正好撞見剛抵達的警車。雙方拔槍對峙。\n轉折： 搶匪的逃跑計畫被迫中斷（-），一場槍戰即將爆發。\n字數極簡化，不寫具體對白，只寫動作、意圖與情節推進。'
  },
  {
    q: 'Q6：新手在寫分場大綱時，最常犯的錯誤有哪些？',
    a: '寫了太多對白與細節： 分場大綱不是草稿。如果你在一場戲的大綱裡寫了超過 5 句話，甚至開始寫台詞（除非是改變劇情的關鍵金句），你已經寫得太細了。這會讓你失去宏觀審視節奏的能力。\n流水帳（缺少因果關係）： 「主角起床」、「主角吃早餐」、「主角搭公車」。如果這三場戲沒有任何衝突或重要資訊揭露，它們就只是流水帳。應該合併或直接刪除，從「主角在公車上發現自己被跟蹤」開始寫。\n隱藏重要情節： 有些作者習慣在自己腦中保留驚喜，大綱上寫「主角發現了一個驚人的秘密」。千萬不要對自己賣關子。大綱必須精確寫出「主角發現父親就是幕後黑手」，這樣你才能檢視前面的鋪陳夠不夠。\n忘記情緒線 (B-Story)： 大綱裡塞滿了動作、解謎、追逐，卻忘記寫下角色之間的情感交流與內心成長的場景。好的分場大綱會讓「外在衝突」與「內在成長」交替出現。'
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

export const SceneOutline: React.FC<SceneOutlineProps> = ({ scenes, onChange, onBack, onComplete, onSaveDraft, hasScriptContent, onForward }) => {
  const addScene = () => {
    const newScene: Scene = {
      id: crypto.randomUUID(),
      setting: '內景',
      location: '',
      time: '日',
      description: ''
    };
    onChange([...(scenes || []), newScene]);
  };

  const updateScene = (id: string, field: keyof Scene, value: string) => {
    onChange((scenes || []).map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeScene = (id: string) => {
    onChange((scenes || []).filter(s => s.id !== id));
  };

  const safeScenes = scenes || [];
  const isComplete = safeScenes.length > 0 && safeScenes.every(s => s.location.trim() !== '' && s.description.trim() !== '');
  const hasAnyInput = safeScenes.some(s => s.location.trim() !== '' || s.description.trim() !== '');

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

      <h2 className="inner-header">分場大綱</h2>
      <p className="inner-description">建立各場次的發生地點、時間與發生的具體事件。</p>

      <Reorder.Group 
        axis="y" 
        values={safeScenes} 
        onReorder={onChange} 
        style={{ listStyle: 'none', padding: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        {safeScenes.map((scene, index) => (
          <Reorder.Item 
            key={scene.id} 
            value={scene} 
            className="reorder-item-card"
            style={{ 
              display: 'flex', 
              background: 'white', 
              border: '1px solid #d1d5db',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              position: 'relative',
              backgroundColor: 'white'
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
                onClick={() => removeScene(scene.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginTop: 'auto' }}
                title="刪除場次"
              >
                <Trash2 size={20} color="#ef4444" />
              </button>
            </div>

            {/* Content Column */}
            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '80px' }}>
                  第 {index + 1} 場
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '1.1rem' }}>景別</label>
                  <select 
                    value={scene.setting}
                    onChange={e => updateScene(scene.id, 'setting', e.target.value)}
                    style={{ padding: '6px', fontSize: '1rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  >
                    <option value="內景">內景</option>
                    <option value="外景">外景</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '1.1rem' }}>地點</label>
                  <input 
                    type="text" 
                    value={scene.location}
                    onChange={e => updateScene(scene.id, 'location', e.target.value)}
                    placeholder="例如：警局辦公室"
                    style={{ flex: 1, padding: '6px', fontSize: '1rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '1.1rem' }}>時間</label>
                  <select 
                    value={scene.time}
                    onChange={e => updateScene(scene.id, 'time', e.target.value)}
                    style={{ padding: '6px', fontSize: '1rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  >
                    <option value="日">日</option>
                    <option value="夜">夜</option>
                    <option value="晨">晨</option>
                    <option value="昏">昏</option>
                  </select>
                </div>
              </div>

              {/* Textarea */}
              <textarea 
                placeholder="大綱內文..."
                value={scene.description}
                onChange={e => updateScene(scene.id, 'description', e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '12px',
                  resize: 'vertical',
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
          onClick={addScene}
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
          新增場次
        </button>

        <div style={{ display: 'flex', gap: '16px' }}>
          {isComplete && (
            <button 
              className="complete-button"
              onClick={onComplete}
            >
              我完成了分場大綱
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
        <h3 className="guide-title">劇本大綱寫作引導</h3>
        <div className="accordion-list">
          {SCENE_QA.map((qa, index) => (
            <Accordion key={index} q={qa.q} a={qa.a} />
          ))}
        </div>
      </div>
    </div>
  );
};
