'use client';

import React, { useEffect, useRef, useState } from 'react';
import Starfield from '@/shared/components/Starfield';
import { GiSpaceship } from 'react-icons/gi';
import { LuFuel } from 'react-icons/lu';

const CELL_SIZE = 32; // px, responsive Basisgröße
const MOVE_INTERVAL = 120; // ms

// Richtungen
const directions = {
  ArrowUp: { x: 0, y: -1, rotate: 0 },
  ArrowDown: { x: 0, y: 1, rotate: 180 },
  ArrowLeft: { x: -1, y: 0, rotate: -90 },
  ArrowRight: { x: 1, y: 0, rotate: 90 },
};
type DirectionKey = keyof typeof directions;

interface Point { x: number; y: number; }

function getRandomPoint(maxX: number, maxY: number, exclude: Point[]): Point {
  let point: Point;
  do {
    point = {
      x: Math.floor(Math.random() * maxX),
      y: Math.floor(Math.random() * maxY),
    };
  } while (exclude.some((p) => p.x === point.x && p.y === point.y));
  return point;
}

interface SpaceshipGameProps {
  started?: boolean;
}

const SpaceshipGame: React.FC<SpaceshipGameProps> = ({ started = true }) => {
  const [grid, setGrid] = useState({ cols: 20, rows: 15, width: 640, height: 480 });
  const [snake, setSnake] = useState<Point[]>([]);
  const [direction, setDirection] = useState<DirectionKey>('ArrowRight');
  const [nextDirection, setNextDirection] = useState<DirectionKey>('ArrowRight');
  const [food, setFood] = useState<Point | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const moveRef = useRef<NodeJS.Timeout | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Responsive Grid
  useEffect(() => {
    const update = () => {
      const w = Math.floor(window.innerWidth * 0.98);
      const h = Math.floor(window.innerHeight * 0.7);
      const cols = Math.floor(w / CELL_SIZE);
      const rows = Math.floor(h / CELL_SIZE);
      setGrid({ cols, rows, width: cols * CELL_SIZE, height: rows * CELL_SIZE });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Snake-Init bei Grid-Änderung
  useEffect(() => {
    const start = { x: Math.floor(grid.cols / 2), y: Math.floor(grid.rows / 2) };
    setSnake([start]);
    setDirection('ArrowRight');
    setNextDirection('ArrowRight');
    setFood(getRandomPoint(grid.cols, grid.rows, [start]));
    setScore(0);
    setGameOver(false);
  }, [grid.cols, grid.rows]);

  // Tastatursteuerung nur wenn started und nicht gameOver
  useEffect(() => {
    if (!started || gameOver) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (Object.keys(directions).includes(e.key)) {
        const newDir = e.key as DirectionKey;
        // Keine direkte Umkehr
        if (
          (direction === 'ArrowUp' && newDir === 'ArrowDown') ||
          (direction === 'ArrowDown' && newDir === 'ArrowUp') ||
          (direction === 'ArrowLeft' && newDir === 'ArrowRight') ||
          (direction === 'ArrowRight' && newDir === 'ArrowLeft')
        ) {
          return;
        }
        setNextDirection(newDir);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameOver, started]);

  // Snake-Loop nur wenn started
  useEffect(() => {
    if (!started || gameOver || !food) return;
    moveRef.current = setInterval(() => {
      setDirection(nextDirection);
      setSnake((prev) => {
        const move = directions[nextDirection];
        const newHead = { x: prev[0].x + move.x, y: prev[0].y + move.y };
        // Check Bildschirmrand
        if (
          newHead.x < 0 ||
          newHead.x >= grid.cols ||
          newHead.y < 0 ||
          newHead.y >= grid.rows ||
          prev.some((s) => s.x === newHead.x && s.y === newHead.y)
        ) {
          setGameOver(true);
          return prev;
        }
        let newSnake;
        if (newHead.x === food.x && newHead.y === food.y) {
          newSnake = [newHead, ...prev];
          setFood(getRandomPoint(grid.cols, grid.rows, [newHead, ...prev]));
          setScore((s) => s + 1);
        } else {
          newSnake = [newHead, ...prev.slice(0, -1)];
        }
        return newSnake;
      });
    }, MOVE_INTERVAL);
    return () => {
      if (moveRef.current) clearInterval(moveRef.current);
    };
  }, [nextDirection, food, gameOver, grid, started]);

  // Fokus für Tastatursteuerung
  useEffect(() => {
    boardRef.current?.focus();
  }, [grid.width, grid.height]);

  const handleRestart = () => {
    const start = { x: Math.floor(grid.cols / 2), y: Math.floor(grid.rows / 2) };
    setSnake([start]);
    setDirection('ArrowRight');
    setNextDirection('ArrowRight');
    setFood(getRandomPoint(grid.cols, grid.rows, [start]));
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-10">
      {/* Starfield als Grid-Hintergrund */}
      <div className="absolute inset-0 z-0">
        <Starfield starCount={12000} />
      </div>
      <div
        ref={boardRef}
        tabIndex={0}
        className="outline-none select-none relative"
        style={{ width: grid.width, height: grid.height }}
      >
        {/* Orange Border als Spielfeldbegrenzung */}
        <div className="absolute inset-0 rounded-lg border-4 border-[#ff9900] pointer-events-none z-20" />
        {/* Score */}
        <div className="absolute top-2 left-2 z-30 text-[#ff9900] font-mono text-sm bg-black/40 px-2 py-1 rounded">Score: {score}</div>
        {/* Snake-Grid */}
        <div
          className="absolute inset-0 z-10 grid"
          style={{
            gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
            gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
            width: grid.width,
            height: grid.height,
          }}
        >
          {[...Array(grid.cols * grid.rows)].map((_, i) => {
            const x = i % grid.cols;
            const y = Math.floor(i / grid.cols);
            const isHead = snake[0]?.x === x && snake[0]?.y === y;
            const isBody = !isHead && snake.some((s) => s.x === x && s.y === y);
            const isFood = food && food.x === x && food.y === y;
            return (
              <div
                key={i}
                className="flex items-center justify-center"
                style={{ width: CELL_SIZE, height: CELL_SIZE }}
              >
                {isHead ? (
                  <GiSpaceship
                    style={{
                      color: '#ff9900',
                      width: CELL_SIZE * 0.9,
                      height: CELL_SIZE * 0.9,
                      transform: `rotate(${directions[direction].rotate}deg)`,
                    }}
                  />
                ) : isBody ? (
                  <div
                    style={{
                      width: CELL_SIZE * 0.7,
                      height: CELL_SIZE * 0.7,
                      background: '#ff9900',
                      borderRadius: 4,
                      opacity: 0.7,
                    }}
                  />
                ) : isFood ? (
                  <LuFuel
                    style={{
                      color: '#ff9900',
                      width: CELL_SIZE * 0.8,
                      height: CELL_SIZE * 0.8,
                    }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 rounded-lg pointer-events-none">
            <div className="text-2xl font-bold text-[#ff9900] mb-2 pointer-events-auto">Game Over</div>
            <div className="text-white mb-4 pointer-events-auto">Score: {score}</div>
            <button
              className="px-4 py-2 rounded bg-[#ff9900] text-white font-bold shadow hover:bg-[#ff9900]/90 transition pointer-events-auto"
              onClick={handleRestart}
            >
              Neustart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceshipGame; 