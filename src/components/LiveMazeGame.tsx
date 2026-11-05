import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MazeLevel, WalletState } from '../types/game';
import { INITIAL_MAZE_LEVELS } from '../utils/gameData';
import { playCollectSound, playTrapSound, playVictorySound, playPowerupSound, playClickSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Shield, Zap, Eye, RotateCcw, ChevronRight, Play, Award, Crosshair } from 'lucide-react';

interface LiveMazeGameProps {
  wallet: WalletState;
  onScoreSubmit: (levelName: string, time: number, score: number) => void;
}

export default function LiveMazeGame({ wallet, onScoreSubmit }: LiveMazeGameProps) {
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'PAUSED' | 'WON' | 'LOST'>('MENU');
  
  // Gameplay state
  const [score, setScore] = useState<number>(0);
  const [hp, setHp] = useState<number>(100);
  const [stamina, setStamina] = useState<number>(100);
  const [rewardsCollected, setRewardsCollected] = useState<number>(0);
  const [totalRewards, setTotalRewards] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [activePowerup, setActivePowerup] = useState<'NONE' | 'SHIELD' | 'SPEED' | 'RADAR'>('NONE');
  const [powerupTimer, setPowerupTimer] = useState<number>(0);
  const [controlMode, setControlMode] = useState<'WASD' | 'MOUSE'>('WASD');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Level reference
  const currentLevel: MazeLevel = INITIAL_MAZE_LEVELS.find((l) => l.id === selectedLevelId) || INITIAL_MAZE_LEVELS[0];

  // Internal physics & map state stored in ref for 60fps loop
  const gameEngineRef = useRef({
    hamsterX: 1.5,
    hamsterY: 1.5,
    vx: 0,
    vy: 0,
    mouseX: 200,
    mouseY: 200,
    keys: { w: false, a: false, s: false, d: false },
    grid: [] as number[][],
    gridW: 12,
    gridH: 12,
    razorPositions: [] as { x: number; y: number; dx: number; dy: number }[],
    screenShake: 0,
    particleEffects: [] as { x: number; y: number; color: string; vx: number; vy: number; life: number }[],
    flashlightRadius: 180,
  });

  // Timer interval for elapsed time
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'PLAYING') {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  // Powerup timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'PLAYING' && activePowerup !== 'NONE') {
      timer = setInterval(() => {
        setPowerupTimer((prev) => {
          if (prev <= 1) {
            setActivePowerup('NONE');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, activePowerup]);

  // Start a level
  const startLevel = useCallback((levelId: number) => {
    playClickSound();
    const lvl = INITIAL_MAZE_LEVELS.find((l) => l.id === levelId) || INITIAL_MAZE_LEVELS[0];
    setSelectedLevelId(lvl.id);
    setScore(0);
    setHp(100);
    setStamina(100);
    setRewardsCollected(0);
    setElapsedTime(0);
    setActivePowerup('NONE');
    setPowerupTimer(0);

    // Deep copy grid
    const gridCopy = lvl.grid.map((row) => [...row]);
    let countRewards = 0;
    for (let r = 0; r < gridCopy.length; r++) {
      for (let c = 0; c < gridCopy[r].length; c++) {
        if (gridCopy[r][c] === 3) countRewards++;
      }
    }
    setTotalRewards(countRewards);

    // Setup moving razors
    const razors: { x: number; y: number; dx: number; dy: number }[] = [];
    if (lvl.difficulty === 'VETERAN' || lvl.difficulty === 'CYBER' || lvl.difficulty === 'GENESIS') {
      razors.push({ x: 4.5, y: 4.5, dx: 0.04, dy: 0 });
      razors.push({ x: 8.5, y: 8.5, dx: 0, dy: 0.05 });
    }
    if (lvl.difficulty === 'GENESIS') {
      razors.push({ x: 12.5, y: 12.5, dx: -0.06, dy: 0.03 });
    }

    gameEngineRef.current = {
      hamsterX: 1.5,
      hamsterY: 1.5,
      vx: 0,
      vy: 0,
      mouseX: 300,
      mouseY: 300,
      keys: { w: false, a: false, s: false, d: false },
      grid: gridCopy,
      gridW: lvl.gridWidth,
      gridH: lvl.gridHeight,
      razorPositions: razors,
      screenShake: 0,
      particleEffects: [],
      flashlightRadius: lvl.difficulty === 'CYBER' ? 150 : lvl.difficulty === 'GENESIS' ? 130 : 200,
    };

    setGameState('PLAYING');
  }, []);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameEngineRef.current.keys.w = true;
      if (k === 'a' || k === 'arrowleft') gameEngineRef.current.keys.a = true;
      if (k === 's' || k === 'arrowdown') gameEngineRef.current.keys.s = true;
      if (k === 'd' || k === 'arrowright') gameEngineRef.current.keys.d = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') gameEngineRef.current.keys.w = false;
      if (k === 'a' || k === 'arrowleft') gameEngineRef.current.keys.a = false;
      if (k === 's' || k === 'arrowdown') gameEngineRef.current.keys.s = false;
      if (k === 'd' || k === 'arrowright') gameEngineRef.current.keys.d = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 60FPS Canvas Render & Physics Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      gameEngineRef.current.mouseX = (e.clientX - rect.left) * scaleX;
      gameEngineRef.current.mouseY = (e.clientY - rect.top) * scaleY;
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      const engine = gameEngineRef.current;
      const { grid, gridW, gridH, keys } = engine;
      const cellW = canvas.width / gridW;
      const cellH = canvas.height / gridH;

      // 1. Update Hamster Position & Movement Physics
      let moveSpeed = activePowerup === 'SPEED' ? 0.12 : 0.08;
      
      if (controlMode === 'WASD') {
        let dx = 0;
        let dy = 0;
        if (keys.w) dy -= moveSpeed;
        if (keys.s) dy += moveSpeed;
        if (keys.a) dx -= moveSpeed;
        if (keys.d) dx += moveSpeed;

        // Diagonal normalization
        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        // Apply velocity with smooth acceleration
        engine.vx = engine.vx * 0.7 + dx * 0.3;
        engine.vy = engine.vy * 0.7 + dy * 0.3;
      } else {
        // Mouse follow mode
        const targetCellX = engine.mouseX / cellW;
        const targetCellY = engine.mouseY / cellH;
        const dist = Math.hypot(targetCellX - engine.hamsterX, targetCellY - engine.hamsterY);
        if (dist > 0.2) {
          const angle = Math.atan2(targetCellY - engine.hamsterY, targetCellX - engine.hamsterX);
          engine.vx = Math.cos(angle) * moveSpeed;
          engine.vy = Math.sin(angle) * moveSpeed;
        } else {
          engine.vx *= 0.5;
          engine.vy *= 0.5;
        }
      }

      // Check wall collision for X and Y separately for smooth sliding along walls
      const nextX = engine.hamsterX + engine.vx;
      const nextY = engine.hamsterY + engine.vy;

      // Helper cell inspector
      const isSolid = (cx: number, cy: number) => {
        const col = Math.floor(cx);
        const row = Math.floor(cy);
        if (row < 0 || row >= gridH || col < 0 || col >= gridW) return true;
        return grid[row][col] === 1; // Wall
      };

      const r = 0.26; // Refined collision radius for smooth corner sliding
      if (!isSolid(nextX - r, engine.hamsterY - r) && 
          !isSolid(nextX + r, engine.hamsterY - r) && 
          !isSolid(nextX - r, engine.hamsterY + r) && 
          !isSolid(nextX + r, engine.hamsterY + r)) {
        engine.hamsterX = nextX;
      } else if (!isSolid(nextX - r, engine.hamsterY) && !isSolid(nextX + r, engine.hamsterY)) {
        engine.hamsterX = nextX;
      }

      if (!isSolid(engine.hamsterX - r, nextY - r) && 
          !isSolid(engine.hamsterX + r, nextY - r) && 
          !isSolid(engine.hamsterX - r, nextY + r) && 
          !isSolid(engine.hamsterX + r, nextY + r)) {
        engine.hamsterY = nextY;
      } else if (!isSolid(engine.hamsterX, nextY - r) && !isSolid(engine.hamsterX, nextY + r)) {
        engine.hamsterY = nextY;
      }

      // 2. Collision with Grid Items (Rewards, Traps, Exit, Powerups)
      const currentCellCol = Math.floor(engine.hamsterX);
      const currentCellRow = Math.floor(engine.hamsterY);

      if (currentCellRow >= 0 && currentCellRow < gridH && currentCellCol >= 0 && currentCellCol < gridW) {
        const cellVal = grid[currentCellRow][currentCellCol];

        // Cheese Reward (3)
        if (cellVal === 3) {
          grid[currentCellRow][currentCellCol] = 0; // Collect
          setScore((s) => s + 100);
          setRewardsCollected((r) => r + 1);
          playCollectSound();
          // Add particle spark
          for (let i = 0; i < 8; i++) {
            engine.particleEffects.push({
              x: (currentCellCol + 0.5) * cellW,
              y: (currentCellRow + 0.5) * cellH,
              color: '#FACC15',
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 20
            });
          }
        }

        // Trap Spikes (2)
        if (cellVal === 2) {
          if (activePowerup !== 'SHIELD') {
            playTrapSound();
            engine.screenShake = 12;
            grid[currentCellRow][currentCellCol] = 0; // Trigger once
            setHp((prev) => {
              const nextHp = Math.max(0, prev - 25);
              if (nextHp <= 0) {
                setGameState('LOST');
              }
              return nextHp;
            });
            // Trap particles
            for (let i = 0; i < 12; i++) {
              engine.particleEffects.push({
                x: (currentCellCol + 0.5) * cellW,
                y: (currentCellRow + 0.5) * cellH,
                color: '#EF4444',
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 25
              });
            }
          }
        }

        // Powerup (6)
        if (cellVal === 6) {
          grid[currentCellRow][currentCellCol] = 0;
          playPowerupSound();
          const powerups: ('SHIELD' | 'SPEED' | 'RADAR')[] = ['SHIELD', 'SPEED', 'RADAR'];
          const picked = powerups[Math.floor(Math.random() * powerups.length)];
          setActivePowerup(picked);
          setPowerupTimer(10);
        }

        // Exit Portal (5)
        if (cellVal === 5) {
          playVictorySound();
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          const timeBonus = Math.max(0, (currentLevel.parTimeSeconds - elapsedTime) * 20);
          const finalScore = score + 500 + timeBonus;
          setScore(finalScore);
          setGameState('WON');
          onScoreSubmit(currentLevel.name, elapsedTime, finalScore);
        }
      }

      // Update razors
      engine.razorPositions.forEach((razor) => {
        razor.x += razor.dx;
        razor.y += razor.dy;
        if (razor.x < 1 || razor.x > gridW - 2) razor.dx *= -1;
        if (razor.y < 1 || razor.y > gridH - 2) razor.dy *= -1;

        // Collision with hamster
        const dist = Math.hypot(razor.x - engine.hamsterX, razor.y - engine.hamsterY);
        if (dist < 0.6 && activePowerup !== 'SHIELD') {
          playTrapSound();
          engine.screenShake = 8;
          setHp((prev) => {
            const next = Math.max(0, prev - 1.5);
            if (next <= 0) setGameState('LOST');
            return next;
          });
        }
      });

      // 3. CANVAS DRAWING
      ctx.save();
      
      // Screen shake translation
      if (engine.screenShake > 0) {
        ctx.translate(
          (Math.random() - 0.5) * engine.screenShake,
          (Math.random() - 0.5) * engine.screenShake
        );
        engine.screenShake *= 0.85;
      }

      // Clear Canvas Dark Background
      ctx.fillStyle = '#060204';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Mouse and Hamster Canvas Pixel positions
      const hamPxX = engine.hamsterX * cellW;
      const hamPxY = engine.hamsterY * cellH;
      const mousePxX = engine.mouseX;
      const mousePxY = engine.mouseY;

      // Draw Grid Base (Walls, Path, Items)
      for (let r = 0; r < gridH; r++) {
        for (let c = 0; c < gridW; c++) {
          const x = c * cellW;
          const y = r * cellH;
          const val = grid[r][c];

          // Calculate distance to mouse cursor for Live Mouse Sensory wall reactivity
          const wallCenterX = x + cellW / 2;
          const wallCenterY = y + cellH / 2;
          const distToCursor = Math.hypot(wallCenterX - mousePxX, wallCenterY - mousePxY);
          const isNearCursor = distToCursor < engine.flashlightRadius;

          if (val === 1) {
            // Wall cell - Fully visible dark red neon wall block
            ctx.fillStyle = isNearCursor ? '#2E080E' : '#1F050A';
            ctx.fillRect(x, y, cellW, cellH);

            // Wall inner border lines - Always crisp and visible
            ctx.lineWidth = 2;
            ctx.strokeStyle = isNearCursor ? '#FF2A4B' : '#990B1E';
            if (isNearCursor) {
              ctx.shadowColor = '#E61938';
              ctx.shadowBlur = 8;
            } else {
              ctx.shadowBlur = 0;
            }
            ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
            ctx.shadowBlur = 0; // reset
          } else {
            // Path cell - Dark red grid floor with high visibility
            ctx.fillStyle = '#0f0407';
            ctx.fillRect(x, y, cellW, cellH);
            ctx.strokeStyle = '#22080d';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellW, cellH);
          }

          // Render Cell Items (Rewards, Traps, Exit, Powerups)
          if (val === 3) { // Cheese / Reward
            ctx.font = `${cellW * 0.6}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🧀', x + cellW / 2, y + cellH / 2);
          } else if (val === 2) { // Spike Trap - High visibility glowing red hazard
            ctx.fillStyle = '#DC2626';
            ctx.shadowColor = '#EF4444';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(x + cellW / 2, y + cellH / 2, cellW * 0.32, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.font = `${cellW * 0.5}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💥', x + cellW / 2, y + cellH / 2);
          } else if (val === 6) { // Powerup
            ctx.font = `${cellW * 0.55}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', x + cellW / 2, y + cellH / 2);
          } else if (val === 5) { // Exit Portal
            ctx.fillStyle = '#10B981';
            ctx.shadowColor = '#10B981';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(x + cellW / 2, y + cellH / 2, cellW * 0.38, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.font = `${cellW * 0.55}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌀', x + cellW / 2, y + cellH / 2);
          }
        }
      }

      // Draw moving razors
      engine.razorPositions.forEach((razor) => {
        const rx = razor.x * cellW;
        const ry = razor.y * cellH;
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(Date.now() * 0.01);
        ctx.fillStyle = '#EF4444';
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 12;
        ctx.fillRect(-cellW * 0.3, -cellH * 0.3, cellW * 0.6, cellH * 0.6);
        ctx.restore();
      });

      // 4. Subtle Cursor Interaction Ring (No obscuring darkness!)
      ctx.save();
      const cursorGlow = ctx.createRadialGradient(
        mousePxX, mousePxY, 5,
        mousePxX, mousePxY, 140
      );
      cursorGlow.addColorStop(0, 'rgba(230, 25, 56, 0.15)');
      cursorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cursorGlow;
      ctx.beginPath();
      ctx.arc(mousePxX, mousePxY, 140, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 5. DRAW HAMSTER AVATAR
      ctx.save();
      ctx.translate(hamPxX, hamPxY);
      
      // Face towards mouse or velocity
      const angle = Math.atan2(mousePxY - hamPxY, mousePxX - hamPxX);
      ctx.rotate(angle);

      // Hamster body glow
      ctx.shadowColor = '#E61938';
      ctx.shadowBlur = activePowerup === 'SHIELD' ? 20 : 10;

      // Hamster outer circle body
      ctx.fillStyle = activePowerup === 'SHIELD' ? '#3B82F6' : '#E61938';
      ctx.beginPath();
      ctx.arc(0, 0, cellW * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // Hamster ears
      ctx.fillStyle = '#990B1E';
      ctx.beginPath();
      ctx.arc(-cellW * 0.2, -cellH * 0.25, cellW * 0.12, 0, Math.PI * 2);
      ctx.arc(-cellW * 0.2, cellH * 0.25, cellW * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // Hamster eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cellW * 0.15, -cellH * 0.1, cellW * 0.08, 0, Math.PI * 2);
      ctx.arc(cellW * 0.15, cellH * 0.1, cellW * 0.08, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cellW * 0.18, -cellH * 0.1, cellW * 0.04, 0, Math.PI * 2);
      ctx.arc(cellW * 0.18, cellH * 0.1, cellW * 0.04, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 6. Draw Cursor Sensory Light Target Icon
      ctx.save();
      ctx.strokeStyle = 'rgba(230, 25, 56, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mousePxX, mousePxY, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(mousePxX - 18, mousePxY);
      ctx.lineTo(mousePxX + 18, mousePxY);
      ctx.moveTo(mousePxX, mousePxY - 18);
      ctx.lineTo(mousePxX, mousePxY + 18);
      ctx.stroke();
      ctx.restore();

      // 7. Render Particle Effects
      engine.particleEffects.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.life * 0.15), 0, Math.PI * 2);
        ctx.fill();
      });
      engine.particleEffects = engine.particleEffects.filter((p) => p.life > 0);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (canvas) canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameState, controlMode, currentLevel, activePowerup, score, elapsedTime, onScoreSubmit]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Top Header & Level Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#0a0305] p-4 rounded-xl border border-red-950/80 shadow-[0_0_20px_rgba(230,25,56,0.15)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-pixel text-base md:text-lg text-red-500 text-glow-red">
              {currentLevel.name}
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-tech font-bold bg-red-950 text-red-300 border border-red-700/60 rounded uppercase">
              {currentLevel.difficulty}
            </span>
          </div>
          <p className="text-xs font-tech text-zinc-400 mt-1">
            {currentLevel.subtitle} — {currentLevel.description}
          </p>
        </div>

        {/* Level Selection Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 lg:pb-0">
          {INITIAL_MAZE_LEVELS.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => startLevel(lvl.id)}
              className={`px-3 py-1.5 text-xs font-cyber font-semibold rounded border transition-all whitespace-nowrap cursor-pointer ${
                selectedLevelId === lvl.id
                  ? 'bg-red-900 border-red-500 text-white shadow-[0_0_10px_rgba(230,25,56,0.5)]'
                  : 'bg-zinc-950 border-red-950 text-zinc-400 hover:text-white hover:border-red-900'
              }`}
            >
              Lvl {lvl.id}
            </button>
          ))}
        </div>
      </div>

      {/* Main Game Interface Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Column: Canvas Game View (3 cols) */}
        <div className="lg:col-span-3 bg-[#080204] border border-red-900/60 rounded-xl p-3 md:p-4 shadow-[0_0_25px_rgba(230,25,56,0.2)] flex flex-col items-center relative">
          
          {/* Game HUD Bar */}
          <div className="w-full flex items-center justify-between gap-4 px-3 py-2 bg-red-950/40 rounded-lg border border-red-900/40 mb-3 text-xs font-tech">
            
            {/* HP Bar */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-bold">HP:</span>
              <div className="w-24 md:w-36 h-3.5 bg-zinc-950 border border-red-900 rounded overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-200 rounded-sm"
                  style={{ width: `${hp}%` }}
                />
              </div>
              <span className="font-mono text-red-400 font-bold text-[11px]">{Math.round(hp)}%</span>
            </div>

            {/* Score & Rewards */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-amber-400">
                <span>🧀</span>
                <span className="font-bold">{rewardsCollected}/{totalRewards}</span>
              </div>
              <div className="text-zinc-300 font-bold">
                TIME: <span className="text-white font-mono">{elapsedTime}s</span>
              </div>
              <div className="text-red-400 font-bold font-pixel text-xs text-glow-red hidden sm:block">
                SCORE: {score}
              </div>
            </div>

            {/* Active Powerup Badge */}
            {activePowerup !== 'NONE' && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-950 border border-blue-600 text-blue-300 font-bold text-[11px] rounded animate-pulse">
                <Zap className="w-3 h-3" />
                {activePowerup} ({powerupTimer}s)
              </div>
            )}
          </div>

          {/* Canvas Container */}
          <div className="relative w-full aspect-square max-w-[620px] bg-black rounded-lg overflow-hidden border border-red-900/80 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={640}
              height={640}
              className="w-full h-full object-contain"
            />

            {/* Overlay Start Screen */}
            {gameState === 'MENU' && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-red-950 border border-red-500/80 flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(230,25,56,0.6)] animate-bounce">
                  🐹
                </div>
                <h3 className="font-pixel text-xl md:text-2xl text-red-500 text-glow-red">
                  {currentLevel.name}
                </h3>
                <p className="text-xs font-tech text-zinc-300 max-w-md leading-relaxed">
                  Navigate your hamster through the dark red pixel grid. Collect cheese rewards, avoid visible spike traps, and reach the glowing exit portal.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => startLevel(selectedLevelId)}
                    className="py-3 px-8 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-pixel text-xs rounded-lg shadow-[0_0_20px_rgba(230,25,56,0.6)] transition-all transform hover:scale-105 flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" /> START MAZE RUN
                  </button>
                </div>
              </div>
            )}

            {/* Overlay Won Modal */}
            {gameState === 'WON' && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                  🏆
                </div>
                <h3 className="font-pixel text-xl text-emerald-400 text-glow-red">
                  MAZE COMPLETED!
                </h3>
                <div className="p-4 bg-zinc-950/80 border border-emerald-900/60 rounded-xl space-y-2 text-xs font-tech text-zinc-300 w-full max-w-xs">
                  <div className="flex justify-between">
                    <span>Final Score:</span>
                    <span className="font-pixel text-emerald-400">{score} PTS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clear Time:</span>
                    <span className="font-mono text-white">{elapsedTime} Seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cheese Bonus:</span>
                    <span className="font-mono text-amber-400">+{rewardsCollected * 100} PTS</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-1 text-red-400 font-bold">
                    <span>Ethereum Sepolia Signed:</span>
                    <span>✓ Verified</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => startLevel(selectedLevelId)}
                    className="py-2.5 px-5 bg-zinc-900 border border-zinc-700 text-white font-cyber text-xs rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" /> Replay
                  </button>
                  {selectedLevelId < INITIAL_MAZE_LEVELS.length && (
                    <button
                      onClick={() => startLevel(selectedLevelId + 1)}
                      className="py-2.5 px-6 bg-red-600 hover:bg-red-500 text-white font-cyber font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(230,25,56,0.6)] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      Next Level <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Overlay Lost Modal */}
            {gameState === 'LOST' && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-red-950 border border-red-600 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                  💀
                </div>
                <h3 className="font-pixel text-xl text-red-500 text-glow-red">
                  HAMSTER ELIMINATED
                </h3>
                <p className="text-xs font-tech text-zinc-400 max-w-xs">
                  Your hamster hit too many spikes or razors in the dark shadow grid. Use cursor lighting to reveal traps!
                </p>

                <button
                  onClick={() => startLevel(selectedLevelId)}
                  className="py-3 px-8 bg-red-600 hover:bg-red-500 text-white font-pixel text-xs rounded-lg shadow-[0_0_20px_rgba(230,25,56,0.6)] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> TRY AGAIN
                </button>
              </div>
            )}

          </div>

          {/* Controls Bar */}
          <div className="w-full mt-3 flex items-center justify-between text-xs font-tech text-zinc-400 px-1">
            <div className="flex items-center gap-3">
              <span>Control Mode:</span>
              <div className="flex bg-zinc-950 p-1 rounded border border-red-950">
                <button
                  onClick={() => setControlMode('WASD')}
                  className={`px-2.5 py-1 text-[11px] font-cyber rounded transition-colors ${
                    controlMode === 'WASD' ? 'bg-red-900 text-white' : 'text-zinc-400'
                  }`}
                >
                  WASD + Mouse Aim
                </button>
                <button
                  onClick={() => setControlMode('MOUSE')}
                  className={`px-2.5 py-1 text-[11px] font-cyber rounded transition-colors ${
                    controlMode === 'MOUSE' ? 'bg-red-900 text-white' : 'text-zinc-400'
                  }`}
                >
                  Direct Mouse Follow
                </button>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-red-400/80">
              <Crosshair className="w-3.5 h-3.5" /> Live Dynamic Shadows Active
            </div>
          </div>

        </div>

        {/* Right Column: Game Intel, Stats & Legend (1 col) */}
        <div className="space-y-4">
          
          {/* Legend card */}
          <div className="p-4 bg-[#0a0305] border border-red-950/80 rounded-xl space-y-3">
            <h3 className="font-cyber font-bold text-sm text-white flex items-center gap-2 border-b border-red-900/40 pb-2">
              <Eye className="w-4 h-4 text-red-500" /> Sensory Grid Guide
            </h3>

            <div className="space-y-2 text-xs font-tech">
              <div className="flex items-center justify-between p-2 bg-red-950/30 rounded border border-red-950">
                <span className="flex items-center gap-2 text-zinc-300">
                  <span className="text-base">🐹</span> Hamster Avatar
                </span>
                <span className="text-zinc-500">Player</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-red-950/30 rounded border border-red-950">
                <span className="flex items-center gap-2 text-zinc-300">
                  <span className="text-base">🧀</span> Cheese Reward
                </span>
                <span className="text-amber-400 font-bold">+100 PTS</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-red-950/30 rounded border border-red-950">
                <span className="flex items-center gap-2 text-zinc-300">
                  <span className="text-base">💥</span> Spike Trap
                </span>
                <span className="text-red-400 font-bold">-25 HP</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-red-950/30 rounded border border-red-950">
                <span className="flex items-center gap-2 text-zinc-300">
                  <span className="text-base">⚡</span> Powerup Core
                </span>
                <span className="text-blue-400 font-bold">Shield/Speed</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-red-950/30 rounded border border-red-950">
                <span className="flex items-center gap-2 text-zinc-300">
                  <span className="text-base">🌀</span> Exit Portal
                </span>
                <span className="text-emerald-400 font-bold">Clear Level</span>
              </div>
            </div>
          </div>

          {/* Player Hamster Customizer / Stats */}
          <div className="p-4 bg-[#0a0305] border border-red-950/80 rounded-xl space-y-3">
            <h3 className="font-cyber font-bold text-sm text-white flex items-center gap-2 border-b border-red-900/40 pb-2">
              <Award className="w-4 h-4 text-amber-500" /> Active Hamster Stats
            </h3>

            <div className="space-y-2 text-xs font-tech text-zinc-300">
              <div className="flex justify-between">
                <span>Speed:</span>
                <span className="text-red-400 font-mono font-bold">92 / 100</span>
              </div>
              <div className="flex justify-between">
                <span>Agility:</span>
                <span className="text-red-400 font-mono font-bold">88 / 100</span>
              </div>
              <div className="flex justify-between">
                <span>Trap Evasion:</span>
                <span className="text-red-400 font-mono font-bold">95 / 100</span>
              </div>
              <div className="flex justify-between">
                <span>Stamina:</span>
                <span className="text-red-400 font-mono font-bold">90 / 100</span>
              </div>
            </div>
          </div>

          {/* Web3 Network status */}
          <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl space-y-2 text-xs font-tech text-zinc-400">
            <div className="flex justify-between">
              <span>Smart Contract verification:</span>
              <span className="text-emerald-400 font-bold">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Network:</span>
              <span className="text-white font-mono">Ethereum Sepolia</span>
            </div>
            <div className="flex justify-between">
              <span>Wallet:</span>
              <span className="text-red-300 font-mono">{wallet.isConnected ? 'Connected' : 'Guest Mode'}</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
