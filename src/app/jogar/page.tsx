'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getProjectByRoomCode, createPlayer, getRandomCard, getPlayer,
  onGameStateChange, submitAnswer
} from '@/lib/firestore';
import type { Project, GameState, Player, BingoCard, PlayerEnvelope } from '@/types';
import { REWARD_TYPE_LABELS } from '@/lib/utils';
import { LogIn, Sparkles, Check, X, Trophy, Mail, Star } from 'lucide-react';

export default function JogarPage() {
  const [step, setStep] = useState<'join' | 'waiting' | 'playing'>('join');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const [project, setProject] = useState<Project | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [card, setCard] = useState<BingoCard | null>(null);

  const [showQuestion, setShowQuestion] = useState(false);
  const [activeCellId, setActiveCellId] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [answerResult, setAnswerResult] = useState<{ correct: boolean; rewardType?: string; rarityName?: string; rarityColor?: string } | null>(null);
  const [showEnvelope, setShowEnvelope] = useState(false);

  const handleJoin = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      setError('Preencha nome e código da sala');
      return;
    }
    setJoining(true);
    setError('');
    try {
      const proj = await getProjectByRoomCode(roomCode.trim().toUpperCase());
      if (!proj) { setError('Sala não encontrada'); setJoining(false); return; }

      const cardData = await getRandomCard(proj.id);
      if (!cardData) { setError('Nenhuma cartela disponível'); setJoining(false); return; }

      const playerId = await createPlayer(proj.id, playerName.trim(), cardData.id);
      const playerData = await getPlayer(proj.id, playerId);

      setProject(proj);
      setCard(cardData);
      setPlayer(playerData);
      setStep('waiting');

      const unsub = onGameStateChange(proj.id, (state) => {
        setGameState(state);
        if (state?.status === 'playing') setStep('playing');
        if (state?.status === 'finished') setStep('playing');
      });

      return () => unsub();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao entrar na sala');
    }
    setJoining(false);
  };

  useEffect(() => {
    if (!project || !player) return;
    const unsub = onGameStateChange(project.id, (state) => {
      setGameState(state);
      if (state?.status === 'playing') setStep('playing');
    });
    return () => unsub();
  }, [project?.id, player?.id]);

  const handleCellClick = (cellId: string) => {
    if (!gameState?.currentNumber || !card) return;
    const cell = card.cells.find((c) => c.id === cellId);
    if (!cell || cell.isFree || cell.isLocked) return;
    if (cell.number !== gameState.currentNumber) return;
    if (player?.completedCells.includes(cellId)) return;
    setActiveCellId(cellId);
    setShowQuestion(true);
    setAnswer('');
    setAnswerResult(null);
  };

  const handleSubmitAnswer = async () => {
    if (!project || !player || !activeCellId || !gameState) return;
    const result = await submitAnswer(project.id, player.id, activeCellId, answer, gameState.id);
    setAnswerResult(result);
    if (result.correct) {
      setShowEnvelope(true);
      const updatedPlayer = await getPlayer(project.id, player.id);
      if (updatedPlayer) setPlayer(updatedPlayer);
    }
  };

  const inputStyle = { background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  // ─── Join Screen ───
  if (step === 'join') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-sm card-base rounded-2xl p-8 animate-scale-in">
          <div className="text-center mb-6">
            <div className="h-14 w-14 rounded-2xl mx-auto flex items-center justify-center text-white mb-3" style={{ background: 'var(--accent-gradient)' }}>
              <Trophy className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Bingo Bíblico</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Entre na sala para jogar</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Seu Nome</label>
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ex: João"
                className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                style={inputStyle}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Código da Sala</label>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm font-mono font-bold tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                style={inputStyle}
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={joining}
              className="btn-glow w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--accent-gradient)' }}
            >
              {joining ? 'Entrando...' : <><LogIn className="h-4 w-4" /> Entrar na Sala</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Waiting / Playing ───
  const currentNumber = gameState?.currentNumber;
  const drawnNumbers = new Set(gameState?.drawnNumbers || []);

  return (
    <div className="min-h-screen p-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{project?.name}</h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {player?.name} • {player?.score} pontos • {player?.envelopes.length} envelopes
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Sala</p>
            <p className="text-sm font-mono font-bold tracking-widest" style={{ color: 'var(--foreground)' }}>{project?.roomCode}</p>
          </div>
        </div>

        {/* Current Number */}
        {gameState?.status === 'playing' && (
          <div className="card-base rounded-xl p-6 text-center animate-fade-in">
            {currentNumber ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)' }}>Número Sorteado</p>
                <div className="text-6xl font-black animate-scale-in" style={{ color: 'var(--primary)' }}>{currentNumber}</div>
                {card?.cells.some((c) => c.number === currentNumber && !c.isFree && !player?.completedCells.includes(c.id)) && (
                  <p className="mt-2 text-sm font-semibold text-primary animate-pulse">Você tem este número! Toque na célula para responder.</p>
                )}
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Aguardando o host sortear...</p>
            )}
          </div>
        )}

        {gameState?.status === 'finished' && (
          <div className="card-base rounded-xl p-6 text-center animate-scale-in" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.02))', borderColor: 'rgba(245,158,11,0.3)' }}>
            <Trophy className="mx-auto h-10 w-10 text-amber-500 mb-2" />
            <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Jogo Finalizado!</p>
            {gameState.winnerId === player?.id ? (
              <p className="text-sm text-primary font-semibold mt-1">Parabéns, você ganhou!</p>
            ) : (
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {player?.completedCells.length} de {card?.cells.filter((c) => !c.isFree).length} células completadas
              </p>
            )}
          </div>
        )}

        {/* Player Card */}
        {card && (
          <div className="card-base rounded-xl p-4 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--foreground)' }}>Sua Cartela ({card.size}x{card.size})</h3>
            <div
              className="grid gap-1 mx-auto"
              style={{ gridTemplateColumns: `repeat(${card.size}, 1fr)`, maxWidth: '400px' }}
            >
              {card.cells.map((cell) => {
                const isCompleted = player?.completedCells.includes(cell.id);
                const isCurrentNumber = currentNumber && cell.number === currentNumber && !cell.isFree;
                const canPlay = isCurrentNumber && !isCompleted && gameState?.status === 'playing';

                return (
                  <div
                    key={cell.id}
                    onClick={() => canPlay && handleCellClick(cell.id)}
                    className={`relative flex flex-col items-center justify-center rounded-lg border text-center transition-all min-h-[60px] p-1 ${
                      cell.isFree ? 'border-primary/40 bg-primary/10' :
                      isCompleted ? 'border-emerald-500/40 bg-emerald-500/10' :
                      canPlay ? 'border-primary/60 bg-primary/5 cursor-pointer animate-pulse shadow-md' :
                      ''
                    }`}
                    style={!cell.isFree && !isCompleted && !canPlay ? { borderColor: 'var(--border)', background: 'var(--card)' } : undefined}
                  >
                    {cell.isFree ? (
                      <Star className="h-4 w-4 text-primary" />
                    ) : (
                      <>
                        <span className="text-lg font-black" style={{ color: isCompleted ? '#10b981' : isCurrentNumber ? 'var(--primary)' : 'var(--foreground)' }}>
                          {cell.number}
                        </span>
                        {isCompleted && <Check className="absolute top-0.5 right-0.5 h-3 w-3 text-emerald-500" />}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Envelopes */}
        {player && player.envelopes.length > 0 && (
          <div className="card-base rounded-xl p-4 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--foreground)' }}>
              <Mail className="inline h-4 w-4 mr-1.5" />
              Envelopes Ganhos ({player.envelopes.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {player.envelopes.map((env) => (
                <div
                  key={env.id}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2"
                  style={{ borderColor: env.rarityColor + '40', background: env.rarityColor + '10' }}
                >
                  <div className="h-5 w-5 rounded flex items-center justify-center" style={{ background: env.rarityColor }}>
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-medium" style={{ color: env.rarityColor }}>{env.rarityName}</span>
                  <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{REWARD_TYPE_LABELS[env.rewardType]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Modal */}
        {showQuestion && activeCellId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-scale-in" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              {!answerResult ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Responda!</h3>
                    <button onClick={() => { setShowQuestion(false); setActiveCellId(null); }} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {(() => {
                    const cell = card?.cells.find((c) => c.id === activeCellId);
                    const question = cell?.questionId ? { question: 'Pergunta vinculada', id: cell.questionId } : null;
                    return (
                      <div className="space-y-4">
                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                          Número {cell?.number} — Pergunta do jogo
                        </p>
                        <input
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Sua resposta..."
                          className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                          style={inputStyle}
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                        />
                        <button onClick={handleSubmitAnswer} className="btn-glow w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all" style={{ background: 'var(--accent-gradient)' }}>
                          Enviar Resposta
                        </button>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="text-center py-4">
                  {answerResult.correct ? (
                    <>
                      <Check className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
                      <p className="text-lg font-bold text-emerald-500">Correto!</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Você ganhou um envelope!</p>
                    </>
                  ) : (
                    <>
                      <X className="mx-auto h-12 w-12 text-destructive mb-3" />
                      <p className="text-lg font-bold text-destructive">Incorreto</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Tente novamente na próxima vez</p>
                    </>
                  )}
                  <button
                    onClick={() => { setShowQuestion(false); setAnswerResult(null); setActiveCellId(null); setShowEnvelope(answerResult.correct); }}
                    className="mt-4 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:bg-[var(--muted)]"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    {answerResult.correct ? 'Ver Envelope' : 'Fechar'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Envelope Reveal Modal */}
        {showEnvelope && player && player.envelopes.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
            <div className="w-full max-w-sm rounded-2xl border p-8 shadow-2xl animate-scale-in text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              {(() => {
                const latestEnv = player.envelopes[player.envelopes.length - 1];
                return (
                  <>
                    <div
                      className="h-24 w-24 rounded-2xl mx-auto flex items-center justify-center mb-4 rarity-float"
                      style={{ background: `linear-gradient(135deg, ${latestEnv.rarityColor}, ${latestEnv.rarityColor}88)`, boxShadow: `0 0 30px ${latestEnv.rarityColor}40` }}
                    >
                      <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-sm font-bold" style={{ color: latestEnv.rarityColor }}>{latestEnv.rarityName}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{REWARD_TYPE_LABELS[latestEnv.rewardType]}</p>
                    <button
                      onClick={() => setShowEnvelope(false)}
                      className="mt-4 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:bg-[var(--muted)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      Fechar
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
