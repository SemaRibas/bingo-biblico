'use client';

import React, { useState, useMemo } from 'react';

import { useApp } from '@/contexts/AppContext';
import type { BibleQuestion, QuestionCategory, Difficulty } from '@/types';
import { generateId, CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/lib/utils';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Copy,
  Check,
  X,
  Upload,
  HelpCircle,
  FileText,
  Wand2,
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
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [batchPreview, setBatchPreview] = useState<Array<{ question: string; answer: string; category: string; difficulty: string; autoDetected: boolean }>>([]);

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
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, value.trim()] }));
    } else {
      setEditForm((prev) => ({ ...prev, tags: [...(prev.tags || []), value.trim()] }));
    }
    setTagInput('');
  };

  const removeTag = (target: 'form' | 'edit', index: number) => {
    if (target === 'form') {
      setFormData((prev) => ({ ...prev, tags: prev.tags.filter((_, i) => i !== index) }));
    } else {
      setEditForm((prev) => ({ ...prev, tags: (prev.tags || []).filter((_, i) => i !== index) }));
    }
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <span className="ml-1 text-[10px]">
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const autoDetectCategory = (text: string): QuestionCategory => {
    const lower = text.toLowerCase();
    if (/mateus|lucas|marcos|joão|evangelho|jesus|cristo/.test(lower)) return 'evangelhos';
    if (/gênesis|êxodo|levítico|números|deuteronômio|moisés|abraão|israel|antigo/.test(lower)) return 'antigo_testamento';
    if (/paulo|romanoss|coríntios|efésios|filipenses|colossenses|cartas|epístolas/.test(lower)) return 'cartas';
    if (/profeta|isaías|jeremias|ezequiel|daniel|amós|oseias/.test(lower)) return 'profetas';
    if (/milagre|curou|ressuscitou|multiplicou|transformou/.test(lower)) return 'milagres';
    if (/adão|eva|noé|davi|abraão|ismael|jacob|josé|pedro|paulo/.test(lower)) return 'personagens';
    if (/apocalipse|revelação|nova criatura|céu|inferno|paraiso/.test(lower)) return 'novo_testamento';
    return 'antigo_testamento';
  };

  const autoDetectDifficulty = (text: string): Difficulty => {
    const lower = text.toLowerCase();
    const wordCount = text.split(/\s+/).length;
    if (wordCount <= 5 || /fácil|quem|qual|onde/.test(lower)) return 'facil';
    if (wordCount >= 12 || /explique|descreva|comparar|diferença/.test(lower)) return 'dificil';
    return 'medio';
  };

  const parseBatchText = () => {
    const lines = batchText.split('\n').filter((l) => l.trim());
    const parsed = lines.map((line) => {
      const parts = line.split(/[|\t;]/).map((p) => p.trim());
      const question = parts[0] || '';
      const answer = parts[1] || '';
      const category = parts[2] ? (Object.keys(CATEGORY_LABELS).includes(parts[2]) ? parts[2] : autoDetectCategory(question)) : autoDetectCategory(question);
      const difficulty = parts[3] ? (Object.keys(DIFFICULTY_LABELS).includes(parts[3]) ? parts[3] : autoDetectDifficulty(question)) : autoDetectDifficulty(question);
      const autoDetected = !parts[2] || !Object.keys(CATEGORY_LABELS).includes(parts[2]);
      return { question, answer, category, difficulty, autoDetected };
    }).filter((p) => p.question && p.answer);
    setBatchPreview(parsed);
  };

  const handleBatchImport = () => {
    batchPreview.forEach((item) => {
      const now = new Date().toISOString();
      const q: BibleQuestion = {
        id: generateId(),
        projectId: projectId || '',
        question: item.question,
        correctAnswer: item.answer,
        hint: '',
        category: item.category as QuestionCategory,
        difficulty: item.difficulty as Difficulty,
        tags: [],
        status: 'active',
        notes: '',
        biblicalReference: '',
        linkedCells: [],
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: 'ADD_QUESTION', payload: q });
    });
    setShowBatchImport(false);
    setBatchText('');
    setBatchPreview([]);
  };

  const inputStyle = {
    background: 'var(--muted)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
  };

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Banco de Perguntas</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {state.questions.filter((q) => q.projectId === projectId).length} pergunta(s) cadastrada(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label
              className="flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-200 hover:shadow-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--card)' }}
            >
              <Upload className="h-4 w-4" />
              Importar JSON
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button
              onClick={() => setShowBatchImport(true)}
              className="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-200 hover:shadow-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--card)' }}
            >
              <FileText className="h-4 w-4" />
              Importação em Lote
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn-glow flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'var(--accent-gradient)' }}
            >
              <Plus className="h-4 w-4" />
              Nova Pergunta
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card-base rounded-xl p-4 animate-fade-in" style={{ animationDelay: '60ms', animationFillMode: 'both' }}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Buscar perguntas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border pl-9 pr-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                style={inputStyle}
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
              style={inputStyle}
            >
              <option value="">Todas categorias</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="h-9 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
              style={inputStyle}
            >
              <option value="">Todas dificuldades</option>
              {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
              style={inputStyle}
            >
              <option value="">Todos status</option>
              <option value="active">Ativa</option>
              <option value="inactive">Inativa</option>
            </select>
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 rounded-xl bg-destructive px-3.5 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl animate-scale-in" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Nova Pergunta</h3>
                <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Pergunta *</label>
                  <textarea
                    value={formData.question}
                    onChange={(e) => setFormData((p) => ({ ...p, question: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                    style={inputStyle}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Resposta Correta *</label>
                  <input
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData((p) => ({ ...p, correctAnswer: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Dica</label>
                  <input
                    value={formData.hint}
                    onChange={(e) => setFormData((p) => ({ ...p, hint: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                    style={inputStyle}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Categoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as QuestionCategory }))}
                      className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                      style={inputStyle}
                    >
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Dificuldade</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData((p) => ({ ...p, difficulty: e.target.value as Difficulty }))}
                      className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                      style={inputStyle}
                    >
                      {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Referência Bíblica</label>
                  <input
                    value={formData.biblicalReference}
                    onChange={(e) => setFormData((p) => ({ ...p, biblicalReference: e.target.value }))}
                    placeholder="ex: João 3:16"
                    className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Tags</label>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {formData.tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium">
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
                    className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Observações</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                    style={inputStyle}
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:bg-[var(--muted)]"
                    style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreate}
                    className="btn-glow rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/20"
                    style={{ background: 'var(--accent-gradient)' }}
                  >
                    Criar Pergunta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card-base rounded-xl overflow-hidden animate-fade-in" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={(e) => setSelectedIds(e.target.checked ? filtered.map((q) => q.id) : [])}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer" style={{ color: 'var(--muted-foreground)' }} onClick={() => toggleSort('question')}>
                    Pergunta <SortIcon field="question" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Resposta</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer" style={{ color: 'var(--muted-foreground)' }} onClick={() => toggleSort('category')}>
                    Categoria <SortIcon field="category" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer" style={{ color: 'var(--muted-foreground)' }} onClick={() => toggleSort('difficulty')}>
                    Dificuldade <SortIcon field="difficulty" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer" style={{ color: 'var(--muted-foreground)' }} onClick={() => toggleSort('status')}>
                    Status <SortIcon field="status" />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center" style={{ color: 'var(--muted-foreground)' }}>
                      <HelpCircle className="mx-auto h-10 w-10 mb-3 opacity-30" />
                      <p className="font-medium">Nenhuma pergunta encontrada</p>
                      <p className="text-xs mt-1 opacity-60">Crie uma nova pergunta ou ajuste os filtros</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((q, i) => (
                    <tr
                      key={q.id}
                      className="border-b transition-colors hover:bg-[var(--muted)]/50"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(q.id)}
                          onChange={(e) =>
                            setSelectedIds((prev) =>
                              e.target.checked ? [...prev, q.id] : prev.filter((id) => id !== q.id)
                            )
                          }
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {editingId === q.id ? (
                          <input
                            value={editForm.question || ''}
                            onChange={(e) => setEditForm((p) => ({ ...p, question: e.target.value }))}
                            className="w-full rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                            style={inputStyle}
                          />
                        ) : (
                          <div>
                            <p className="font-medium line-clamp-1" style={{ color: 'var(--foreground)' }}>{q.question}</p>
                            {q.biblicalReference && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{q.biblicalReference}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === q.id ? (
                          <input
                            value={editForm.correctAnswer || ''}
                            onChange={(e) => setEditForm((p) => ({ ...p, correctAnswer: e.target.value }))}
                            className="w-full rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
                            style={inputStyle}
                          />
                        ) : (
                          <span className="line-clamp-1" style={{ color: 'var(--muted-foreground)' }}>{q.correctAnswer}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                          {CATEGORY_LABELS[q.category]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${
                            q.difficulty === 'facil'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : q.difficulty === 'medio'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {DIFFICULTY_LABELS[q.difficulty]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            q.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : ''
                          }`}
                          style={q.status !== 'active' ? { background: 'var(--muted)', color: 'var(--muted-foreground)' } : undefined}
                        >
                          {q.status === 'active' ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {editingId === q.id ? (
                            <>
                              <button onClick={handleUpdate} className="rounded-lg p-1.5 hover:bg-emerald-500/10 text-emerald-500 transition-colors">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => { setEditingId(null); setEditForm({}); }} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditingId(q.id); setEditForm(q); }} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDuplicate(q)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDelete(q.id)} className="rounded-lg p-1.5 hover:bg-destructive/10 transition-colors" style={{ color: 'var(--muted-foreground)' }}>
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

        {/* Batch Import Modal */}
        {showBatchImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl animate-scale-in" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                  <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Importação em Lote</h3>
                </div>
                <button onClick={() => { setShowBatchImport(false); setBatchText(''); setBatchPreview([]); }} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
                    Formato: <code className="rounded bg-[var(--muted)] px-1">Pergunta | Resposta | Categoria | Dificuldade</code> (uma por linha). Categoria e dificuldade são opcionais — o sistema auto-detecta.
                  </p>
                  <textarea
                    value={batchText}
                    onChange={(e) => setBatchText(e.target.value)}
                    placeholder={`Quem é o pai de Abraão? | Terá\nQual é o maior mandamento? | Amar a Deus\nde tudo o seu coração | novo_testamento | facil`}
                    className="w-full rounded-xl border px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                    style={inputStyle}
                    rows={8}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <button onClick={parseBatchText} disabled={!batchText.trim()} className="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all hover:shadow-sm disabled:opacity-50" style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--card)' }}>
                    <Wand2 className="h-4 w-4" /> Analisar e Auto-detectar
                  </button>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{batchPreview.length} pergunta(s) encontrada(s)</span>
                </div>
                {batchPreview.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {batchPreview.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{item.question}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{item.answer}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.autoDetected && <Wand2 className="h-3 w-3 text-amber-500" />}
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{CATEGORY_LABELS[item.category] || item.category}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.difficulty === 'facil' ? 'bg-emerald-500/10 text-emerald-600' : item.difficulty === 'dificil' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>{DIFFICULTY_LABELS[item.difficulty]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => { setShowBatchImport(false); setBatchText(''); setBatchPreview([]); }} className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:bg-[var(--muted)]" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Cancelar</button>
                  <button onClick={handleBatchImport} disabled={batchPreview.length === 0} className="btn-glow rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50" style={{ background: 'var(--accent-gradient)' }}>Importar {batchPreview.length} Pergunta(s)</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
}
