'use client';

import React, { useState, useMemo } from 'react';

import { useApp } from '@/contexts/AppContext';
import { useNotification } from '@/contexts/NotificationContext';
import type { BingoCard, BingoCell, BingoSize } from '@/types';
import { generateId, CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Eye,
  LayoutGrid,
  Lock,
  Unlock,
  X,
  Check,
  Shuffle,
} from 'lucide-react';

const SIZE_OPTIONS: BingoSize[] = [4, 5, 6, 7];

function createEmptyCard(projectId: string, size: BingoSize, name: string): BingoCard {
  const totalCells = size * size;
  const freeCells = size === 5 ? 1 : 0;
  const numbersNeeded = totalCells - freeCells;
  const allNumbers = Array.from({ length: 200 }, (_, i) => i + 1);
  const shuffled = allNumbers.sort(() => Math.random() - 0.5);
  const assignedNumbers = shuffled.slice(0, numbersNeeded);
  let numIdx = 0;

  const cells: BingoCell[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isFree = size === 5 && r === 2 && c === 2;
      const number = isFree ? 0 : assignedNumbers[numIdx++];
      cells.push({ id: generateId(), cardId: '', row: r, col: c, number, isFree, isLocked: false });
    }
  }
  const id = generateId();
  cells.forEach((cell) => (cell.cardId = id));
  return { id, projectId, name, size, cells, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
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
  const { toast, confirm } = useNotification();
  const [showGenerator, setShowGenerator] = useState(false);
  const [genSize, setGenSize] = useState<BingoSize>(5);
  const [genCount, setGenCount] = useState(1);
  const [genName, setGenName] = useState('');
  const [previewCard, setPreviewCard] = useState<BingoCard | null>(null);
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [cellSearchQuery, setCellSearchQuery] = useState('');

  const projectCards = useMemo(() => state.cards.filter((c) => c.projectId === projectId), [state.cards, projectId]);
  const projectQuestions = useMemo(() => state.questions.filter((q) => q.projectId === projectId && q.status === 'active'), [state.questions, projectId]);
  const projectRarities = useMemo(() => state.rarities.filter((r) => r.projectId === projectId && r.active), [state.rarities, projectId]);

  const handleGenerate = () => {
    const totalCells = genSize * genSize;
    const freeCells = genSize === 5 ? 1 : 0;
    const neededCells = totalCells - freeCells;
    if (projectQuestions.length < neededCells) {
      toast({ type: 'warning', title: 'Perguntas insuficientes', message: `Necessárias: ${neededCells}, disponíveis: ${projectQuestions.length}` });
      return;
    }
    const newCards: BingoCard[] = [];
    for (let i = 0; i < genCount; i++) {
      const name = genName ? `${genName} ${i + 1}` : `Cartela ${projectCards.length + newCards.length + 1}`;
      let card = createEmptyCard(projectId || '', genSize, name);
      card = fillCardAutomatically(card, projectQuestions);
      newCards.push(card);
    }
    newCards.forEach((card) => dispatch({ type: 'ADD_CARD', payload: card }));
    setShowGenerator(false);
    setGenName('');
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: 'Excluir cartela', message: 'Tem certeza que deseja excluir esta cartela?', variant: 'danger' })) return;
    dispatch({ type: 'DELETE_CARD', payload: id });
  };

  const handleDuplicate = (card: BingoCard) => {
    const id = generateId();
    const newCells = card.cells.map((cell) => ({ ...cell, id: generateId(), cardId: id }));
    dispatch({
      type: 'ADD_CARD',
      payload: { ...card, id, name: `${card.name} (Cópia)`, cells: newCells, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    });
  };

  const handleRegenerate = (card: BingoCard) => {
    const cleared = { ...card, cells: card.cells.map((cell) => cell.isFree || cell.isLocked ? cell : { ...cell, questionId: undefined }) };
    const filled = fillCardAutomatically(cleared, projectQuestions);
    dispatch({ type: 'UPDATE_CARD', payload: filled });
  };

  const handleCellClick = (cellId: string) => {
    setEditingCellId(cellId);
    setCellSearchQuery('');
  };

  const handleAssignQuestion = (card: BingoCard, cellId: string, questionId: string) => {
    const updatedCells = card.cells.map((c) => c.id === cellId ? { ...c, questionId } : c);
    dispatch({ type: 'UPDATE_CARD', payload: { ...card, cells: updatedCells, updatedAt: new Date().toISOString() } });
    setEditingCellId(null);
  };

  const handleToggleLock = (card: BingoCard, cellId: string) => {
    const updatedCells = card.cells.map((c) => c.id === cellId ? { ...c, isLocked: !c.isLocked } : c);
    dispatch({ type: 'UPDATE_CARD', payload: { ...card, cells: updatedCells, updatedAt: new Date().toISOString() } });
  };

  const getQuestionText = (questionId?: string) => {
    if (!questionId) return '';
    return projectQuestions.find((q) => q.id === questionId)?.question || '';
  };

  const getFilteredQuestions = (query: string) => {
    if (!query) return projectQuestions;
    const lower = query.toLowerCase();
    return projectQuestions.filter((q) =>
      q.question.toLowerCase().includes(lower) ||
      q.correctAnswer.toLowerCase().includes(lower) ||
      (q.biblicalReference && q.biblicalReference.toLowerCase().includes(lower))
    );
  };

  const editingCard = editingCellId ? projectCards.find((c) => c.cells.some((cl) => cl.id === editingCellId)) : null;
  const editingCell = editingCard?.cells.find((c) => c.id === editingCellId);

  const inputStyle = { background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Cartelas de Bingo</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{projectCards.length} cartela(s) • {projectQuestions.length} perguntas disponíveis</p>
          </div>
          <button
            onClick={() => setShowGenerator(true)}
            className="btn-glow flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <Plus className="h-4 w-4" />
            Gerar Cartelas
          </button>
        </div>

        {/* Generator Modal */}
        {showGenerator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-scale-in" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Gerar Cartelas</h3>
                <button onClick={() => setShowGenerator(false)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Tamanho da Cartela</label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        onClick={() => setGenSize(size)}
                        className={`rounded-xl border p-3 text-center text-sm font-medium transition-all duration-200 ${
                          genSize === size ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'hover:border-primary/30'
                        }`}
                        style={genSize !== size ? { borderColor: 'var(--border)', color: 'var(--foreground)' } : undefined}
                      >
                        {size}x{size}
                        <span className="block text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{size * size} espaços</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Nome (opcional)</label>
                  <input value={genName} onChange={(e) => setGenName(e.target.value)} placeholder="Ex: Evento 2024" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle} />
                </div>
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Quantidade</label>
                  <input type="number" min={1} max={100} value={genCount} onChange={(e) => setGenCount(Math.max(1, parseInt(e.target.value) || 1))} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle} />
                </div>
                <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                  <p>Perguntas disponíveis: <strong style={{ color: 'var(--foreground)' }}>{projectQuestions.length}</strong></p>
                  <p>Espaços por cartela: <strong style={{ color: 'var(--foreground)' }}>{genSize * genSize - (genSize === 5 ? 1 : 0)}</strong></p>
                  {projectQuestions.length < genSize * genSize - (genSize === 5 ? 1 : 0) && (
                    <p className="text-destructive mt-1">Perguntas insuficientes para este tamanho!</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowGenerator(false)} className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:bg-[var(--muted)]" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Cancelar</button>
                  <button onClick={handleGenerate} className="btn-glow flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/20" style={{ background: 'var(--accent-gradient)' }}>
                    <LayoutGrid className="h-4 w-4" />
                    Gerar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cell Editor Modal */}
        {editingCellId && editingCard && editingCell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl animate-scale-in" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                  Editar Célula [{editingCell.row + 1},{editingCell.col + 1}]
                </h3>
                <button onClick={() => setEditingCellId(null)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleLock(editingCard, editingCellId)} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all" style={{ borderColor: 'var(--border)', color: editingCell.isLocked ? 'var(--primary)' : 'var(--foreground)' }}>
                    {editingCell.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    {editingCell.isLocked ? 'Travada' : 'Destravada'}
                  </button>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Células travadas não são afetadas pela regeneração
                  </span>
                </div>
                <div className="relative">
                  <input
                    value={cellSearchQuery}
                    onChange={(e) => setCellSearchQuery(e.target.value)}
                    placeholder="Buscar pergunta..."
                    className="w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                    style={inputStyle}
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {getFilteredQuestions(cellSearchQuery).slice(0, 20).map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleAssignQuestion(editingCard, editingCellId, q.id)}
                      className={`w-full text-left rounded-xl p-3 text-sm transition-all ${
                        editingCell.questionId === q.id ? 'ring-2 ring-primary bg-primary/10' : 'hover:bg-[var(--muted)]'
                      }`}
                    >
                      <p className="font-medium line-clamp-1" style={{ color: 'var(--foreground)' }}>{q.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{CATEGORY_LABELS[q.category]}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${q.difficulty === 'facil' ? 'bg-emerald-500/10 text-emerald-600' : q.difficulty === 'dificil' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>{DIFFICULTY_LABELS[q.difficulty]}</span>
                      </div>
                    </button>
                  ))}
                  {getFilteredQuestions(cellSearchQuery).length === 0 && (
                    <p className="text-center py-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>Nenhuma pergunta encontrada</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl animate-scale-in" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>{previewCard.name}</h3>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{previewCard.size}x{previewCard.size} • {previewCard.cells.filter((c) => c.questionId).length}/{previewCard.cells.length} preenchida(s)</p>
                </div>
                <button onClick={() => setPreviewCard(null)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex justify-center">
                <div className="grid gap-1.5 w-full max-w-md" style={{ gridTemplateColumns: `repeat(${previewCard.size}, 1fr)` }}>
                  {previewCard.cells.map((cell) => {
                    const qText = getQuestionText(cell.questionId);
                    return (
                      <div
                        key={cell.id}
                        className={`relative flex items-center justify-center rounded-xl border text-center transition-all min-h-[56px] p-2 ${
                          cell.isFree ? 'border-primary/40 bg-primary/10' : cell.isLocked ? 'border-amber-500/40 bg-amber-500/5' : ''
                        }`}
                        style={!cell.isFree && !cell.isLocked ? { borderColor: 'var(--border)', background: 'var(--card)' } : undefined}
                      >
                        {cell.isFree ? (
                          <span className="text-lg font-bold text-primary">★</span>
                        ) : (
                          <span className="text-[10px] leading-tight line-clamp-3" style={{ color: 'var(--foreground)' }}>
                            {qText || <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                          </span>
                        )}
                        {cell.isLocked && <Lock className="absolute top-0.5 right-0.5 h-2.5 w-2.5 text-amber-500" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        {projectCards.length === 0 ? (
          <div className="card-base rounded-xl py-16 text-center animate-fade-in">
            <LayoutGrid className="mx-auto h-12 w-12 opacity-20" style={{ color: 'var(--muted-foreground)' }} />
            <p className="mt-3 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Nenhuma cartela gerada ainda</p>
            <p className="text-xs mt-1 opacity-60" style={{ color: 'var(--muted-foreground)' }}>Gere cartelas para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projectCards.map((card, i) => (
              <div
                key={card.id}
                className="group card-base rounded-xl p-4 animate-fade-in"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{card.name}</h4>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {card.size}x{card.size} • {card.cells.filter((c) => c.questionId).length} preenchida(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setPreviewCard(card)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleRegenerate(card)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDuplicate(card)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(card.id)} className="rounded-lg p-1.5 hover:bg-destructive/10 transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {/* Mini Grid */}
                <div
                  className="grid gap-0.5 w-full"
                  style={{ gridTemplateColumns: `repeat(${card.size}, 1fr)` }}
                >
                  {card.cells.map((cell) => {
                    const qText = getQuestionText(cell.questionId);
                    return (
                      <div
                        key={cell.id}
                        onClick={() => !cell.isFree && handleCellClick(cell.id)}
                        className={`relative flex items-center justify-center rounded-md border text-center transition-all cursor-pointer min-h-[36px] p-0.5 ${
                          cell.isFree ? 'border-primary/30 bg-primary/5' : cell.isLocked ? 'border-amber-400/30 bg-amber-400/5' : 'hover:border-primary/40 hover:shadow-sm'
                        }`}
                        style={!cell.isFree && !cell.isLocked ? { borderColor: 'var(--border)', background: 'var(--card)' } : undefined}
                      >
                        {cell.isFree ? (
                          <span className="text-[10px] font-bold text-primary">★</span>
                        ) : (
                          <span className="text-[7px] leading-tight line-clamp-2" style={{ color: 'var(--foreground)' }}>
                            {qText || <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                          </span>
                        )}
                        {cell.isLocked && <Lock className="absolute top-0 right-0 h-1.5 w-1.5 text-amber-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    
  );
}
