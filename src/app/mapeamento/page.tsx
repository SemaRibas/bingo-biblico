'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import type { BingoSize } from '@/types';
import { ArrowLeftRight, AlertTriangle, Check, X, Shuffle } from 'lucide-react';

export default function MapeamentoPage() {
  const { state, dispatch, projectId } = useApp();
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [poolSize, setPoolSize] = useState<BingoSize>(5);

  const projectCards = useMemo(
    () => state.cards.filter((c) => c.projectId === projectId),
    [state.cards, projectId]
  );
  const projectQuestions = useMemo(
    () => state.questions.filter((q) => q.projectId === projectId),
    [state.questions, projectId]
  );

  const selectedCard = projectCards.find((c) => c.id === selectedCardId);

  const linkedQuestionIds = useMemo(() => {
    const ids = new Set<string>();
    projectCards.forEach((card) =>
      card.cells.forEach((cell) => {
        if (cell.questionId) ids.add(cell.questionId);
      })
    );
    return ids;
  }, [projectCards]);

  const unusedQuestions = projectQuestions.filter((q) => !linkedQuestionIds.has(q.id));
  const usedQuestions = projectQuestions.filter((q) => linkedQuestionIds.has(q.id));

  const handleCellClick = (cellId: string, questionId: string | undefined) => {
    if (!selectedCard) return;
    const updated = {
      ...selectedCard,
      cells: selectedCard.cells.map((c) =>
        c.id === cellId ? { ...c, questionId: questionId || undefined } : c
      ),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'UPDATE_CARD', payload: updated });
  };

  const balanceByDifficulty = () => {
    if (!selectedCard) return;
    const available = [...projectQuestions.filter((q) => q.status === 'active')];
    const emptyCells = selectedCard.cells.filter((c) => !c.isFree && !c.isLocked && !c.questionId);
    
    // Sort by difficulty for balance
    const sorted = available.sort((a, b) => {
      const order = { facil: 0, medio: 1, dificil: 2 };
      return order[a.difficulty] - order[b.difficulty];
    });

    const updatedCells = selectedCard.cells.map((cell) => {
      if (cell.isFree || cell.isLocked || cell.questionId) return cell;
      if (sorted.length === 0) return cell;
      const q = sorted.shift()!;
      return { ...cell, questionId: q.id };
    });

    dispatch({
      type: 'UPDATE_CARD',
      payload: { ...selectedCard, cells: updatedCells, updatedAt: new Date().toISOString() },
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Mapeamento Perguntas × Espaços</h2>
          <p className="text-sm text-muted-foreground">
            Vincule perguntas às posições das cartelas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Stats & Selection */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">Estatísticas</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de perguntas</span>
                  <span className="font-medium">{projectQuestions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Não utilizadas</span>
                  <span className="font-medium text-amber-500">{unusedQuestions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vinculadas</span>
                  <span className="font-medium text-emerald-500">{usedQuestions.length}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">Selecionar Cartela</h3>
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecione uma cartela...</option>
                {projectCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.size}x{c.size})
                  </option>
                ))}
              </select>
              {selectedCard && (
                <button
                  onClick={balanceByDifficulty}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Shuffle className="h-4 w-4" />
                  Balancear por Dificuldade
                </button>
              )}
            </div>

            {/* Unused Questions List */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">
                Perguntas Não Usadas ({unusedQuestions.length})
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {unusedQuestions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Todas as perguntas estão em uso</p>
                ) : (
                  unusedQuestions.map((q) => (
                    <div key={q.id} className="rounded-lg border border-border p-2 text-xs hover:bg-muted/50 transition-colors">
                      <p className="line-clamp-2 text-foreground">{q.question}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {q.category.replace(/_/g, ' ')} • {q.difficulty}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Card Grid */}
          <div className="lg:col-span-2">
            {!selectedCard ? (
              <div className="rounded-xl border border-border bg-card py-16 text-center">
                <ArrowLeftRight className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Selecione uma cartela para mapear
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">
                    {selectedCard.name} ({selectedCard.size}x{selectedCard.size})
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {selectedCard.cells.filter((c) => c.questionId).length}/{selectedCard.cells.filter((c) => !c.isFree).length} preenchida(s)
                  </span>
                </div>
                <div
                  className="grid gap-2 max-w-lg mx-auto"
                  style={{ gridTemplateColumns: `repeat(${selectedCard.size}, 1fr)` }}
                >
                  {selectedCard.cells.map((cell) => {
                    const question = projectQuestions.find((q) => q.id === cell.questionId);
                    return (
                      <div
                        key={cell.id}
                        className={`
                          relative rounded-lg border p-2 min-h-[70px] flex flex-col items-center justify-center text-center transition-colors
                          ${cell.isFree ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:border-primary/50 cursor-pointer'}
                          ${cell.isLocked ? 'border-amber-500' : ''}
                        `}
                        onClick={() => {
                          if (cell.isFree || cell.isLocked) return;
                          // Simple: cycle through unused questions
                          const unused = projectQuestions.filter(
                            (q) =>
                              q.status === 'active' &&
                              !selectedCard.cells.some((c) => c.questionId === q.id && c.id !== cell.id)
                          );
                          if (unused.length === 0) return;
                          const currentIdx = question ? unused.findIndex((u) => u.id === question.id) : -1;
                          const nextIdx = (currentIdx + 1) % unused.length;
                          handleCellClick(cell.id, unused[nextIdx].id);
                        }}
                      >
                        {cell.isFree ? (
                          <span className="text-xs font-bold text-primary">★ Livre</span>
                        ) : question ? (
                          <>
                            <p className="text-[10px] leading-tight line-clamp-3 text-foreground">
                              {question.question}
                            </p>
                            <span className={`mt-1 text-[8px] px-1 rounded ${
                              question.difficulty === 'facil' ? 'bg-emerald-500/10 text-emerald-500' :
                              question.difficulty === 'medio' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-red-500/10 text-red-500'
                            }`}>
                              {question.difficulty}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Clique para vincular</span>
                        )}
                        {cell.isLocked && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 flex items-center justify-center">
                            <span className="text-[8px] text-white">🔒</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
