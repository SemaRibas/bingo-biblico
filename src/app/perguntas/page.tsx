'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import type { BibleQuestion, QuestionCategory, Difficulty } from '@/types';
import { generateId, CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/lib/utils';
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Copy,
  Check,
  X,
  Download,
  Upload,
  Tag,
} from 'lucide-react';

const EMPTY_QUESTION: Omit<BibleQuestion, 'id' | 'createdAt' | 'updatedAt' | 'linkedCells'> = {
  projectId: '',
  question: '',
  correctAnswer: '',
  hint: '',
  category: 'antigo_testamento',
  difficulty: 'medio',
  tags: [],
  status: 'active',
  notes: '',
  biblicalReference: '',
};

export default function PerguntasPage() {
  const { state, dispatch, projectId } = useApp();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BibleQuestion>>({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_QUESTION);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [sortField, setSortField] = useState<'question' | 'category' | 'difficulty' | 'status'>('question');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let items = state.questions.filter((q) => q.projectId === projectId);
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (q) =>
          q.question.toLowerCase().includes(s) ||
          q.correctAnswer.toLowerCase().includes(s) ||
          q.tags.some((t) => t.toLowerCase().includes(s))
      );
    }
    if (filterCategory) items = items.filter((q) => q.category === filterCategory);
    if (filterDifficulty) items = items.filter((q) => q.difficulty === filterDifficulty);
    if (filterStatus) items = items.filter((q) => q.status === filterStatus);

    items.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return items;
  }, [state.questions, projectId, search, filterCategory, filterDifficulty, filterStatus, sortField, sortDir]);

  const handleCreate = () => {
    if (!formData.question.trim() || !formData.correctAnswer.trim()) return;
    const now = new Date().toISOString();
    const question: BibleQuestion = {
      ...formData,
      id: generateId(),
      projectId: projectId || '',
      linkedCells: [],
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_QUESTION', payload: question });
    setFormData(EMPTY_QUESTION);
    setShowForm(false);
  };

  const handleUpdate = () => {
    if (!editingId || !editForm.question?.trim() || !editForm.correctAnswer?.trim()) return;
    const original = state.questions.find((q) => q.id === editingId);
    if (!original) return;
    dispatch({
      type: 'UPDATE_QUESTION',
      payload: { ...original, ...editForm, updatedAt: new Date().toISOString() },
    });
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = (id: string) => {
    if (!confirm('Excluir esta pergunta?')) return;
    dispatch({ type: 'DELETE_QUESTION', payload: id });
  };

  const handleDuplicate = (q: BibleQuestion) => {
    const now = new Date().toISOString();
    const dup: BibleQuestion = {
      ...q,
      id: generateId(),
      question: `${q.question} (Cópia)`,
      linkedCells: [],
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_QUESTION', payload: dup });
  };

  const handleBulkDelete = () => {
    if (!confirm(`Excluir ${selectedIds.length} pergunta(s)?`)) return;
    selectedIds.forEach((id) => dispatch({ type: 'DELETE_QUESTION', payload: id }));
    setSelectedIds([]);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const items = Array.isArray(data) ? data : [data];
        items.forEach((item: Partial<BibleQuestion>) => {
          const q: BibleQuestion = {
            id: generateId(),
            projectId: projectId || '',
            question: item.question || '',
            correctAnswer: item.correctAnswer || '',
            hint: item.hint || '',
            category: item.category || 'antigo_testamento',
            difficulty: item.difficulty || 'medio',
            tags: item.tags || [],
            status: item.status || 'active',
            notes: item.notes || '',
            biblicalReference: item.biblicalReference || '',
            linkedCells: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          dispatch({ type: 'ADD_QUESTION', payload: q });
        });
      } catch {
        alert('Erro ao importar arquivo JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const addTag = (target: 'form' | 'edit', value: string) => {
    if (!value.trim()) return;
    if (target === 'form') {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, value.trim()],
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), value.trim()],
      }));
    }
    setTagInput('');
  };

  const removeTag = (target: 'form' | 'edit', index: number) => {
    if (target === 'form') {
      setFormData((prev) => ({
        ...prev,
        tags: prev.tags.filter((_, i) => i !== index),
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        tags: (prev.tags || []).filter((_, i) => i !== index),
      }));
    }
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <span className="ml-1 text-xs">
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Banco de Perguntas</h2>
            <p className="text-sm text-muted-foreground">
              {state.questions.filter((q) => q.projectId === projectId).length} pergunta(s)
              cadastrada(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors">
              <Upload className="h-4 w-4" />
              Importar JSON
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova Pergunta
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar perguntas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Todas categorias</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Todas dificuldades</option>
            {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Todos status</option>
            <option value="active">Ativa</option>
            <option value="inactive">Inativa</option>
          </select>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir ({selectedIds.length})
            </button>
          )}
        </div>

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Nova Pergunta</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Pergunta *</label>
                  <textarea
                    value={formData.question}
                    onChange={(e) => setFormData((p) => ({ ...p, question: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Resposta Correta *</label>
                  <input
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData((p) => ({ ...p, correctAnswer: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Dica</label>
                  <input
                    value={formData.hint}
                    onChange={(e) => setFormData((p) => ({ ...p, hint: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Categoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as QuestionCategory }))}
                      className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Dificuldade</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData((p) => ({ ...p, difficulty: e.target.value as Difficulty }))}
                      className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Referência Bíblica</label>
                  <input
                    value={formData.biblicalReference}
                    onChange={(e) => setFormData((p) => ({ ...p, biblicalReference: e.target.value }))}
                    placeholder="ex: João 3:16"
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {formData.tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {tag}
                        <button onClick={() => removeTag('form', i)}><X className="h-3 w-3" /></button>
                      </span>
                    ))}
                  </div>
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addTag('form', tagInput); }
                    }}
                    placeholder="Pressione Enter para adicionar tag"
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Observações</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreate}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Criar Pergunta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={(e) =>
                        setSelectedIds(e.target.checked ? filtered.map((q) => q.id) : [])
                      }
                      className="rounded"
                    />
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground cursor-pointer" onClick={() => toggleSort('question')}>
                    Pergunta <SortIcon field="question" />
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Resposta</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground cursor-pointer" onClick={() => toggleSort('category')}>
                    Categoria <SortIcon field="category" />
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground cursor-pointer" onClick={() => toggleSort('difficulty')}>
                    Dificuldade <SortIcon field="difficulty" />
                  </th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground cursor-pointer" onClick={() => toggleSort('status')}>
                    Status <SortIcon field="status" />
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center text-muted-foreground">
                      <HelpCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>Nenhuma pergunta encontrada</p>
                      <p className="text-xs mt-1">Crie uma nova pergunta ou ajuste os filtros</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((q) => (
                    <tr key={q.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(q.id)}
                          onChange={(e) =>
                            setSelectedIds((prev) =>
                              e.target.checked
                                ? [...prev, q.id]
                                : prev.filter((id) => id !== q.id)
                            )
                          }
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-3">
                        {editingId === q.id ? (
                          <input
                            value={editForm.question || ''}
                            onChange={(e) => setEditForm((p) => ({ ...p, question: e.target.value }))}
                            className="w-full rounded border border-border bg-muted/50 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <div>
                            <p className="font-medium text-foreground line-clamp-1">{q.question}</p>
                            {q.biblicalReference && (
                              <p className="text-xs text-muted-foreground">{q.biblicalReference}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {editingId === q.id ? (
                          <input
                            value={editForm.correctAnswer || ''}
                            onChange={(e) => setEditForm((p) => ({ ...p, correctAnswer: e.target.value }))}
                            className="w-full rounded border border-border bg-muted/50 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <span className="text-muted-foreground line-clamp-1">{q.correctAnswer}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs">
                          {CATEGORY_LABELS[q.category]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                            q.difficulty === 'facil'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : q.difficulty === 'medio'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {DIFFICULTY_LABELS[q.difficulty]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                            q.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {q.status === 'active' ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {editingId === q.id ? (
                            <>
                              <button onClick={handleUpdate} className="rounded p-1 hover:bg-emerald-500/10 text-emerald-500">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => { setEditingId(null); setEditForm({}); }} className="rounded p-1 hover:bg-muted text-muted-foreground">
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setEditingId(q.id); setEditForm(q); }}
                                className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDuplicate(q)}
                                className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(q.id)}
                                className="rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function HelpCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
