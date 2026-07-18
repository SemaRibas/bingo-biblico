'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import type { BingoCard, BingoCell, BingoSize } from '@/types';
import { generateId } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Eye,
  Edit3,
  Grid,
  Lock,
  Unlock,
  Download,
} from 'lucide-react';

const SIZE_OPTIONS: BingoSize[] = [4, 5, 6, 7];

function createEmptyCard(projectId: string, size: BingoSize, name: string): BingoCard {
  const cells: BingoCell[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isFree = size === 5 && r === 2 && c === 2;
      cells.push({
        id: generateId(),
        cardId: '',
        row: r,
        col: c,
        isFree,
        isLocked: false,
      });
    }
  }
  const id = generateId();
  cells.forEach((cell) => (cell.cardId = id));
  return {
    id,
    projectId,
    name,
    size,
    cells,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function fillCardAutomatically(
  card: BingoCard,
  questions: { id: string; category: string; difficulty: string }[]
): BingoCard {
  const available = [...questions];
  const updatedCells = card.cells.map((cell) => {
    if (cell.isFree || cell.isLocked) return cell;
    if (available.length === 0) return cell;
    const idx = Math.floor(Math.random() * available.length);
    const q = available.splice(idx, 1)[0];
    return { ...cell, questionId: q.id };
  });
  return { ...card, cells: updatedCells, updatedAt: new Date().toISOString() };
}

export default function CartelasPage() {
  const { state, dispatch, projectId } = useApp();
  const [showGenerator, setShowGenerator] = useState(false);
  const [genSize, setGenSize] = useState<BingoSize>(5);
  const [genCount, setGenCount] = useState(1);
  const [genName, setGenName] = useState('');
  const [previewCard, setPreviewCard] = useState<BingoCard | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);

  const projectCards = useMemo(
    () => state.cards.filter((c) => c.projectId === projectId),
    [state.cards, projectId]
  );

  const projectQuestions = useMemo(
    () => state.questions.filter((q) => q.projectId === projectId && q.status === 'active'),
    [state.questions, projectId]
  );

  const handleGenerate = () => {
    const totalCells = genSize * genSize;
    const freeCells = genSize === 5 ? 1 : 0;
    const neededCells = totalCells - freeCells;

    if (projectQuestions.length < neededCells) {
      alert(
        `Perguntas insuficientes. Necessárias: ${neededCells}, disponíveis: ${projectQuestions.length}`
      );
      return;
    }

    const newCards: BingoCard[] = [];
    for (let i = 0; i < genCount; i++) {
      const name = genName
        ? `${genName} ${i + 1}`
        : `Cartela ${projectCards.length + newCards.length + 1}`;
      let card = createEmptyCard(projectId || '', genSize, name);
      card = fillCardAutomatically(card, projectQuestions);
      newCards.push(card);
    }

    newCards.forEach((card) => dispatch({ type: 'ADD_CARD', payload: card }));
    setShowGenerator(false);
    setGenName('');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Excluir esta cartela?')) return;
    dispatch({ type: 'DELETE_CARD', payload: id });
  };

  const handleDuplicate = (card: BingoCard) => {
    const id = generateId();
    const newCells = card.cells.map((cell) => ({
      ...cell,
      id: generateId(),
      cardId: id,
    }));
    dispatch({
      type: 'ADD_CARD',
      payload: {
        ...card,
        id,
        name: `${card.name} (Cópia)`,
        cells: newCells,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleRegenerate = (card: BingoCard) => {
    const cleared = {
      ...card,
      cells: card.cells.map((cell) =>
        cell.isFree || cell.isLocked ? cell : { ...cell, questionId: undefined }
      ),
    };
    const filled = fillCardAutomatically(cleared, projectQuestions);
    dispatch({ type: 'UPDATE_CARD', payload: filled });
  };

  const toggleLock = (cardId: string, cellId: string) => {
    const card = state.cards.find((c) => c.id === cardId);
    if (!card) return;
    const updated = {
      ...card,
      cells: card.cells.map((c) =>
        c.id === cellId ? { ...c, isLocked: !c.isLocked } : c
      ),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'UPDATE_CARD', payload: updated });
  };

  const getQuestionText = (questionId?: string) => {
    if (!questionId) return '';
    const q = projectQuestions.find((q) => q.id === questionId);
    return q?.question || '';
  };

  const renderGrid = (card: BingoCard, compact = false) => {
    const gridSize = card.size;
    return (
      <div
        className={`grid gap-1 ${compact ? 'w-48' : 'w-full max-w-md'}`}
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {card.cells.map((cell) => {
          const qText = getQuestionText(cell.questionId);
          const isEditing = editingCell === cell.id;
          return (
            <div
              key={cell.id}
              onClick={() => !compact && setEditingCell(isEditing ? null : cell.id)}
              className={`
                relative flex items-center justify-center rounded-md border text-center
                ${cell.isFree ? 'border-primary bg-primary/10 text-primary font-bold' : ''}
                ${cell.isLocked ? 'border-amber-500 bg-amber-500/5' : 'border-border bg-card'}
                ${!compact ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}
                ${compact ? 'p-1 min-h-[40px]' : 'p-2 min-h-[60px]'}
              `}
            >
              {cell.isFree ? (
                <span className="text-xs font-bold">★</span>
              ) : (
                <span className={`${compact ? 'text-[8px]' : 'text-[10px]'} leading-tight line-clamp-3 text-foreground`}>
                  {qText || <span className="text-muted-foreground">—</span>}
                </span>
              )}
              {!compact && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(card.id, cell.id);
                  }}
                  className="absolute -top-1 -right-1 rounded-full bg-card border border-border p-0.5 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                >
                  {cell.isLocked ? (
                    <Lock className="h-2.5 w-2.5 text-amber-500" />
                  ) : (
                    <Unlock className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Cartelas de Bingo</h2>
            <p className="text-sm text-muted-foreground">
              {projectCards.length} cartela(s) gerada(s)
            </p>
          </div>
          <button
            onClick={() => setShowGenerator(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Gerar Cartelas
          </button>
        </div>

        {/* Generator Modal */}
        {showGenerator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Gerar Cartelas</h3>
                <button onClick={() => setShowGenerator(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tamanho da Cartela</label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        onClick={() => setGenSize(size)}
                        className={`rounded-lg border p-3 text-center text-sm font-medium transition-colors ${
                          genSize === size
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        {size}x{size}
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          {size * size} espaços
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Nome (opcional)</label>
                  <input
                    value={genName}
                    onChange={(e) => setGenName(e.target.value)}
                    placeholder="Ex: Evento 2024"
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Quantidade</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={genCount}
                    onChange={(e) => setGenCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <p>
                    Perguntas disponíveis: <strong className="text-foreground">{projectQuestions.length}</strong>
                  </p>
                  <p>
                    Espaços por cartela: <strong className="text-foreground">{genSize * genSize - (genSize === 5 ? 1 : 0)}</strong>
                    {genSize === 5 && <span className="text-primary"> (1 espaço livre no centro)</span>}
                  </p>
                  {projectQuestions.length < genSize * genSize - (genSize === 5 ? 1 : 0) && (
                    <p className="text-destructive mt-1">
                      ⚠️ Perguntas insuficientes para este tamanho!
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowGenerator(false)}
                    className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Grid className="h-4 w-4" />
                    Gerar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">{previewCard.name}</h3>
                <button onClick={() => setPreviewCard(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex justify-center">{renderGrid(previewCard)}</div>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        {projectCards.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center">
            <Grid className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhuma cartela gerada ainda
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Gere cartelas para começar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projectCards.map((card) => (
              <div
                key={card.id}
                className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{card.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {card.size}x{card.size} • {card.cells.filter((c) => c.questionId).length} preenchida(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setPreviewCard(card)}
                      className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Visualizar"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleRegenerate(card)}
                      className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Regenerar"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(card)}
                      className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Duplicar"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="rounded p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-center">{renderGrid(card, true)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
