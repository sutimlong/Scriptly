import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Save, Download } from 'lucide-react';
import confetti from 'canvas-confetti';
import './App.css';
import { ScriptEditor } from './components/editor/Editor';
import { CharacterBuilder } from './components/CharacterBuilder';
import type { Character } from './components/CharacterBuilder';
import { SceneOutline } from './components/SceneOutline';
import type { Scene } from './components/SceneOutline';
import type { Descendant } from 'slate';

const initialScriptContent: Descendant[] = [
  { type: 'paragraph', children: [{ text: '' }] },
];

const TypewriterText = ({ text, showCursor = false, speed = 100 }: { text: string, showCursor?: boolean, speed?: number }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayText}
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          style={{ 
            display: 'inline-block', 
            width: '2px', 
            backgroundColor: 'currentColor', 
            marginLeft: '4px', 
            verticalAlign: 'text-bottom',
            height: '1em'
          }}
        />
      )}
    </span>
  );
};

const STEPS = [
  {
    id: 1,
    title: '核心概念與一句話 (Logline)',
    desc: ''
  },
  {
    id: 2,
    title: '故事大綱 (Synopsis / Treatment)',
    desc: ''
  },
  {
    id: 3,
    title: '角色建構 (Character Bios)',
    desc: ''
  },
  {
    id: 4,
    title: '分場大綱 (Step Outline / Beat Sheet)',
    desc: ''
  },
  {
    id: 5,
    title: '劇本',
    desc: ''
  }
];

const LOGLINE_QA = [
  {
    q: 'Q1：什麼是 Logline（一句話大綱）？',
    a: 'Logline 是用一句話（通常在中文 30 到 50 字以內），將整個故事的起承轉合、主角、主要衝突與核心目標精煉出來的敘述。\n它不是宣傳標語（Tagline，例如「在太空中，沒有人能聽見你的尖叫」），宣傳標語是給觀眾看來賣關子的；Logline 是給製片、投資人、導演或是編劇自己看的，它必須毫無保留地講出故事的核心賣點。'
  },
  {
    q: 'Q2：為什麼 Logline 這麼重要？',
    a: '提案（Pitch）的敲門磚： 在電梯裡遇到投資人，你只有 10 秒鐘的時間讓他對你的劇本產生興趣。\n創作的指南針： 在寫到第 50 場戲、面臨卡關時，回頭看你的 Logline。如果現在寫的情節沒有服務這句話的核心衝突，代表你的劇情已經走偏了。\n檢驗故事的強度： 如果你無法用一句話把故事講得精彩，通常代表這個劇本的結構還不夠清晰，或者衝突不夠強烈。'
  },
  {
    q: 'Q3：一個標準的 Logline 必須包含哪些「核心元素」？',
    a: '一個合格的 Logline 必須包含以下四個基石：\n主角與其特質（The Protagonist）： 主角是誰？他有什麼致命的缺點、特質或職業？\n觸發事件（Inciting Incident）： 打破主角平靜生活的那個意外是什麼？\n具體目標（The Goal）： 主角在這個故事中必須完成什麼具體的事情？\n強大的阻礙（The Antagonist/Obstacle）： 誰（或什麼力量）在阻止他？如果失敗了，會有什麼嚴重的後果（Stakes）？'
  },
  {
    q: 'Q4：有什麼公式可以套用嗎？',
    a: '在初學階段，你可以使用這個經典公式來填空：\n「當【觸發事件】發生時，一個【有著某種特質的主角】必須【完成某個具體目標】，否則將面對 / 必須對抗【強大的阻礙或反派】。」\n\n公式套用示範：\n當「一顆巨大的隕石即將撞擊地球」時（觸發事件），一個「喪失鬥志的頂尖鑽油工人」(主角特質) 必須「上太空在隕石上鑽孔放置核彈」(具體目標)，以「拯救全人類免於滅絕」(強大阻礙與後果)。 —— 《世界末日》（Armageddon）'
  },
  {
    q: 'Q5：寫 Logline 時最常犯的錯誤有哪些？',
    a: '使用角色名字： 「約翰發現瑪麗背叛了他...」製片不認識約翰跟瑪麗，名字無法產生畫面感。請改用描述：「一個患有偏執狂的退休警探，發現他深愛的新婚妻子...」\n賣關子，隱藏重要資訊： 「一個男人發現了一個驚天秘密，這將永遠改變他的人生...」這種寫法毫無意義。Logline 不能有懸念，你必須直接說出那個秘密是什麼。\n目標不夠「具體」： 目標不能是「尋找自我」、「學會愛」。這是內在轉變，但在電影中，目標必須是肉眼可見的動作，例如「贏得全國街舞大賽」、「護送機密文件到敵區」。\n缺乏「諷刺性（Irony）」： 這是新手與老手的最大區別。最棒的 Logline 通常帶有反差感。'
  },
  {
    q: 'Q6：如何讓我的 Logline 更有吸引力（Hook）？',
    a: '加入「情境的諷刺性（Irony）」。\n當主角的特質與他必須完成的目標產生極大的衝突時，戲劇張力就會自然產生。\n沒有諷刺性： 一個勇敢的消防員必須衝進火場拯救一名嬰兒。（理所當然，無趣）\n有諷刺性： 一個極度怕水的警察局長，必須在一個四面環海的小島上，獵殺一隻巨大的食人鯊。（《大白鯊》—— 怕水的人被迫下海，這就是諷刺性與張力。）'
  },
  {
    q: 'Q7：可以舉幾個不同類型的 Logline 範例嗎？',
    a: '喜劇/劇情類《寄生上流》：\n一個貧困但狡猾的無業家庭，透過偽造身分與謊言，依附在一個富裕家庭底下工作，卻意外捲入一場失控的血腥階級衝突。\n\n科幻/動作類《駭客任務》：\n一名平凡的電腦駭客發現他所認知的世界只是一個由機器控制的虛擬程式後，必須加入一群地下叛軍，試圖從機器的奴役中拯救人類。\n\n驚悚/犯罪類《沉默的羔羊》：\n一名缺乏經驗的 FBI 實習女探員，必須尋求一名被監禁的極度危險且高智商的食人魔殺手協助，以抓到另一名正在連續剝皮殺人的變態凶手。'
  },
  {
    q: 'Q8：寫完後，我該如何測試我的 Logline 是否合格？',
    a: '你可以拿著這句話問自己三個問題：\n我看得到畫面嗎？ （目標是否具體可見？）\n我知道這是什麼類型嗎？ （這句話讀起來像喜劇、恐怖片還是動作片？）\n主角會不會很輕鬆就成功？ （如果感覺很容易，代表你的「阻礙」設得太弱了。）'
  }
];

const SYNOPSIS_QA = [
  {
    q: 'Q1：故事大綱（Synopsis）與劇本處理稿（Treatment）到底有什麼不同？',
    a: '這兩者都是劇本的藍圖，但篇幅與細節的「顆粒度」有顯著差異。\n故事大綱（Synopsis）： 通常是 1 到 3 頁（約 500 至 2000 字）的精簡概述。它的核心目的是讓製片、投資人或評審在幾分鐘內，一眼看懂故事的起承轉合、主要角色關係，以及最終結局。\n劇本處理稿（Treatment）： 篇幅較長，通常介於 5 到 15 頁，甚至幾十頁。它會按照劇本真實的場景順序，詳細描述每一場戲的動作、視覺氛圍，甚至包含少量的關鍵對白。這是編劇在正式填寫對白前，用來自我檢視結構與節奏的「終極除錯清單」。'
  },
  {
    q: 'Q2：為什麼不能直接寫劇本，非得先寫大綱？',
    a: '直接寫劇本就像沒有工程圖就開始蓋房子，很容易在蓋到一半時發現地基歪了（情節漏洞）或管線不通（角色動機不連貫），最後只能將幾十頁的心血打掉重練。\n大綱的核心目的是「低成本測試」。它讓你在投入幾個月寫出完整劇本前，先測試三幕劇結構是否穩固、因果關係是否成立，以及主角的轉變曲線是否具備說服力。'
  },
  {
    q: 'Q3：一份合格的故事大綱必須涵蓋哪些基本元素？',
    a: '無論篇幅長短，大綱都不能偏離主線，必須清晰交代以下要點：\n主角的現狀與缺陷： 故事開始時，主角的生活狀態為何？他有什麼致命的內在盲點？\n觸發事件（Inciting Incident）： 是什麼突如其來的意外打破了平靜，迫使主角離開舒適圈？\n主要衝突與反派： 主角的具體目標是什麼？誰（或什麼力量）在無所不用其極地阻止他？\n轉折與高潮（Climax）： 故事最大的危機點在哪裡？主角如何克服（或失敗）？\n清晰的結局與轉變： 千萬不要在大綱裡賣關子寫「究竟他能不能成功呢？請看劇本」，必須直接把結局、真相，以及角色最終的內在成長完整寫出來。'
  },
  {
    q: 'Q4：撰寫故事大綱時，有什麼絕對要遵守的格式與語法？',
    a: '一律使用「現在式」： 影視作品是發生在觀眾眼前的當下。請寫「他拔出槍」，絕對不要寫「他當時拔出了槍」或「他將會拔出槍」。\n只寫「看得見、聽得到」的畫面： 這是小說家轉戰編劇最難適應的痛點。不要寫出角色的內心獨白或抽象情緒。把「他感到非常絕望」改成「他癱軟在泥地裡，將家人的照片撕成碎片」。\n角色初次登場的標記： 當重要角色第一次出現在大綱時，通常會將其名字粗體，並加上簡短的括號描述來建立第一印象，例如：阿明（30歲，滿臉倦容的夜班保全）。'
  },
  {
    q: 'Q5：初學者寫大綱最常犯的致命錯誤是什麼？',
    a: '流水帳敘事（And Then...）： 情節之間缺乏連結，變成「然後發生 A，然後發生 B」。正確的寫法應該遵循「因為 / 但是（Therefore / But）」法則：「發生了 A，所以導致了 B，但是 C 出現攪局...」。\n塞入過多無關緊要的細節： 比如詳細描述配角當天穿什麼衣服，或是去買咖啡的過程。大綱寸土寸金，請只保留「推動主線劇情」或「展現角色性格」的關鍵動作。\n過度依賴對白： 大綱是看「動作」與「結構」的，通常不該出現對白。如果某句話是解謎的絕對關鍵，可以引述一兩句，但多數時候請用「兩人發生激烈爭執，最終決裂」來帶過對話。'
  },
  {
    q: 'Q6：遇到「卡關」（寫不下去）時，該如何突破？',
    a: '通常卡關不是因為缺乏靈感，而是「因果關係」斷裂，或是「阻礙」設得太弱。\n此時請回頭檢視你的 Logline，確認主角的目標是否仍然清晰。接著試著問自己：「如果主角在這裡放棄了，他會失去什麼？」如果失去的東西不痛不癢，觀眾就不會在乎，情節自然推不動。試著把賭注（Stakes）拉高，強迫主角做出更艱難的抉擇，故事的齒輪就會重新轉動。'
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


interface RecentFile {
  name: string;
  path: string;
  lastOpened: number;
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'welcome' | 'landing' | 'title' | 'steps' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5'>('welcome');
  const [scriptTitle, setScriptTitle] = useState('');
  const [loglineText, setLoglineText] = useState('');
  const [synopsis1, setSynopsis1] = useState('');
  const [synopsis2, setSynopsis2] = useState('');
  const [synopsis3, setSynopsis3] = useState('');
  const [synopsis4, setSynopsis4] = useState('');
  const [stepValues, setStepValues] = useState<Record<number, string>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [synopsisMode, setSynopsisMode] = useState<'three-act' | 'free' | null>(null);
  const [freeSynopsis, setFreeSynopsis] = useState('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [scriptContent, setScriptContent] = useState<Descendant[]>(initialScriptContent);
  const [currentFileHandle, setCurrentFileHandle] = useState<any>(null);
  const [currentFilePath, setCurrentFilePath] = useState<string>('');
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>(() => {
    try {
      const stored = localStorage.getItem('scriptly-recent-files');
      if (stored) {
        const parsed: RecentFile[] = JSON.parse(stored);
        
        const fs = typeof window !== 'undefined' && (window as any).electronAPI ? (window as any).electronAPI.fs : null;
        if (fs) {
          const existingFiles = parsed.filter(file => {
            try {
              return fs.existsSync(file.path);
            } catch (e) {
              return false;
            }
          });
          if (existingFiles.length !== parsed.length) {
            localStorage.setItem('scriptly-recent-files', JSON.stringify(existingFiles.slice(0, 3)));
          }
          return existingFiles.slice(0, 3);
        } else {
          return parsed.slice(0, 3);
        }
      }
    } catch (e) {}
    return [];
  });
  const [showSavedToast, setShowSavedToast] = useState(false);

  const CURRENT_VERSION = 'v1.1.0';

  useEffect(() => {
    // 模擬載入時間，顯示轉圈動畫
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const addToRecentFiles = (name: string, path: string) => {
    if (!path) return;
    setRecentFiles(prev => {
      const newFiles = [
        { name, path, lastOpened: Date.now() },
        ...prev.filter(f => f.path !== path)
      ].slice(0, 3);
      localStorage.setItem('scriptly-recent-files', JSON.stringify(newFiles));
      return newFiles;
    });
  };

  const handleOpenRecent = async (filePath: string) => {
    try {
      const fs = typeof window !== 'undefined' && (window as any).electronAPI ? (window as any).electronAPI.fs : null;
      if (!fs) {
        alert('此環境不支援直接開啟檔案，請使用「開啟舊檔」。');
        return;
      }
      
      if (!fs.existsSync(filePath)) {
        alert('檔案已遺失或更改位置。');
        setRecentFiles(prev => {
          const newFiles = prev.filter(f => f.path !== filePath);
          localStorage.setItem('scriptly-recent-files', JSON.stringify(newFiles));
          return newFiles;
        });
        return;
      }
      
      const text = fs.readFileSync(filePath, 'utf-8');
      const loadedState = JSON.parse(text);
      
      if (loadedState.version) {
        if (loadedState.scriptTitle !== undefined) setScriptTitle(loadedState.scriptTitle);
        if (loadedState.loglineText !== undefined) setLoglineText(loadedState.loglineText);
        if (loadedState.synopsisMode !== undefined) setSynopsisMode(loadedState.synopsisMode);
        if (loadedState.synopsis1 !== undefined) setSynopsis1(loadedState.synopsis1);
        if (loadedState.synopsis2 !== undefined) setSynopsis2(loadedState.synopsis2);
        if (loadedState.synopsis3 !== undefined) setSynopsis3(loadedState.synopsis3);
        if (loadedState.synopsis4 !== undefined) setSynopsis4(loadedState.synopsis4);
        if (loadedState.freeSynopsis !== undefined) setFreeSynopsis(loadedState.freeSynopsis);
        if (loadedState.characters !== undefined) setCharacters(loadedState.characters);
        if (loadedState.scenes !== undefined) setScenes(loadedState.scenes);
        if (loadedState.scriptContent !== undefined) setScriptContent(loadedState.scriptContent);
        if (loadedState.stepValues !== undefined) setStepValues(loadedState.stepValues);
        if (loadedState.completedSteps !== undefined) setCompletedSteps(loadedState.completedSteps);

        setCurrentFileHandle(null);
        setCurrentFilePath(filePath);
        addToRecentFiles(loadedState.scriptTitle ? `${loadedState.scriptTitle}.sly` : filePath.split(/[\\/]/).pop() || '未知檔名', filePath);
        
        setView('steps');
      } else {
        throw new Error('無效的檔案格式');
      }
    } catch (err: any) {
      console.error('開啟近期檔案時發生錯誤:', err);
      if (err.message && err.message.includes('No handler registered')) {
        alert('主程式尚未更新！請確認您已經在終端機按下 Ctrl+C 並重新執行 `npm run electron:dev`。');
      } else {
        alert('開啟檔案時發生錯誤！請確認檔案格式是否正確。');
      }
    }
  };

  const handleSave = async () => {
    try {
      const stateToSave = {
        version: CURRENT_VERSION,
        scriptTitle,
        loglineText,
        synopsisMode,
        synopsis1,
        synopsis2,
        synopsis3,
        synopsis4,
        freeSynopsis,
        characters,
        scenes,
        scriptContent,
        stepValues,
        completedSteps
      };

      const jsonString = JSON.stringify(stateToSave, null, 2);
      const defaultName = scriptTitle.trim() ? `${scriptTitle.trim()}.sly` : '未命名劇本.sly';

      const electron = typeof window !== 'undefined' && (window as any).electronAPI ? (window as any).electronAPI : null;
      const ipcRenderer = electron ? electron.ipcRenderer : null;
      const fs = typeof window !== 'undefined' && (window as any).electronAPI ? (window as any).electronAPI.fs : null;

      if (fs && currentFilePath && !currentFileHandle) {
        fs.writeFileSync(currentFilePath, jsonString, 'utf-8');
        addToRecentFiles(currentFilePath.split(/[\\/]/).pop() || defaultName, currentFilePath);
      } else if (ipcRenderer && fs) {
        const result = await ipcRenderer.invoke('show-save-dialog', {
          defaultPath: defaultName,
          filters: [
            { name: 'Scriptly 檔案', extensions: ['sly'] }
          ]
        });
        if (result.canceled || !result.filePath) {
          return;
        }
        const savedFilePath = result.filePath;
        fs.writeFileSync(savedFilePath, jsonString, 'utf-8');
        
        setCurrentFilePath(savedFilePath);
        setCurrentFileHandle(null);
        addToRecentFiles(savedFilePath.split(/[\\/]/).pop() || defaultName, savedFilePath);
      } else {
        const blob = new Blob([jsonString], { type: 'application/json' });
        if ('showSaveFilePicker' in window) {
          let handle = currentFileHandle;
          let writable;

          if (handle) {
            try {
              await handle.getFile();
              writable = await handle.createWritable();
            } catch (e: any) {
              if (e.name === 'NotFoundError') {
                alert('檔案已遺失或更改位置，請重新選擇儲存位置。');
                handle = null;
              } else {
                throw e;
              }
            }
          }

          if (!handle) {
            // @ts-ignore
            handle = await window.showSaveFilePicker({
              suggestedName: defaultName,
              types: [{
                description: 'Scriptly 檔案',
                accept: { 'application/json': ['.sly'] },
              }],
            });
            setCurrentFileHandle(handle);
            writable = await handle.createWritable();
          }
          
          if (writable) {
            await writable.write(blob);
            await writable.close();
          }
          
          let savedFilePath = '';
          try {
            const f = await handle.getFile();
            if ((f as any).path) {
              savedFilePath = (f as any).path;
              setCurrentFilePath(savedFilePath);
            }
          } catch (e) {}
          
          if (savedFilePath) {
            addToRecentFiles(handle.name, savedFilePath);
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = defaultName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
      
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('儲存檔案時發生錯誤:', err);
        alert('儲存檔案時發生錯誤！');
      }
    }
  };

  const handleOpen = async () => {
    try {
      const electron = typeof window !== 'undefined' && (window as any).electronAPI ? (window as any).electronAPI : null;
      const ipcRenderer = electron ? electron.ipcRenderer : null;
      const fs = typeof window !== 'undefined' && (window as any).electronAPI ? (window as any).electronAPI.fs : null;

      let loadedState;
      let filePath = '';
      let fileName = '';

      if (ipcRenderer && fs) {
        const result = await ipcRenderer.invoke('show-open-dialog', {
          properties: ['openFile'],
          filters: [
            { name: 'Scriptly 檔案', extensions: ['sly'] },
            { name: 'JSON 檔案', extensions: ['json'] },
            { name: '所有檔案', extensions: ['*'] }
          ]
        });
        
        if (result.canceled || result.filePaths.length === 0) {
          return;
        }
        
        filePath = result.filePaths[0];
        fileName = filePath.split(/[\\/]/).pop() || '未知檔名';
        const text = fs.readFileSync(filePath, 'utf-8');
        loadedState = JSON.parse(text);
      } else {
        // Fallback for non-electron environment
        let file: File = await new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.sly,application/json';
          input.onchange = (e: any) => {
            const selectedFile = e.target.files[0];
            if (selectedFile) resolve(selectedFile);
            else reject(new Error('未選擇檔案'));
          };
          input.click();
        });

        const text = await file.text();
        loadedState = JSON.parse(text);
        filePath = (file as any).path;
        fileName = file.name;
      }

      if (filePath) {
        setCurrentFilePath(filePath);
        setCurrentFileHandle(null);
        addToRecentFiles(fileName, filePath);
      }

      if (loadedState.version) {
        if (loadedState.scriptTitle !== undefined) setScriptTitle(loadedState.scriptTitle);
        if (loadedState.loglineText !== undefined) setLoglineText(loadedState.loglineText);
        if (loadedState.synopsisMode !== undefined) setSynopsisMode(loadedState.synopsisMode);
        if (loadedState.synopsis1 !== undefined) setSynopsis1(loadedState.synopsis1);
        if (loadedState.synopsis2 !== undefined) setSynopsis2(loadedState.synopsis2);
        if (loadedState.synopsis3 !== undefined) setSynopsis3(loadedState.synopsis3);
        if (loadedState.synopsis4 !== undefined) setSynopsis4(loadedState.synopsis4);
        if (loadedState.freeSynopsis !== undefined) setFreeSynopsis(loadedState.freeSynopsis);
        if (loadedState.characters !== undefined) setCharacters(loadedState.characters);
        if (loadedState.scenes !== undefined) setScenes(loadedState.scenes);
        if (loadedState.scriptContent !== undefined) setScriptContent(loadedState.scriptContent);
        if (loadedState.stepValues !== undefined) setStepValues(loadedState.stepValues);
        if (loadedState.completedSteps !== undefined) setCompletedSteps(loadedState.completedSteps);

        setView('steps');
      } else {
        throw new Error('無效的檔案格式');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && err.message !== '未選擇檔案') {
        console.error('開啟檔案時發生錯誤:', err);
        if (err.message && err.message.includes('No handler registered')) {
          alert('主程式尚未更新！請在終端機按下 Ctrl+C 後重新執行 npm run electron:dev');
        } else {
          alert('開啟檔案時發生錯誤！請確認檔案格式是否正確。');
        }
      }
    }
  };

  const hasScriptContent = scriptContent.length > 1 || 
    (scriptContent.length === 1 && (scriptContent[0] as any).children?.[0]?.text?.trim() !== '');

  return (
    <>
      {/* Electron custom titlebar (native Mac style) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          WebkitAppRegion: 'drag',
          zIndex: 99999,
          fontSize: '13px',
          fontWeight: 500,
          color: '#374151',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          background: 'transparent',
          pointerEvents: 'none' // allow clicking through if needed, though drag region absorbs clicks
        } as React.CSSProperties & { WebkitAppRegion: string }}
      >
        Scriptly - {scriptTitle.trim() ? scriptTitle : '未命名劇本'}
      </div>
      <div className="app-container">
        <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              position: 'absolute', 
              top: 0, 
              width: '100%', 
              height: '100%'
            }}
          >
            <div className="loading-spinner" style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #111827',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
            <p style={{ marginTop: '24px', color: '#6b7280', fontSize: '1rem', letterSpacing: '0.05em' }}>正在準備 Scriptly...</p>
          </motion.div>
        ) : view === 'welcome' ? (
          <motion.div
            key="welcome"
            className="welcome-page"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              position: 'absolute', 
              top: '28px', 
              width: '100%', 
              height: 'calc(100% - 28px)'
            }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '8px' }}>歡迎使用</p>
              <h1 style={{ fontSize: '3rem', fontWeight: 300, color: '#111827', marginBottom: '48px', letterSpacing: '0.05em' }}>
                <TypewriterText text="Scriptly" showCursor={true} speed={60} />
              </h1>
              <div style={{ display: 'flex', gap: '24px' }}>
                <button
                  onClick={() => setView('landing')}
                  style={{ 
                    padding: '12px 48px', 
                    border: '1px solid #374151', 
                    background: 'white', 
                    color: '#374151',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
                >
                  新建檔案
                </button>
                <button
                  onClick={handleOpen}
                  style={{ 
                    padding: '12px 48px', 
                    border: '1px solid #374151', 
                    background: 'white', 
                    color: '#374151',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}
                >
                  開啟舊檔.sly
                </button>
              </div>

              <div style={{ marginTop: '48px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '16px', letterSpacing: '0.05em' }}>最近撰寫</div>
                
                {recentFiles.length === 0 && (
                  <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>目前沒有最近撰寫的檔案。</div>
                )}
                
                {recentFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                    {recentFiles.map(file => (
                      <button
                        key={file.path}
                        onClick={() => handleOpenRecent(file.path)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '12px 24px',
                          background: 'transparent',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          width: '100%'
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ fontSize: '1rem', color: '#374151', marginBottom: '4px' }}>{file.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', wordBreak: 'break-all' }}>{file.path}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ paddingBottom: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.8' }}>
              <div>{CURRENT_VERSION}</div>
              <div>蘇廷融寫作與你同在，2026</div>
            </div>
          </motion.div>
        ) : view === 'landing' ? (
          <motion.div
            key="landing"
            className="landing-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <motion.h1
              className="typewriter-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TypewriterText text="依照下列步驟，一步一步來建構你的劇本" showCursor={true} />
            </motion.h1>

            <motion.button
              className="continue-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
              onClick={() => setView('title')}
            >
              繼續
            </motion.button>
          </motion.div>
        ) : view === 'title' ? (
          <motion.div
            key="title"
            className="landing-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.h1
              className="typewriter-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ marginBottom: '60px' }}
            >
              <TypewriterText text="先為您的劇本取一個名稱" showCursor={true} />
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <input
                type="text"
                placeholder="劇本名稱"
                value={scriptTitle}
                onChange={(e) => setScriptTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  border: 'none',
                  borderBottom: '1px solid #9ca3af',
                  outline: 'none',
                  background: 'transparent',
                  marginBottom: '40px',
                  color: '#374151'
                }}
              />
              <AnimatePresence>
                {scriptTitle.trim().length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="continue-button"
                    onClick={() => setView('steps')}
                  >
                    繼續
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : view === 'steps' ? (
          <motion.div
            key="steps"
            className="steps-page"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <h2 className="steps-header">
              依照下列步驟建構您的{scriptTitle.trim() ? `「${scriptTitle}」` : ''}劇本。
            </h2>

            <div className="steps-list">
              {STEPS.map((step, index) => {
                const isCompleted = !!completedSteps[step.id];
                const displayDesc = step.id === 2 ? '' : (stepValues[step.id] || step.desc);

                return (
                  <motion.button
                    key={step.id}
                    className={`step-card ${isCompleted ? 'completed' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    onClick={() => {
                      if (step.id === 1) setView('step1');
                      if (step.id === 2) setView('step2');
                      if (step.id === 3) setView('step3');
                      if (step.id === 4) setView('step4');
                      if (step.id === 5) setView('step5');
                    }}
                  >
                    <div className="step-number">Step {step.id}</div>
                    <div className={`step-icon ${isCompleted ? 'completed' : ''}`}>
                      <Check size={18} />
                    </div>
                    <div className="step-content">
                      <div className="step-title">{step.title}</div>
                      {displayDesc && <div className="step-desc">{displayDesc}</div>}
                    </div>
                  </motion.button>
                );
              })}
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', width: '100%' }}
            >
              <button
                className="save-draft-button"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}
                onClick={handleSave}
              >
                <Save size={20} />
                <span>存檔</span>
              </button>
            </motion.div>
          </motion.div>
        ) : view === 'step1' ? (
          <motion.div
            key="step1"
            className="inner-page"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <button className="back-button" onClick={() => {
              setStepValues(prev => ({ ...prev, 1: loglineText.trim() }));
              setCompletedSteps(prev => (loglineText.trim().length === 0 ? { ...prev, 1: false } : prev));
              setView('steps');
            }}>
              <ChevronLeft size={24} />
              <span>上一頁</span>
            </button>
            
            {hasScriptContent && (
              <button className="forward-button" onClick={() => setView('step5')}>
                <span>前往劇本</span>
                <ChevronRight size={24} />
              </button>
            )}

            <div className="inner-content">
              <div className="hero-section">
                <h2 className="inner-header">核心概念與一句話 (Logline)</h2>
                <p className="inner-description">將整個故事提煉成 20-30 字以內的一句話，確立主角、目標與主要衝突。</p>

                <div className="text-input-container">
                  <textarea
                    className="text-input"
                    placeholder="在此輸入您的 Logline..."
                    value={loglineText}
                    onChange={(e) => {
                      setLoglineText(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    rows={1}
                  />
                </div>

                <AnimatePresence>
                  {loglineText.trim().length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}
                    >
                      <button
                        className="complete-button"
                        onClick={() => {
                          setStepValues(prev => ({ ...prev, 1: loglineText }));
                          setCompletedSteps(prev => ({ ...prev, 1: true }));
                          setView('steps');
                          setTimeout(() => {
                            confetti({
                              particleCount: 150,
                              spread: 80,
                              origin: { y: 0.6 }
                            });
                          }, 1800);
                        }}
                      >
                        我完成了Logline
                      </button>
                      <button
                        className="save-draft-button"
                        onClick={() => {
                          setStepValues(prev => ({ ...prev, 1: loglineText }));
                          setCompletedSteps(prev => ({ ...prev, 1: false }));
                          setView('steps');
                        }}
                      >
                        還沒完成但先儲存
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="guide-section">
                <h3 className="guide-title">Logline 寫作引導</h3>
                <div className="accordion-list">
                  {LOGLINE_QA.map((qa, index) => (
                    <Accordion key={index} q={qa.q} a={qa.a} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : view === 'step2' ? (
          <motion.div
            key="step2"
            className="inner-page"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <button className="back-button" onClick={() => {
              const isAllFilled = synopsisMode === 'three-act'
                ? (synopsis1.trim().length > 0 && synopsis2.trim().length > 0 && synopsis3.trim().length > 0 && synopsis4.trim().length > 0)
                : (synopsisMode === 'free' ? freeSynopsis.trim().length > 0 : false);
              setCompletedSteps(prev => (!isAllFilled ? { ...prev, 2: false } : prev));
              setView('steps');
            }}>
              <ChevronLeft size={24} />
              <span>上一頁</span>
            </button>
            
            {hasScriptContent && (
              <button className="forward-button" onClick={() => setView('step5')}>
                <span>前往劇本</span>
                <ChevronRight size={24} />
              </button>
            )}

            <div className="inner-content">
              <h2 className="inner-header">故事大綱 (Synopsis / Treatment)</h2>

              {synopsisMode === null ? (
                <div className="mode-selection-container">
                  <p className="selection-description">請選擇您希望使用的寫作格式：</p>
                  <div className="mode-cards">
                    <button className="mode-card" onClick={() => setSynopsisMode('three-act')}>
                      <h3>使用三幕劇格式</h3>
                      <p>適合初學者。透過結構化的引導，幫助您建立完整的故事弧線與角色衝突。</p>
                    </button>
                    <button className="mode-card" onClick={() => setSynopsisMode('free')}>
                      <h3>自由撰寫</h3>
                      <p>適合已有經驗的創作者。提供純粹的書寫空間，讓您的靈感自由發揮不受限制。</p>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mode-active-header">
                    <span className="current-mode-label">
                      目前模式：{synopsisMode === 'three-act' ? '三幕劇格式' : '自由撰寫'}
                    </span>
                    <button className="switch-mode-btn" onClick={() => setSynopsisMode(null)}>
                      更換格式
                    </button>
                  </div>

                  {synopsisMode === 'three-act' ? (
                <>
                  <div className="synopsis-section">
                    <h3>1. 第一幕：建立日常與突發危機</h3>
                    <p>清楚點出主角是誰、他想要什麼（外在目標）、他需要什麼（內在缺陷），以及那個迫使他行動的「觸發事件」。</p>
                    <div className="text-input-container">
                      <textarea
                        className="text-input"
                        placeholder="輸入..."
                        value={synopsis1}
                        onChange={(e) => {
                          setSynopsis1(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        rows={1}
                      />
                    </div>
                  </div>

                  <div className="synopsis-section">
                    <h3>2. 第二幕（上）：踏入未知與假性勝利</h3>
                    <p>主角被迫離開舒適圈，採取行動應對危機。這是一個充滿試探與碰撞的階段，主角通常會試圖用他「舊有的錯誤心態」去解決新問題。</p>
                    <div className="text-input-container">
                      <textarea
                        className="text-input"
                        placeholder="輸入..."
                        value={synopsis2}
                        onChange={(e) => {
                          setSynopsis2(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        rows={1}
                      />
                    </div>
                  </div>

                  <div className="synopsis-section">
                    <h3>3. 第二幕（下）：情勢失控與墜入谷底</h3>
                    <p>中間點之後，麻煩會以倍數成長。反派或外在阻礙開始全面反撲，主角的舊方法徹底失效，將他逼向絕境。</p>
                    <div className="text-input-container">
                      <textarea
                        className="text-input"
                        placeholder="輸入..."
                        value={synopsis3}
                        onChange={(e) => {
                          setSynopsis3(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        rows={1}
                      />
                    </div>
                  </div>

                  <div className="synopsis-section">
                    <h3>4. 第三幕：覺醒與最終對決</h3>
                    <p>主角在谷底痛定思痛，放下了第一幕時的執念，以全新的姿態迎戰最終的高潮。</p>
                    <div className="text-input-container">
                      <textarea
                        className="text-input"
                        placeholder="輸入..."
                        value={synopsis4}
                        onChange={(e) => {
                          setSynopsis4(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        rows={1}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="synopsis-section free-writing">
                  <div className="text-input-container" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <textarea
                      className="text-input"
                      placeholder="請自由撰寫你的故事大綱（約 3000 字）..."
                      value={freeSynopsis}
                      onChange={(e) => {
                        setFreeSynopsis(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      rows={20}
                      maxLength={3000}
                    />
                    <div className="word-count" style={{ textAlign: 'right', fontSize: '0.8rem', color: '#666', marginTop: '8px', whiteSpace: 'nowrap', alignSelf: 'flex-end' }}>
                      {freeSynopsis.length} / 3000 字元
                    </div>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {synopsisMode !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}
                  >
                    {((synopsisMode === 'three-act' && synopsis1.trim().length > 0 && synopsis2.trim().length > 0 && synopsis3.trim().length > 0 && synopsis4.trim().length > 0) || (synopsisMode === 'free' && freeSynopsis.trim().length > 0)) && (
                      <button
                        className="complete-button"
                        onClick={() => {
                          setCompletedSteps(prev => ({ ...prev, 2: true }));
                          setView('steps');
                          
                          setTimeout(() => {
                            confetti({
                              particleCount: 150,
                              spread: 80,
                              origin: { y: 0.6 }
                            });
                          }, 1500);
                        }}
                      >
                        我完成了故事大綱
                      </button>
                    )}
                    {((synopsisMode === 'three-act' && (synopsis1.trim().length > 0 || synopsis2.trim().length > 0 || synopsis3.trim().length > 0 || synopsis4.trim().length > 0)) || (synopsisMode === 'free' && freeSynopsis.trim().length > 0)) && (
                      <button
                        className="save-draft-button"
                        onClick={() => {
                          setCompletedSteps(prev => ({ ...prev, 2: false }));
                          setView('steps');
                        }}
                      >
                        還沒完成但先儲存
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="guide-section" style={{ marginTop: '40px' }}>
                <h3 className="guide-title">故事大綱寫作引導</h3>
                <div className="accordion-list">
                  {SYNOPSIS_QA.map((qa, index) => (
                    <Accordion key={index} q={qa.q} a={qa.a} />
                  ))}
                </div>
              </div>
              
              </>
              )}
            </div>
          </motion.div>
        ) : view === 'step3' ? (
          <motion.div
            key="step3"
            className="inner-page"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <CharacterBuilder 
              characters={characters}
              onChange={setCharacters}
              onBack={() => {
                setView('steps');
              }} 
              onSaveDraft={() => {
                setCompletedSteps(prev => ({ ...prev, 3: false }));
                setView('steps');
              }}
              onComplete={() => {
                setCompletedSteps(prev => ({ ...prev, 3: true }));
                setView('steps');
                setTimeout(() => {
                  confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 }
                  });
                }, 1500);
              }}
              hasScriptContent={hasScriptContent}
              onForward={() => setView('step5')}
            />
          </motion.div>
        ) : view === 'step4' ? (
          <motion.div
            key="step4"
            className="inner-page"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <SceneOutline 
              scenes={scenes}
              onChange={setScenes}
              onBack={() => {
                setView('steps');
              }} 
              onSaveDraft={() => {
                setCompletedSteps(prev => ({ ...prev, 4: false }));
                setView('steps');
              }}
              onComplete={() => {
                setCompletedSteps(prev => ({ ...prev, 4: true }));
                setView('steps');
                setTimeout(() => {
                  confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 }
                  });
                }, 1500);
              }}
              hasScriptContent={hasScriptContent}
              onForward={() => setView('step5')}
            />
          </motion.div>
        ) : view === 'step5' ? (
          <motion.div
            key="step5"
            className="script-page"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <ScriptEditor 
              fileName={scriptTitle}
              onBack={() => setView('steps')}
              content={scriptContent}
              onChange={setScriptContent}
              scenes={scenes}
              characters={characters}
              onScenesChange={setScenes}
              onCharactersChange={setCharacters}
              onSave={handleSave}
              onAddSceneOutline={() => {
                const newScene = {
                  id: crypto.randomUUID(),
                  setting: '內景',
                  location: '',
                  time: '日',
                  description: ''
                };
                setScenes([...scenes, newScene]);
                setView('step4');
                setTimeout(() => {
                  const items = document.querySelectorAll('.reorder-item-card');
                  if (items.length > 0) {
                    items[items.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 1000);
              }}
              onAddCharacter={() => {
                const newChar = {
                  id: crypto.randomUUID(),
                  name: '',
                  description: ''
                };
                setCharacters([...characters, newChar]);
                setView('step3');
                setTimeout(() => {
                  const items = document.querySelectorAll('.reorder-item-card');
                  if (items.length > 0) {
                    items[items.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 1000);
              }}
              onGoToSceneOutline={() => setView('step4')}
              onGoToCharacter={() => setView('step3')}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      
      <AnimatePresence>
        {showSavedToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            style={{
              position: 'fixed',
              bottom: '40px',
              left: '50%',
              backgroundColor: '#10b981',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '8px',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              zIndex: 100000,
              fontSize: '1rem',
              letterSpacing: '0.05em'
            }}
          >
            已存檔
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}

export default App;
