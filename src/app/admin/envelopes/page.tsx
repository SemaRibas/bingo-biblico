'use client';

import React, { useState, useMemo } from 'react';

import { useApp } from '@/contexts/AppContext';
import { useNotification } from '@/contexts/NotificationContext';
import type { Envelope, RewardType } from '@/types';
import { generateId, REWARD_TYPE_LABELS } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Mail,
  Eye,
  X,
  Copy,
  Check,
  Sparkles,
  Package,
} from 'lucide-react';

export default function EnvelopesPage() {
  const { state, dispatch, projectId } = useApp();
  const { confirm } = useNotification();
  const [showForm, setShowForm] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [filterRarity, setFilterRarity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [previewEnvelope, setPreviewEnvelope] = useState<Envelope | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', rarityId: '', description: '', rewardType: 'versiculo' as RewardType, quantity: 1, icon: '', status: 'active' as const });
  const [batchData, setBatchData] = useState({ name: '', rarityId: '', rewardType: 'versiculo' as RewardType, description: '', count: 10 });

  const projectEnvelopes = useMemo(() => state.envelopes.filter((e) => e.projectId === projectId), [state.envelopes, projectId]);
  const projectRarities = useMemo(() => state.rarities.filter((r) => r.projectId === projectId && r.active), [state.rarities, projectId]);
  const filtered = useMemo(() => {
    let items = projectEnvelopes;
    if (filterRarity) items = items.filter((e) => e.rarityId === filterRarity);
    if (filterType) items = items.filter((e) => e.rewardType === filterType);
    return items;
  }, [projectEnvelopes, filterRarity, filterType]);

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_ENVELOPE', payload: { ...formData, id: generateId(), projectId: projectId || '', code: formData.code || `ENV-${Date.now().toString(36).toUpperCase()}`, createdAt: now, updatedAt: now } });
    setFormData({ name: '', code: '', rarityId: '', description: '', rewardType: 'versiculo', quantity: 1, icon: '', status: 'active' });
    setShowForm(false);
  };

  const handleBatchCreate = () => {
    if (!batchData.name.trim() || batchData.count < 1) return;
    const now = new Date().toISOString();
    for (let i = 0; i < batchData.count; i++) {
      dispatch({ type: 'ADD_ENVELOPE', payload: { id: generateId(), projectId: projectId || '', name: `${batchData.name} ${i + 1}`, code: `ENV-${Date.now().toString(36).toUpperCase()}-${i}`, rarityId: batchData.rarityId, description: batchData.description, rewardType: batchData.rewardType, quantity: 1, status: 'active', createdAt: now, updatedAt: now } });
    }
    setShowBatch(false);
  };

  const handleDelete = async (id: string) => { if (!await confirm({ title: 'Excluir envelope', message: 'Tem certeza que deseja excluir este envelope?', variant: 'danger' })) return; dispatch({ type: 'DELETE_ENVELOPE', payload: id }); };
  const handleDuplicate = (env: Envelope) => { dispatch({ type: 'ADD_ENVELOPE', payload: { ...env, id: generateId(), name: `${env.name} (Cópia)`, code: `${env.code}-COPY`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }); };
  const handleStatusChange = (id: string, status: Envelope['status']) => { const env = state.envelopes.find((e) => e.id === id); if (!env) return; dispatch({ type: 'UPDATE_ENVELOPE', payload: { ...env, status, updatedAt: new Date().toISOString() } }); };
  const getRarityName = (rarityId: string) => state.rarities.find((r) => r.id === rarityId)?.name || 'Sem raridade';
  const getRarityColor = (rarityId: string) => state.rarities.find((r) => r.id === rarityId)?.color || '#9CA3AF';

  const inputStyle = { background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Envelopes Surpresa</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{projectEnvelopes.length} envelope(s) cadastrado(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowBatch(true)} className="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all hover:bg-[var(--muted)]" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
              <Package className="h-4 w-4" /> Gerar Lote
            </button>
            <button onClick={() => setShowForm(true)} className="btn-glow flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'var(--accent-gradient)' }}>
              <Plus className="h-4 w-4" /> Novo Envelope
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 animate-fade-in" style={{ animationDelay: '60ms', animationFillMode: 'both' }}>
          <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)} className="h-9 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle}>
            <option value="">Todas raridades</option>
            {projectRarities.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-9 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle}>
            <option value="">Todos tipos</option>
            {Object.entries(REWARD_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="card-base rounded-xl py-16 text-center animate-fade-in">
            <Mail className="mx-auto h-12 w-12 opacity-20" style={{ color: 'var(--muted-foreground)' }} />
            <p className="mt-3 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Nenhum envelope encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((env, i) => (
              <div key={env.id} className="group card-base rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: getRarityColor(env.rarityId) + '18' }}>
                      <Mail className="h-4 w-4" style={{ color: getRarityColor(env.rarityId) }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{env.name}</h4>
                      <p className="text-[11px] font-mono" style={{ color: 'var(--muted-foreground)' }}>{env.code}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${env.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : env.status === 'delivered' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : env.status === 'consumed' ? '' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}
                    style={env.status === 'consumed' ? { background: 'var(--muted)', color: 'var(--muted-foreground)' } : undefined}>
                    {env.status === 'active' ? 'Ativo' : env.status === 'delivered' ? 'Entregue' : env.status === 'consumed' ? 'Consumido' : 'Inativo'}
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}><span className="font-semibold">Tipo:</span> {REWARD_TYPE_LABELS[env.rewardType]}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}><span className="font-semibold">Raridade:</span> <span style={{ color: getRarityColor(env.rarityId) }}>{getRarityName(env.rarityId)}</span></p>
                  {env.description && <p className="text-xs line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{env.description}</p>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setPreviewEnvelope(env)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}><Eye className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDuplicate(env)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}><Copy className="h-3.5 w-3.5" /></button>
                  {env.status === 'active' && <button onClick={() => handleStatusChange(env.id, 'delivered')} className="rounded-lg p-1.5 hover:bg-blue-500/10 transition-colors" style={{ color: 'var(--muted-foreground)' }} title="Marcar como entregue"><Check className="h-3.5 w-3.5" /></button>}
                  <button onClick={() => handleDelete(env.id)} className="rounded-lg p-1.5 hover:bg-destructive/10 transition-colors ml-auto" style={{ color: 'var(--muted-foreground)' }}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {previewEnvelope && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl animate-scale-in" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>{previewEnvelope.name}</h3>
                <button onClick={() => setPreviewEnvelope(null)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}><X className="h-4 w-4" /></button>
              </div>
              <div className="flex justify-center mb-4">
                <div className="w-40 h-56 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden" style={{ background: getRarityColor(previewEnvelope.rarityId), boxShadow: `0 8px 32px ${getRarityColor(previewEnvelope.rarityId)}40` }}>
                  <div className="absolute top-0 left-0 right-0 h-14" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', filter: 'brightness(0.85)' }} />
                  <Sparkles className="w-8 h-8 text-white/80 mt-6" />
                  <p className="text-white/90 text-sm font-medium mt-2">{REWARD_TYPE_LABELS[previewEnvelope.rewardType]}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p style={{ color: 'var(--muted-foreground)' }}><span className="font-semibold">Código:</span> {previewEnvelope.code}</p>
                <p style={{ color: 'var(--muted-foreground)' }}><span className="font-semibold">Raridade:</span> <span style={{ color: getRarityColor(previewEnvelope.rarityId) }}>{getRarityName(previewEnvelope.rarityId)}</span></p>
                {previewEnvelope.description && <p style={{ color: 'var(--muted-foreground)' }}><span className="font-semibold">Descrição:</span> {previewEnvelope.description}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-scale-in" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Novo Envelope</h3>
                <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Nome *</label><input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle} /></div>
                <div><label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Código</label><input value={formData.code} onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))} placeholder="Gerado automaticamente" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle} /></div>
                <div><label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Raridade</label><select value={formData.rarityId} onChange={(e) => setFormData((p) => ({ ...p, rarityId: e.target.value }))} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle}><option value="">Selecione...</option>{projectRarities.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                <div><label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Tipo de Conteúdo</label><select value={formData.rewardType} onChange={(e) => setFormData((p) => ({ ...p, rewardType: e.target.value as RewardType }))} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle}>{Object.entries(REWARD_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                <div><label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Descrição</label><textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle} rows={2} /></div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:bg-[var(--muted)]" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Cancelar</button>
                  <button onClick={handleCreate} className="btn-glow rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/20" style={{ background: 'var(--accent-gradient)' }}>Criar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batch Create Modal */}
        {showBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-scale-in" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Gerar Lote de Envelopes</h3>
                <button onClick={() => setShowBatch(false)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Nome Base *</label><input value={batchData.name} onChange={(e) => setBatchData((p) => ({ ...p, name: e.target.value }))} placeholder="Ex: Envelope Sorte" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle} /></div>
                <div><label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Quantidade</label><input type="number" min={1} max={500} value={batchData.count} onChange={(e) => setBatchData((p) => ({ ...p, count: parseInt(e.target.value) || 1 }))} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle} /></div>
                <div><label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Raridade</label><select value={batchData.rarityId} onChange={(e) => setBatchData((p) => ({ ...p, rarityId: e.target.value }))} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle}><option value="">Selecione...</option>{projectRarities.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                <div><label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Tipo de Conteúdo</label><select value={batchData.rewardType} onChange={(e) => setBatchData((p) => ({ ...p, rewardType: e.target.value as RewardType }))} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle}>{Object.entries(REWARD_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowBatch(false)} className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:bg-[var(--muted)]" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Cancelar</button>
                  <button onClick={handleBatchCreate} className="btn-glow rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/20" style={{ background: 'var(--accent-gradient)' }}>Gerar {batchData.count}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
}
