import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Timer, RefreshCw, Play, Pause, X, ChevronLeft, Info } from 'lucide-react';

// --- Constants ---
const COLS = 6;
const ROWS = 10;
const INITIAL_ROWS = 4;
const TARGET_MIN = 10;
const TARGET_MAX = 30;
const BLOCK_MIN = 1;
const BLOCK_MAX = 9;

type GameMode = 'classic' | 'time';

interface Block {
  id: string;
  value: number;
  row: number;
  col: number;
}

export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [mode, setMode] = useState<GameMode>('classic');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [target, setTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Initialization ---
  const generateTarget = useCallback(() => {
    return Math.floor(Math.random() * (TARGET_MAX - TARGET_MIN + 1)) + TARGET_MIN;
  }, []);

  const createBlock = (row: number, col: number): Block => ({
    id: Math.random().toString(36).substr(2, 9),
    value: Math.floor(Math.random() * (BLOCK_MAX - BLOCK_MIN + 1)) + BLOCK_MIN,
    row,
    col,
  });

  const initGame = (selectedMode: GameMode) => {
    const initialBlocks: Block[] = [];
    for (let r = 0; r < INITIAL_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        initialBlocks.push(createBlock(r, c));
      }
    }
    setBlocks(initialBlocks);
    setTarget(generateTarget());
    setScore(0);
    setMode(selectedMode);
    setGameState('playing');
    setSelectedIds([]);
    setIsPaused(false);
    if (selectedMode === 'time') setTimeLeft(10);
  };

  const [isShaking, setIsShaking] = useState(false);

  // --- Game Logic ---
  const addRow = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    setBlocks((prev) => {
      // Shift existing blocks up
      const shifted = prev.map((b) => ({ ...b, row: b.row + 1 }));
      
      // Check for game over (if any block reaches ROWS)
      if (shifted.some((b) => b.row >= ROWS)) {
        setGameState('gameover');
        return prev; // Don't add row if game over
      }

      // Add new row at the bottom (row 0)
      const newRow: Block[] = [];
      for (let c = 0; c < COLS; c++) {
        newRow.push(createBlock(0, c));
      }
      return [...shifted, ...newRow];
    });
  }, []);

  const handleBlockClick = (id: string) => {
    if (isPaused || gameState !== 'playing') return;

    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      return [...prev, id];
    });
  };

  // Check sum
  useEffect(() => {
    if (selectedIds.length === 0) return;

    const currentSum = blocks
      .filter((b) => selectedIds.includes(b.id))
      .reduce((sum, b) => sum + b.value, 0);

    if (currentSum === target) {
      // Success!
      setScore((s) => s + selectedIds.length * 10);
      setBlocks((prev) => prev.filter((b) => !selectedIds.includes(b.id)));
      setSelectedIds([]);
      setTarget(generateTarget());
      
      if (mode === 'classic') {
        addRow();
      } else {
        setTimeLeft(10); // Reset timer in time mode
      }
    } else if (currentSum > target) {
      // Failed - clear selection
      setSelectedIds([]);
    }
  }, [selectedIds, target, blocks, mode, generateTarget, addRow]);

  // Time Mode Timer
  useEffect(() => {
    if (gameState === 'playing' && mode === 'time' && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            addRow();
            return 10;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, mode, isPaused, addRow]);

  // High score
  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  // --- Render Helpers ---
  const renderGrid = () => {
    const grid = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      for (let c = 0; c < COLS; c++) {
        const block = blocks.find((b) => b.row === r && b.col === c);
        grid.push(
          <div
            key={`${r}-${c}`}
            className="w-full aspect-square border border-white/5 flex items-center justify-center relative"
          >
            {block && (
              <motion.button
                layoutId={block.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  backgroundColor: selectedIds.includes(block.id) ? '#10b981' : '#262626'
                }}
                exit={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleBlockClick(block.id)}
                className={`w-[90%] h-[90%] rounded-lg flex items-center justify-center text-xl font-bold font-display transition-colors shadow-lg
                  ${selectedIds.includes(block.id) ? 'text-white' : 'text-neutral-300 hover:bg-neutral-700'}
                `}
              >
                {block.value}
              </motion.button>
            )}
          </div>
        );
      }
    }
    return grid;
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 grid-pattern">
      {/* --- Header --- */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold font-display tracking-tight text-emerald-500">数字叠叠乐</h1>
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono uppercase tracking-widest">
            {mode === 'classic' ? <Trophy size={12} /> : <Timer size={12} />}
            {mode === 'classic' ? '经典模式' : '计时模式'}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-neutral-500 font-mono uppercase">分数</div>
            <div className="text-xl font-bold font-display">{score}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-500 font-mono uppercase">最高分</div>
            <div className="text-xl font-bold font-display text-neutral-400">{highScore}</div>
          </div>
        </div>
      </div>

      {/* --- Main Game Area --- */}
      <motion.div 
        animate={isShaking ? { x: [-2, 2, -2, 2, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md aspect-[6/10] bg-neutral-900/50 rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm"
      >
        {gameState === 'menu' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-neutral-950/90">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold font-display mb-2">准备好求和了吗？</h2>
              <p className="text-neutral-400 text-sm">通过达到目标和来消除方块。</p>
            </motion.div>

            <div className="w-full space-y-4">
              <button
                onClick={() => initGame('classic')}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold font-display transition-all flex items-center justify-center gap-3 group"
              >
                <Trophy className="group-hover:scale-110 transition-transform" />
                经典模式
              </button>
              <button
                onClick={() => initGame('time')}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold font-display transition-all flex items-center justify-center gap-3 group"
              >
                <Timer className="group-hover:scale-110 transition-transform" />
                计时模式
              </button>
              <button
                onClick={() => setShowTutorial(true)}
                className="w-full py-3 border border-white/10 hover:bg-white/5 text-neutral-300 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <Info size={18} />
                玩法介绍
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <h2 className="text-5xl font-bold font-display text-red-500 mb-4 uppercase tracking-tighter">游戏结束</h2>
              <div className="mb-8 space-y-2">
                <p className="text-neutral-400 uppercase text-xs font-mono tracking-widest">最终得分</p>
                <p className="text-6xl font-bold font-display">{score}</p>
              </div>
              <button
                onClick={() => setGameState('menu')}
                className="px-8 py-4 bg-white text-black rounded-full font-bold font-display hover:bg-neutral-200 transition-all flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={20} />
                再玩一次
              </button>
            </motion.div>
          </div>
        )}

        {/* --- Game HUD --- */}
        {gameState === 'playing' && (
          <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-neutral-900 to-transparent">
            <div className="flex items-center gap-4">
              <div className="bg-neutral-800/80 px-4 py-2 rounded-xl border border-white/10">
                <div className="text-[10px] text-neutral-500 font-mono uppercase leading-none mb-1">目标</div>
                <motion.div 
                  key={target}
                  initial={{ scale: 1.2, color: '#10b981' }}
                  animate={{ scale: 1, color: '#34d399' }}
                  className="text-3xl font-bold font-display leading-none"
                >
                  {target}
                </motion.div>
              </div>
              {mode === 'time' && (
                <div className="bg-neutral-800/80 px-4 py-2 rounded-xl border border-white/10">
                  <div className="text-[10px] text-neutral-500 font-mono uppercase leading-none mb-1">时间</div>
                  <div className={`text-3xl font-bold font-display leading-none ${timeLeft < 4 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                    {timeLeft}s
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-white/10 transition-colors"
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
              </button>
              <button 
                onClick={() => setGameState('menu')}
                className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* --- Grid --- */}
        <div className="grid grid-cols-6 w-full h-full pt-20 pb-4 px-2">
          <AnimatePresence>
            {renderGrid()}
          </AnimatePresence>
        </div>

        {/* --- Pause Overlay --- */}
        {isPaused && gameState === 'playing' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <h2 className="text-4xl font-bold font-display mb-6">已暂停</h2>
              <button
                onClick={() => setIsPaused(false)}
                className="px-8 py-4 bg-emerald-500 text-white rounded-full font-bold font-display hover:bg-emerald-400 transition-all flex items-center gap-2 mx-auto"
              >
                <Play size={20} />
                继续
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* --- Footer Controls --- */}
      <div className="mt-8 flex gap-4">
        <div className="flex items-center gap-2 text-neutral-500 text-sm font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          求和以达到目标数字
        </div>
      </div>

      {/* --- Tutorial Modal --- */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-neutral-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full relative"
            >
              <button 
                onClick={() => setShowTutorial(false)}
                className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-2xl font-bold font-display mb-6 flex items-center gap-2">
                <Info className="text-emerald-500" />
                玩法介绍
              </h3>
              
              <div className="space-y-6 text-neutral-300">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold shrink-0">1</div>
                  <p>点击方块选择数字。它们不需要相邻！</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold shrink-0">2</div>
                  <p>达到顶部显示的<strong>目标和</strong>即可消除方块。</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold shrink-0">3</div>
                  <p>不要让方块到达屏幕顶部，否则游戏结束！</p>
                </div>
                <div className="bg-neutral-800/50 p-4 rounded-2xl border border-white/5">
                  <p className="text-xs font-mono uppercase text-neutral-500 mb-2">模式</p>
                  <p className="text-sm mb-2"><strong className="text-white">经典：</strong>每次成功求和后新增一行。</p>
                  <p className="text-sm"><strong className="text-white">计时：</strong>每10秒新增一行。快一点！</p>
                </div>
              </div>

              <button
                onClick={() => setShowTutorial(false)}
                className="w-full mt-8 py-4 bg-white text-black rounded-xl font-bold font-display hover:bg-neutral-200 transition-all"
              >
                知道了！
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
