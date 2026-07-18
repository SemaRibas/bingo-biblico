'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import {
  createGameState, getActiveGameState, drawNumber, onGameStateChange,
  onPlayersChange, createFirestoreProject, syncProjectData, getRandomCard,
  createPlayer
} from '@/lib/firestore';
import type { GameState, Player } from '@/types';
import { Trophy, Users, Play, RotateCw, Copy, Check, Loader2 } from 'lucide-react';

export default function JogoPage() {
  const { state, dispatch } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const project = state.projects.find((p) => p.id === selectedProjectId);
  const projectQuestions = state.questions.filter((q) => q.projectId === selectedProjectId && q.status === 'active');
  const projectCards = state.cards.filter((c) => c.projectId === selectedProjectId);
  const projectRarities = state.rarities.filter((r) => r.projectId === selectedProjectId && r.active);
  const projectEnvelopes = state.envelopes.filter((e) => e.projectId === selectedProjectId);

  useEffect(() => {
    if (!selectedProjectId) return;
    const unsubGame = onGameStateChange(selectedProjectId, setGameState);
    const unsubPlayers = onPlayersChange(selectedProjectId, setPlayers);
    return () => { unsubGame(); unsubPlayers(); };
  }, [selectedProjectId]);

  const handleSyncToFirestore = async () => {
    if (!selectedProjectId) return;
    setSyncing(true);
    setError('');
    try {
      await createFirestoreProject({
        name: project?.name || 'Projeto',
        description: project?.description || '',
        hostId: project?.hostId || '',
      });
      await syncProjectData(selectedProjectId, {
        questions: projectQuestions,
        cards: projectCards,
        rarities: projectRarities,
        envelopes: projectEnvelopes,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao sincronizar');
    }
    setSyncing(false);
  };

  const handleStartGame = async () => {
    if (!selectedProjectId || !project) return;
    try {
      const hostId = project.hostId || 'host';
      await createGameState(selectedProjectId, hostId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao iniciar jogo');
    }
  };

  const handleDrawNumber = async () => {
    if (!gameState) return;
    setIsDrawing(true);
    try {
      await drawNumber(selectedProjectId, gameState.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao sortear número');
    }
    setTimeout(() => setIsDrawing(false), 1500);
  };

  const copyRoomCode = () => {
    if (!project) return;
    navigator.clipboard.writeText(project.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputStyle = { background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Painel do Host</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Controle a partida de bingo</p>
        </div>

        {/* Project Selection */}
        <div className="card-base rounded-xl p-5 animate-fade-in" style={{ animationDelay: '40ms', animationFillMode: 'both' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Selecionar Sala</label>
              <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle}>
                <option value="">Selecione um projeto</option>
                {state.projects.filter((p) => p.status === 'active').map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.roomCode})</option>
                ))}
              </select>
            </div>
            {project && (
              <div>
                <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Código da Sala</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 rounded-xl border px-3 py-2.5 text-sm font-mono font-bold tracking-widest" style={{ ...inputStyle, letterSpacing: '0.2em' }}>
                    {project.roomCode}
                  </div>
                  <button onClick={copyRoomCode} className="rounded-xl border px-3 py-2.5 transition-all hover:shadow-sm" style={{ borderColor: 'var(--border)', color: copied ? 'var(--primary)' : 'var(--foreground)', background: 'var(--card)' }}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive animate-scale-in">{error}</div>
        )}

        {selectedProjectId && !gameState && (
          <div className="card-base rounded-xl p-8 text-center animate-fade-in">
            <Trophy className="mx-auto h-12 w-12 opacity-30" style={{ color: 'var(--muted-foreground)' }} />
            <p className="mt-3 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Nenhuma partida em andamento</p>
            <div className="mt-4 flex justify-center gap-3">
              <button onClick={handleSyncToFirestore} disabled={syncing} className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:shadow-sm disabled:opacity-50" style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--card)' }}>
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                Sincronizar Dados
              </button>
              <button onClick={handleStartGame} className="btn-glow flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/20" style={{ background: 'var(--accent-gradient)' }}>
                <Play className="h-4 w-4" /> Iniciar Jogo
              </button>
            </div>
          </div>
        )}

        {gameState && (
          <div className="space-y-4">
            {/* Current Number */}
            <div className="card-base rounded-xl p-8 text-center animate-fade-in" style={{ animationDelay: '60ms', animationFillMode: 'both' }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>
                {gameState.currentNumber ? 'Número Sorteado' : 'Aguardando sorteio'}
              </p>
              {gameState.currentNumber ? (
                <div className="relative inline-block">
                  <div className="text-8xl font-black animate-scale-in" style={{ color: 'var(--primary)' }}>
                    {gameState.currentNumber}
                  </div>
                  <div className="absolute -inset-4 rounded-full opacity-20 animate-pulse" style={{ background: 'var(--accent-gradient)' }} />
                </div>
              ) : (
                <div className="text-6xl font-black" style={{ color: 'var(--muted-foreground)', opacity: 0.3 }}>?</div>
              )}
              <div className="mt-6">
                <button
                  onClick={handleDrawNumber}
                  disabled={isDrawing || gameState.status === 'finished'}
                  className="btn-glow rounded-2xl px-8 py-4 text-base font-bold text-white transition-all hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  {isDrawing ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Sorteando...</span>
                  ) : (
                    <span className="flex items-center gap-2"><RotateCw className="h-5 w-5" /> Sortear Número</span>
                  )}
                </button>
              </div>
            </div>

            {/* Drawn Numbers History */}
            {gameState.drawnNumbers.length > 0 && (
              <div className="card-base rounded-xl p-4 animate-fade-in">
                <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--foreground)' }}>
                  Números Sorteados ({gameState.drawnNumbers.length}/200)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {gameState.drawnNumbers.map((num, i) => (
                    <div
                      key={num}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        i === gameState.drawnNumbers.length - 1 ? 'ring-2 ring-primary' : ''
                      }`}
                      style={{
                        background: i === gameState.drawnNumbers.length - 1 ? 'var(--primary)' : 'var(--muted)',
                        color: i === gameState.drawnNumbers.length - 1 ? 'var(--primary-foreground)' : 'var(--foreground)',
                      }}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Players */}
            <div className="card-base rounded-xl p-4 animate-fade-in" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                  <Users className="inline h-4 w-4 mr-1.5" />
                  Jogadores Conectados ({players.length})
                </h4>
              </div>
              {players.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
                  Nenhum jogador ainda. Compartilhe o código: <strong className="font-mono">{project?.roomCode}</strong>
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center gap-2 rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--accent-gradient)' }}>
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{player.name}</p>
                        <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                          {player.completedCells.length} células • {player.envelopes.length} envelopes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
