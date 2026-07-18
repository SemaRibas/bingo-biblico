'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import type { Envelope, RewardType } from '@/types';
import { generateId, REWARD_TYPE_LABELS } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Mail,
  Eye,
  X,
  Copy,
  Filter,
  Check,
  Sparkles,
  Package,
} from 'lucide-react';

export default function EnvelopesPage() {
  const { state, dispatch, projectId } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [filterRarity, setFilterRarity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [previewEnvelope, setPreviewEnvelope] = useState<Envelope | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    rarityId: '',
    description: '',
    rewardType: 'versiculo' as RewardType,
    quantity: 1,
    icon: '',
    status: 'active' as const,
  });
  const [batchData, setBatchData] = useState({
    name: '',
    rarityId: '',
    rewardType: 'versiculo' as RewardType,
    description: '',
    count: 10,
  });

  const projectEnvelopes = useMemo(
    () => state.envelopes.filter((e) => e.projectId === projectId),
    [state.envelopes, projectId]
  );

  const projectRarities = useMemo(
    () => state.rarities.filter((r) => r.projectId === projectId && r.active),
    [state.rarities, projectId]
  );

  const filtered = useMemo(() => {
    let items = projectEnvelopes;
    if (filterRarity) items = items.filter((e) => e.rarityId === filterRarity);
    if (filterType) items = items.filter((e) => e.rewardType === filterType);
    return items;
  }, [projectEnvelopes, filterRarity, filterType]);

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    const now = new Date().toISOString();
    const envelope: Envelope = {
      ...formData,
      id: generateId(),
      projectId: projectId || '',
      code: formData.code || `ENV-${Date.now().toString(36).toUpperCase()}`,
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_ENVELOPE', payload: envelope });
    setFormData({ name: '', code: '', rarityId: '', description: '', rewardType: 'versiculo', quantity: 1, icon: '', status: 'active' });
    setShowForm(false);
  };

  const handleBatchCreate = () => {
    if (!batchData.name.trim() || batchData.count < 1) return;
    const now = new Date().toISOString();
    for (let i = 0; i < batchData.count; i++) {
      const envelope: Envelope = {
        id: generateId(),
        projectId: projectId || '',
        name: `${batchData.name} ${i + 1}`,
        code: `ENV-${Date.now().toString(36).toUpperCase()}-${i}`,
        rarityId: batchData.rarityId,
        description: batchData.description,
        rewardType: batchData.rewardType,
        quantity: 1,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: 'ADD_ENVELOPE', payload: envelope });
    }
    setShowBatch(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Excluir este envelope?')) return;
    dispatch({ type: 'DELETE_ENVELOPE', payload: id });
  };

  const handleDuplicate = (env: Envelope) => {
    dispatch({
      type: 'ADD_ENVELOPE',
      payload: {
        ...env,
        id: generateId(),
        name: `${env.name} (Cópia)`,
        code: `${env.code}-COPY`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleStatusChange = (id: string, status: Envelope['status']) => {
    const env = state.envelopes.find((e) => e.id === id);
    if (!env) return;
    dispatch({
      type: 'UPDATE_ENVELOPE',
      payload: { ...env, status, updatedAt: new Date().toISOString() },
    });
  };

  const getRarityName = (rarityId: string) => {
    const r = state.rarities.find((r) => r.id === rarityId);
    return r?.name || 'Sem raridade';
  };

  const getRarityColor = (rarityId: string) => {
    const r = state.rarities.find((r) => r.id === rarityId);
    return r?.color || '#9CA3AF';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Envelopes Surpresa</h2>
            <p className="text-sm text-muted-foreground">
              {projectEnvelopes.length} envelope(s) cadastrado(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBatch(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Package className="h-4 w-4" />
              Gerar Lote
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Novo Envelope
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Todas raridades</option>
            {projectRarities.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Todos tipos</option>
            {Object.entries(REWARD_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Envelopes Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center">
            <Mail className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">Nenhum envelope encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((env) => (
              <div
                key={env.id}
                className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ background: getRarityColor(env.rarityId) + '20' }}
                    >
                      <Mail className="h-4 w-4" style={{ color: getRarityColor(env.rarityId) }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{env.name}</h4>
                      <p className="text-xs text-muted-foreground font-mono">{env.code}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      env.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : env.status === 'delivered'
                        ? 'bg-blue-500/10 text-blue-500'
                        : env.status === 'consumed'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {env.status === 'active'
                      ? 'Ativo'
                      : env.status === 'delivered'
                      ? 'Entregue'
                      : env.status === 'consumed'
                      ? 'Consumido'
                      : 'Inativo'}
                  </span>
                </div>

                <div className="space-y-1 mb-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Tipo:</span> {REWARD_TYPE_LABELS[env.rewardType]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Raridade:</span>{' '}
                    <span style={{ color: getRarityColor(env.rarityId) }}>
                      {getRarityName(env.rarityId)}
                    </span>
                  </p>
                  {env.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{env.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setPreviewEnvelope(env)}
                    className="rounded p-1.5 hover:bg-muted text-muted-foreground"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(env)}
                    className="rounded p-1.5 hover:bg-muted text-muted-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {env.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(env.id, 'delivered')}
                      className="rounded p-1.5 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500"
                      title="Marcar como entregue"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(env.id)}
                    className="rounded p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {previewEnvelope && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">{previewEnvelope.name}</h3>
                <button onClick={() => setPreviewEnvelope(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex justify-center mb-4">
                <div
                  className="w-40 h-56 rounded-xl flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    background: getRarityColor(previewEnvelope.rarityId),
                    boxShadow: `0 8px 32px ${getRarityColor(previewEnvelope.rarityId)}40`,
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-14" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', filter: 'brightness(0.85)' }} />
                  <Sparkles className="w-8 h-8 text-white/80 mt-6" />
                  <p className="text-white/90 text-sm font-medium mt-2">{REWARD_TYPE_LABELS[previewEnvelope.rewardType]}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Código:</span> {previewEnvelope.code}</p>
                <p><span className="text-muted-foreground">Raridade:</span> <span style={{ color: getRarityColor(previewEnvelope.rarityId) }}>{getRarityName(previewEnvelope.rarityId)}</span></p>
                {previewEnvelope.description && <p><span className="text-muted-foreground">Descrição:</span> {previewEnvelope.description}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Novo Envelope</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome *</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Código</label>
                  <input
                    value={formData.code}
                    onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                    placeholder="Gerado automaticamente"
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Raridade</label>
                  <select
                    value={formData.rarityId}
                    onChange={(e) => setFormData((p) => ({ ...p, rarityId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Selecione...</option>
                    {projectRarities.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo de Conteúdo</label>
                  <select
                    value={formData.rewardType}
                    onChange={(e) => setFormData((p) => ({ ...p, rewardType: e.target.value as RewardType }))}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {Object.entries(REWARD_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowForm(false)} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors">Cancelar</button>
                  <button onClick={handleCreate} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">Criar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batch Create Modal */}
        {showBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Gerar Lote de Envelopes</h3>
                <button onClick={() => setShowBatch(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome Base *</label>
                  <input
                    value={batchData.name}
                    onChange={(e) => setBatchData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: Envelope Sorte"
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Quantidade</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={batchData.count}
                    onChange={(e) => setBatchData((p) => ({ ...p, count: parseInt(e.target.value) || 1 }))}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Raridade</label>
                  <select
                    value={batchData.rarityId}
                    onChange={(e) => setBatchData((p) => ({ ...p, rarityId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Selecione...</option>
                    {projectRarities.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo de Conteúdo</label>
                  <select
                    value={batchData.rewardType}
                    onChange={(e) => setBatchData((p) => ({ ...p, rewardType: e.target.value as RewardType }))}
                    className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {Object.entries(REWARD_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowBatch(false)} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors">Cancelar</button>
                  <button onClick={handleBatchCreate} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">Gerar {batchData.count}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
