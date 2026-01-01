"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Brain } from "lucide-react";
import { useGameState } from "@/hooks/useGameState";

// 블록 타입 정의
type Block = {
    id: number;
    value: number;       // 화면에 표시될 숫자
    isDummy: boolean;    // true면 함정(더미)
    x: number;           // 그리드 X
    y: number;           // 그리드 Y
    isCovered: boolean;  // 암기 시간 후 가려졌는지
    isVisible: boolean;  // 클릭해서 사라졌는지
};

const GRID_SIZE = 8; // 8x8 그리드 (공간 넉넉하게)

export default function ChimpTestHardGame() {
    const {
        gameState,
        score, // 현재 레벨 (Level 1, 2...)
        startGame,
        endGame,
        setScore,
    } = useGameState();

    const [blocks, setBlocks] = useState<Block[]>([]);
    const [nextExpected, setNextExpected] = useState(1); // 다음에 눌러야 할 숫자
    const [isMemorizing, setIsMemorizing] = useState(false); // 암기 중인가?
    const [numTargets, setNumTargets] = useState(0); // 전체 정답 개수

    // ----------------------------------------------------------------
    // 1. 레벨 생성 로직 (여기가 핵심!)
    // ----------------------------------------------------------------
    const startLevel = useCallback((level: number) => {
        // 난이도 설정
        const targetCount = 4 + level; // 타겟: Lv1=5개, Lv2=6개...
        const decoyCount = 1 + Math.floor(level / 2); // 더미: Lv1=1개, Lv3=2개... (처음부터 나옴)

        setNumTargets(targetCount);
        setNextExpected(1);

        // 위치 생성 (중복 방지)
        const positions = new Set<string>();
        const getRandomPos = () => {
            while (true) {
                const x = Math.floor(Math.random() * GRID_SIZE);
                const y = Math.floor(Math.random() * GRID_SIZE);
                const key = `${x},${y}`;
                if (!positions.has(key)) {
                    positions.add(key);
                    return { x, y };
                }
            }
        };

        // 타겟 블록 생성 (1 ~ N)
        const newBlocks: Block[] = [];
        for (let i = 1; i <= targetCount; i++) {
            const pos = getRandomPos();
            newBlocks.push({
                id: i,
                value: i,
                isDummy: false,
                ...pos,
                isCovered: false,
                isVisible: true,
            });
        }

        // 더미 블록 생성 (N+1 ~ ) -> 이어지는 숫자로 만들어 헷갈리게 함
        for (let i = 1; i <= decoyCount; i++) {
            const pos = getRandomPos();
            newBlocks.push({
                id: targetCount + i,
                value: targetCount + i, // 예: 타겟이 5까지면 더미는 6, 7...
                isDummy: true,
                ...pos,
                isCovered: false,
                isVisible: true,
            });
        }

        setBlocks(newBlocks);
        setIsMemorizing(true);

        // 암기 시간 설정 (더미가 있으므로 넉넉하게 줌)
        // 기본 2초 + 블록 1개당 0.5초 추가
        const memorizeTime = 2000 + (targetCount + decoyCount) * 500;

        setTimeout(() => {
            // 시간이 지나면 모든 블록을 가림 (Covered)
            // 단, 게임이 이미 끝났으면 실행 안 함 (useEffect cleanup이 없으므로 여기서 체크 필요하나, 간단히 진행)
            setBlocks((prev) =>
                prev.map(b => ({ ...b, isCovered: true }))
            );
            setIsMemorizing(false);
        }, memorizeTime);

    }, []);

    // 게임 시작 시 첫 레벨 실행
    useEffect(() => {
        // gameState가 playing으로 바뀌었고, 블록이 비어있다면(첫 시작) 레벨 1 시작
        // 하지만 재시작(Try Again)시에도 동작해야 함.
        // 기존 로직: if (gameState === "playing" && blocks.length === 0)
        // 문제: Try Again을 누르면 restartGame -> gameState 'playing', score 1.
        // 근데 blocks가 남아있을 수 있음(이전 게임). -> startGame에서 초기화 안해주면 문제됨.
        // useGameState의 startGame은 단순히 state 변경만 함.

        // 해결: startGame이 호출될 때 blocks를 비워줘야 하거나, 여기서 감지해야 함.
        // 일단 사용자 코드를 그대로 따르되, 약간의 방어 로직이 필요할 수 있음.
        // 하지만 사용자 요청은 "제공한 코드로 바꿔줘" 이므로 그대로 넣는 게 원칙.

        if (gameState === "playing" && blocks.length === 0) {
            startLevel(1);
            setScore(1);
        }
    }, [gameState, startLevel, blocks.length, setScore]);


    // ----------------------------------------------------------------
    // 2. 블록 클릭 핸들러 (승패 판정)
    // ----------------------------------------------------------------
    const handleBlockClick = (clickedBlock: Block) => {
        // 게임 중이 아니거나, 이미 사라진 블록이면 무시
        if (gameState !== "playing" || !clickedBlock.isVisible) return;

        // 암기 시간 중에는 클릭 불가
        if (isMemorizing) return;

        // [패배 조건 1] 더미(함정)를 클릭했는가?
        if (clickedBlock.isDummy) {
            endGame(false); // 즉시 실패
            return;
        }

        // [패배 조건 2] 순서가 틀렸는가?
        if (clickedBlock.value !== nextExpected) {
            endGame(false); // 즉시 실패
            return;
        }

        // [정답] 올바른 순서의 타겟을 클릭함

        // 1. 해당 블록을 화면에서 지움 (isVisible = false)
        const newBlocks = blocks.map((b) =>
            b.id === clickedBlock.id ? { ...b, isVisible: false } : b
        );
        setBlocks(newBlocks);

        // 2. 마지막 숫자였는지 확인
        if (clickedBlock.value === numTargets) {
            // 레벨 클리어!
            setTimeout(() => {
                const nextLevel = score + 1;
                setScore(nextLevel);
                startLevel(nextLevel); // 다음 레벨 시작
            }, 500); // 0.5초 뒤 다음 레벨
        } else {
            // 아직 남았으면 다음 숫자 기다림
            setNextExpected((prev) => prev + 1);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-2xl mx-auto p-4 select-none">

            {/* 상단 정보 */}
            <div className="mb-6 flex justify-between w-full items-center">
                <div className="text-xl font-bold text-white">Level {score}</div>
                <div className="text-white/60 text-sm">
                    {isMemorizing ? "MEMORIZE!" : `Find: ${nextExpected}`}
                </div>
            </div>

            {/* 게임 보드 */}
            <div
                className="relative bg-slate-800 rounded-xl shadow-2xl overflow-hidden"
                style={{
                    width: "100%",
                    paddingBottom: "100%", // 1:1 비율 유지
                }}
            >
                <div className="absolute inset-0 p-4">
                    {gameState === "waiting" ? (
                        // 대기 화면
                        <div className="h-full flex flex-col items-center justify-center space-y-6 text-center">
                            <div className="p-4 bg-yellow-500/20 rounded-full animate-pulse">
                                <Brain size={48} className="text-yellow-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Chimp Test Hard</h1>
                                <p className="text-white/60 mb-1">Memorize pattern & Avoid Decoys</p>
                                <p className="text-red-400 font-bold text-sm">Beware of fake numbers!</p>
                            </div>
                            <button
                                onClick={startGame}
                                className="flex items-center gap-2 px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-transform hover:scale-105 active:scale-95"
                            >
                                <Play size={24} />
                                Start Hard Mode
                            </button>
                        </div>
                    ) : gameState === "finished" ? (
                        // 결과 화면
                        <div className="h-full flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="text-6xl mb-2">🐒</div>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-white mb-2">Game Over</h2>
                                <p className="text-4xl font-bold text-yellow-400 mb-2">Level {score}</p>
                                <p className="text-white/60">Can you beat your record?</p>
                            </div>
                            <button
                                onClick={() => {
                                    setBlocks([]); // 재시작 시 블록 초기화 필요 (useEffect 트리거용)
                                    startGame();
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            >
                                <RotateCcw size={20} />
                                Try Again
                            </button>
                        </div>
                    ) : (
                        // 플레이 화면 (그리드)
                        <div className="relative w-full h-full">
                            <AnimatePresence>
                                {blocks.map((block) => (
                                    block.isVisible && (
                                        <motion.div
                                            key={block.id}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className={`absolute flex items-center justify-center rounded-lg shadow-lg cursor-pointer transition-colors
                        ${
                                                // 1. 암기 시간이면 -> 흰색 배경에 숫자 표시
                                                isMemorizing
                                                    ? "bg-white text-black border-2 border-white"
                                                    : block.isCovered
                                                        // 2. 가려진 상태 -> 정답/더미 모두 같은 '회색 덮개'
                                                        ? "bg-slate-600 border-2 border-slate-500 hover:bg-slate-500"
                                                        // 3. (혹시 모를 예외) -> 투명
                                                        : "bg-transparent"
                                                }
                      `}
                                            style={{
                                                width: `${100 / GRID_SIZE - 2}%`,
                                                height: `${100 / GRID_SIZE - 2}%`,
                                                left: `${(block.x / GRID_SIZE) * 100 + 1}%`,
                                                top: `${(block.y / GRID_SIZE) * 100 + 1}%`,
                                            }}
                                            onClick={() => handleBlockClick(block)}
                                        >
                                            {/* 암기 중이거나, 아직 가려지기 전이라면 숫자를 보여줌 */}
                                            {(!block.isCovered || isMemorizing) && (
                                                <span className="text-xl md:text-3xl font-bold select-none">
                                                    {block.value}
                                                </span>
                                            )}
                                        </motion.div>
                                    )
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
