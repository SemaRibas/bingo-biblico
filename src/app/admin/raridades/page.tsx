'use client';

import React, { useState, useMemo } from 'react';

import { useApp } from '@/contexts/AppContext';
import { useNotification } from '@/contexts/NotificationContext';
import type { Rarity, RarityDistribution, RewardType } from '@/types';
import { generateId, REWARD_TYPE_LABELS, DEFAULT_RARITY_PRESETS } from '@/lib/utils';
import { Plus, Trash2, Sparkles, Eye, X, Copy, Edit3 } from 'lucide-react';

const EMPTY_RARITY: Omit<Rarity, 'id' | 'createdAt' | 'updatedAt'> = {
  projectId: '', name: '', slug: '', color: '#818cf8', secondaryColor: '', gradient: false, gradientStyle: 'linear',
  glowIntensity: 50, particleIntensity: 30, animationSpeed: 2, particleSize: 4, opacity: 80, borderSpecial: '', icon: '', order: 0, active: true,
  distributions: [{ rewardType: 'versiculo', percentage: 40 }, { rewardType: 'doce', percentage: 30 }, { rewardType: 'bonus', percentage: 20 }, { rewardType: 'premio', percentage: 10 }],
};

function EnvelopePreview({ rarity }: { rarity: Partial<Rarity> }) {
  const glow = rarity.glowIntensity || 0;
  const particles = rarity.particleIntensity || 0;
  const color = rarity.color || '#818cf8';
  const secondaryColor = rarity.secondaryColor || color;
  const gradient = rarity.gradient;
  const gradientStyle = rarity.gradientStyle || 'linear';
  const speed = rarity.animationSpeed || 2;
  const pSize = rarity.particleSize || 4;
  const opacity = (rarity.opacity || 80) / 100;
  const gradientBg = gradient ? `${gradientStyle}-gradient(135deg, ${color}, ${secondaryColor})` : color;

  return (
    <div className="relative flex items-center justify-center">
      <div className="relative w-32 h-44 rounded-2xl overflow-hidden transition-all duration-300" style={{ background: gradientBg, boxShadow: glow > 0 ? `0 0 ${glow / 5}px ${color}40, 0 0 ${glow / 2}px ${color}20, inset 0 0 ${glow / 3}px ${color}15` : '0 4px 12px rgba(0,0,0,0.15)', opacity }}>
        {glow > 20 && <div className="absolute inset-0 rarity-glow" style={{ background: `radial-gradient(circle at 30% 30%, ${color}${Math.round(glow * 0.4).toString(16).padStart(2, '0')}, transparent 70%)`, animationDuration: `${3 / speed}s` }} />}
        {particles > 10 && <div className="absolute inset-0 overflow-hidden">{Array.from({ length: Math.floor(particles / 10) }).map((_, i) => (<div key={i} className="absolute rounded-full rarity-float" style={{ width: `${pSize}px`, height: `${pSize}px`, background: `rgba(255,255,255,${0.3 + particles / 200})`, left: `${15 + (i * 17) % 70}%`, top: `${20 + (i * 23) % 60}%`, animationDelay: `${i * 0.3}s`, animationDuration: `${2 / speed}s` }} />))}</div>}
        <div className="absolute top-0 left-0 right-0 h-12" style={{ background: gradientBg, clipPath: 'polygon(0 0, 100% 0, 50% 100%)', filter: 'brightness(0.85)' }} />
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center"><Sparkles className="w-3 h-3 text-white/70" /></div>
      </div>
    </div>
  );
}

export default function RaridadesPage() {
  const { state, dispatch, projectId } = useApp();
  const { confirm } = useNotification();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_RARITY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewRarity, setPreviewRarity] = useState<Partial<Rarity> | null>(null);

  const projectRarities = useMemo(() => state.rarities.filter((r) => r.projectId === projectId).sort((a, b) => a.order - b.order), [state.rarities, projectId]);

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    const slug = formData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
    const now = new Date().toISOString();
    dispatch({ type: 'ADD_RARITY', payload: { ...formData, id: generateId(), projectId: projectId || '', slug, order: projectRarities.length + 1, createdAt: now, updatedAt: now } });
    setFormData(EMPTY_RARITY);
    setShowForm(false);
  };

  const handleUpdate = () => {
    if (!editingId) return;
    const original = state.rarities.find((r) => r.id === editingId);
    if (!original) return;
    dispatch({ type: 'UPDATE_RARITY', payload: { ...original, ...formData, updatedAt: new Date().toISOString() } });
    setEditingId(null);
    setFormData(EMPTY_RARITY);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => { if (!await confirm({ title: 'Excluir raridade', message: 'Tem certeza que deseja excluir esta raridade?', variant: 'danger' })) return; dispatch({ type: 'DELETE_RARITY', payload: id }); };
  const handleDuplicate = (r: Rarity) => { const now = new Date().toISOString(); dispatch({ type: 'ADD_RARITY', payload: { ...r, id: generateId(), name: `${r.name} (Cópia)`, createdAt: now, updatedAt: now } }); };
  const applyPreset = (preset: (typeof DEFAULT_RARITY_PRESETS)[0]) => { setFormData((prev) => ({ ...prev, name: preset.name, slug: preset.slug, color: preset.color, glowIntensity: preset.glowIntensity, particleIntensity: preset.particleIntensity, animationSpeed: preset.animationSpeed, particleSize: preset.particleSize, opacity: preset.opacity })); };
  const updateDistribution = (index: number, field: keyof RarityDistribution, value: string | number) => { setFormData((prev) => { const dists = [...prev.distributions]; dists[index] = { ...dists[index], [field]: value }; return { ...prev, distributions: dists }; }); };
  const addDistribution = () => { setFormData((prev) => ({ ...prev, distributions: [...prev.distributions, { rewardType: 'versiculo' as RewardType, percentage: 0 }] })); };
  const removeDistribution = (index: number) => { setFormData((prev) => ({ ...prev, distributions: prev.distributions.filter((_, i) => i !== index) })); };
  const distTotal = formData.distributions.reduce((sum, d) => sum + d.percentage, 0);
  const startEdit = (rarity: Rarity) => { setEditingId(rarity.id); setFormData(rarity); setShowForm(true); };

  const inputStyle = { background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Raridades</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Configure as raridades e efeitos visuais dos envelopes</p>
          </div>
          <button onClick={() => { setEditingId(null); setFormData(EMPTY_RARITY); setShowForm(true); }} className="btn-glow flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]" style={{ background: 'var(--accent-gradient)' }}>
            <Plus className="h-4 w-4" /> Nova Raridade
          </button>
        </div>

        <div className="card-base rounded-xl p-4 animate-fade-in" style={{ animationDelay: '60ms', animationFillMode: 'both' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--foreground)' }}>Presets Rápidos</h3>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_RARITY_PRESETS.map((preset) => (
              <button key={preset.slug} onClick={() => applyPreset(preset)} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all hover:shadow-sm" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                <div className="h-3 w-3 rounded-full" style={{ background: preset.color }} />
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {projectRarities.length === 0 ? (
          <div className="card-base rounded-xl py-16 text-center animate-fade-in">
            <Sparkles className="mx-auto h-12 w-12 opacity-20" style={{ color: 'var(--muted-foreground)' }} />
            <p className="mt-3 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Nenhuma raridade configurada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projectRarities.map((rarity, i) => {
              const distTotal = rarity.distributions.reduce((s, d) => s + d.percentage, 0);
              return (
                <div key={rarity.id} className="group card-base rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: rarity.gradient ? `${rarity.gradientStyle || 'linear'}-gradient(135deg, ${rarity.color}, ${rarity.secondaryColor || rarity.color})` : rarity.color }}>
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{rarity.name}</h4>
                        <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>Glow: {rarity.glowIntensity}% • Partículas: {rarity.particleIntensity}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setPreviewRarity(rarity)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => startEdit(rarity)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}><Edit3 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDuplicate(rarity)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}><Copy className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(rarity.id)} className="rounded-lg p-1.5 hover:bg-destructive/10 transition-colors" style={{ color: 'var(--muted-foreground)' }}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex h-2 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                      {rarity.distributions.map((d, i) => (<div key={i} className="h-full transition-all" style={{ width: `${d.percentage}%`, background: `hsl(${(i * 60) % 360}, 70%, 55%)` }} />))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {rarity.distributions.map((d, i) => (<span key={i} className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{REWARD_TYPE_LABELS[d.rewardType]}: {d.percentage}%</span>))}
                      <span className={`text-[10px] font-medium ${distTotal === 100 ? 'text-emerald-500' : 'text-destructive'}`}>Total: {distTotal}%</span>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${rarity.active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : ''}`} style={!rarity.active ? { background: 'var(--muted)', color: 'var(--muted-foreground)' } : undefined}>
                    {rarity.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {previewRarity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl animate-scale-in" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-4"><h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>{previewRarity.name}</h3><button onClick={() => setPreviewRarity(null)} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}><X className="h-4 w-4" /></button></div>
              <div className="flex justify-center"><EnvelopePreview rarity={previewRarity} /></div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl animate-scale-in" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>{editingId ? 'Editar Raridade' : 'Nova Raridade'}</h3>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors" style={{ color: 'var(--muted-foreground)' }}><X className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div><label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Nome *</label><input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Cor Principal</label><div className="mt-1.5 flex items-center gap-2"><input type="color" value={formData.color} onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))} className="h-9 w-9 rounded-lg border cursor-pointer" style={{ borderColor: 'var(--border)' }} /><input value={formData.color} onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))} className="flex-1 rounded-xl border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle} /></div></div>
                    <div><label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Cor Secundária</label><div className="mt-1.5 flex items-center gap-2"><input type="color" value={formData.secondaryColor || formData.color} onChange={(e) => setFormData((p) => ({ ...p, secondaryColor: e.target.value }))} className="h-9 w-9 rounded-lg border cursor-pointer" style={{ borderColor: 'var(--border)' }} /><input value={formData.secondaryColor || ''} onChange={(e) => setFormData((p) => ({ ...p, secondaryColor: e.target.value }))} placeholder="#hex" className="flex-1 rounded-xl border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle} /></div></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--foreground)' }}><input type="checkbox" checked={formData.gradient} onChange={(e) => setFormData((p) => ({ ...p, gradient: e.target.checked }))} className="rounded" /> Usar Gradiente</label>
                    {formData.gradient && <select value={formData.gradientStyle} onChange={(e) => setFormData((p) => ({ ...p, gradientStyle: e.target.value as 'linear' | 'radial' }))} className="rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle}><option value="linear">Linear</option><option value="radial">Radial</option></select>}
                  </div>
                  <div className="space-y-3">
                    {[{ label: 'Intensidade de Brilho', field: 'glowIntensity', value: formData.glowIntensity, suffix: '%' }, { label: 'Intensidade de Partículas', field: 'particleIntensity', value: formData.particleIntensity, suffix: '%' }, { label: 'Velocidade da Animação', field: 'animationSpeed', value: formData.animationSpeed, suffix: 'x', step: 0.5 }, { label: 'Tamanho das Partículas', field: 'particleSize', value: formData.particleSize, suffix: 'px' }, { label: 'Opacidade', field: 'opacity', value: formData.opacity, suffix: '%' }].map(({ label, field, value, suffix, step }) => (
                      <div key={field}>
                        <div className="flex justify-between text-sm"><label className="font-medium" style={{ color: 'var(--foreground)' }}>{label}</label><span style={{ color: 'var(--muted-foreground)' }}>{value}{suffix}</span></div>
                        <input type="range" min={field === 'animationSpeed' ? 0.5 : field === 'particleSize' ? 1 : field === 'opacity' ? 10 : 0} max={field === 'animationSpeed' ? 5 : field === 'particleSize' ? 10 : 100} step={step || 1} value={value} onChange={(e) => setFormData((p) => ({ ...p, [field]: step ? parseFloat(e.target.value) : parseInt(e.target.value) }))} className="mt-1 w-full accent-primary" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2"><label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Distribuição de Recompensas</label><span className={`text-xs font-medium ${distTotal === 100 ? 'text-emerald-500' : 'text-destructive'}`}>Total: {distTotal}%</span></div>
                    <div className="space-y-2">
                      {formData.distributions.map((dist, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <select value={dist.rewardType} onChange={(e) => updateDistribution(i, 'rewardType', e.target.value)} className="flex-1 rounded-xl border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" style={inputStyle}>{Object.entries(REWARD_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                          <input type="number" min={0} max={100} value={dist.percentage} onChange={(e) => updateDistribution(i, 'percentage', parseInt(e.target.value) || 0)} className="w-16 rounded-xl border px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" style={inputStyle} />
                          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>%</span>
                          <button onClick={() => removeDistribution(i)} className="rounded-lg p-1 hover:bg-destructive/10 transition-colors" style={{ color: 'var(--muted-foreground)' }}><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                    </div>
                    <button onClick={addDistribution} className="mt-2 text-xs text-primary font-medium hover:underline">+ Adicionar tipo</button>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:bg-[var(--muted)]" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Cancelar</button>
                    <button onClick={editingId ? handleUpdate : handleCreate} className="btn-glow rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/20" style={{ background: 'var(--accent-gradient)' }}>{editingId ? 'Salvar' : 'Criar'}</button>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl border p-6" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
                  <p className="text-xs font-medium mb-4" style={{ color: 'var(--muted-foreground)' }}>Preview ao Vivo</p>
                  <EnvelopePreview rarity={formData} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
}
