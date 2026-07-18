'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import type { Rarity, RarityDistribution, RewardType } from '@/types';
import { generateId, REWARD_TYPE_LABELS, DEFAULT_RARITY_PRESETS } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Sparkles,
  Eye,
  X,
  Copy,
  Palette,
  Check,
} from 'lucide-react';

const EMPTY_RARITY: Omit<Rarity, 'id' | 'createdAt' | 'updatedAt'> = {
  projectId: '',
  name: '',
  slug: '',
  color: '#818cf8',
  secondaryColor: '',
  gradient: false,
  gradientStyle: 'linear',
  glowIntensity: 50,
  particleIntensity: 30,
  animationSpeed: 2,
  particleSize: 4,
  opacity: 80,
  borderSpecial: '',
  icon: '',
  order: 0,
  active: true,
  distributions: [
    { rewardType: 'versiculo', percentage: 40 },
    { rewardType: 'doce', percentage: 30 },
    { rewardType: 'bonus', percentage: 20 },
    { rewardType: 'premio', percentage: 10 },
  ],
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

  const gradientBg = gradient
    ? `${gradientStyle}-gradient(135deg, ${color}, ${secondaryColor})`
    : color;

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="relative w-32 h-44 rounded-xl overflow-hidden transition-all duration-300"
        style={{
          background: gradientBg,
          boxShadow: glow > 0
            ? `0 0 ${glow / 5}px ${color}40, 0 0 ${glow / 2}px ${color}20, inset 0 0 ${glow / 3}px ${color}15`
            : '0 4px 12px rgba(0,0,0,0.15)',
          opacity,
        }}
      >
        {/* Glow overlay */}
        {glow > 20 && (
          <div
            className="absolute inset-0 rarity-glow"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${color}${Math.round(glow * 0.4).toString(16).padStart(2, '0')}, transparent 70%)`,
              animationDuration: `${3 / speed}s`,
            }}
          />
        )}

        {/* Particles */}
        {particles > 10 && (
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: Math.floor(particles / 10) }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full rarity-float"
                style={{
                  width: `${pSize}px`,
                  height: `${pSize}px`,
                  background: `rgba(255,255,255,${0.3 + (particles / 200)})`,
                  left: `${15 + (i * 17) % 70}%`,
                  top: `${20 + (i * 23) % 60}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${2 / speed}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Envelope flap */}
        <div
          className="absolute top-0 left-0 right-0 h-12"
          style={{
            background: gradientBg,
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            filter: 'brightness(0.85)',
          }}
        />

        {/* Seal */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white/70" />
        </div>
      </div>
    </div>
  );
}

export default function RaridadesPage() {
  const { state, dispatch, projectId } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_RARITY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewRarity, setPreviewRarity] = useState<Partial<Rarity> | null>(null);

  const projectRarities = useMemo(
    () =>
      state.rarities
        .filter((r) => r.projectId === projectId)
        .sort((a, b) => a.order - b.order),
    [state.rarities, projectId]
  );

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    const slug = formData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
    const now = new Date().toISOString();
    const rarity: Rarity = {
      ...formData,
      id: generateId(),
      projectId: projectId || '',
      slug,
      order: projectRarities.length + 1,
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_RARITY', payload: rarity });
    setFormData(EMPTY_RARITY);
    setShowForm(false);
  };

  const handleUpdate = () => {
    if (!editingId) return;
    const original = state.rarities.find((r) => r.id === editingId);
    if (!original) return;
    dispatch({
      type: 'UPDATE_RARITY',
      payload: { ...original, ...formData, updatedAt: new Date().toISOString() },
    });
    setEditingId(null);
    setFormData(EMPTY_RARITY);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Excluir esta raridade?')) return;
    dispatch({ type: 'DELETE_RARITY', payload: id });
  };

  const handleDuplicate = (r: Rarity) => {
    const now = new Date().toISOString();
    dispatch({
      type: 'ADD_RARITY',
      payload: {
        ...r,
        id: generateId(),
        name: `${r.name} (Cópia)`,
        createdAt: now,
        updatedAt: now,
      },
    });
  };

  const applyPreset = (preset: (typeof DEFAULT_RARITY_PRESETS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      name: preset.name,
      slug: preset.slug,
      color: preset.color,
      glowIntensity: preset.glowIntensity,
      particleIntensity: preset.particleIntensity,
      animationSpeed: preset.animationSpeed,
      particleSize: preset.particleSize,
      opacity: preset.opacity,
    }));
  };

  const updateDistribution = (index: number, field: keyof RarityDistribution, value: string | number) => {
    setFormData((prev) => {
      const dists = [...prev.distributions];
      dists[index] = { ...dists[index], [field]: value };
      return { ...prev, distributions: dists };
    });
  };

  const addDistribution = () => {
    setFormData((prev) => ({
      ...prev,
      distributions: [...prev.distributions, { rewardType: 'versiculo' as RewardType, percentage: 0 }],
    }));
  };

  const removeDistribution = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      distributions: prev.distributions.filter((_, i) => i !== index),
    }));
  };

  const distTotal = formData.distributions.reduce((sum, d) => sum + d.percentage, 0);

  const startEdit = (rarity: Rarity) => {
    setEditingId(rarity.id);
    setFormData(rarity);
    setShowForm(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Raridades</h2>
            <p className="text-sm text-muted-foreground">
              Configure as raridades e efeitos visuais dos envelopes
            </p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData(EMPTY_RARITY);
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Raridade
          </button>
        </div>

        {/* Presets */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Presets Rápidos</h3>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_RARITY_PRESETS.map((preset) => (
              <button
                key={preset.slug}
                onClick={() => applyPreset(preset)}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ background: preset.color }}
                />
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Rarities List */}
        {projectRarities.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">Nenhuma raridade configurada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projectRarities.map((rarity) => {
              const distTotal = rarity.distributions.reduce((s, d) => s + d.percentage, 0);
              return (
                <div
                  key={rarity.id}
                  className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: rarity.gradient
                            ? `${rarity.gradientStyle || 'linear'}-gradient(135deg, ${rarity.color}, ${rarity.secondaryColor || rarity.color})`
                            : rarity.color,
                        }}
                      >
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{rarity.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Glow: {rarity.glowIntensity}% • Partículas: {rarity.particleIntensity}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewRarity(rarity)}
                        className="rounded p-1.5 hover:bg-muted text-muted-foreground"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => startEdit(rarity)}
                        className="rounded p-1.5 hover:bg-muted text-muted-foreground"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(rarity)}
                        className="rounded p-1.5 hover:bg-muted text-muted-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rarity.id)}
                        className="rounded p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Distribution bar */}
                  <div className="mb-3">
                    <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                      {rarity.distributions.map((d, i) => (
                        <div
                          key={i}
                          className="h-full transition-all"
                          style={{
                            width: `${d.percentage}%`,
                            background: `hsl(${(i * 60) % 360}, 70%, 55%)`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {rarity.distributions.map((d, i) => (
                        <span key={i} className="text-[10px] text-muted-foreground">
                          {REWARD_TYPE_LABELS[d.rewardType]}: {d.percentage}%
                        </span>
                      ))}
                      <span
                        className={`text-[10px] font-medium ${
                          distTotal === 100 ? 'text-emerald-500' : 'text-destructive'
                        }`}
                      >
                        Total: {distTotal}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        rarity.active
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {rarity.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Preview Modal */}
        {previewRarity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">{previewRarity.name}</h3>
                <button onClick={() => setPreviewRarity(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex justify-center">
                <EnvelopePreview rarity={previewRarity} />
              </div>
            </div>
          </div>
        )}

        {/* Create/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">
                  {editingId ? 'Editar Raridade' : 'Nova Raridade'}
                </h3>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Form */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome *</label>
                    <input
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Cor Principal</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                          className="h-9 w-9 rounded border border-border cursor-pointer"
                        />
                        <input
                          value={formData.color}
                          onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                          className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Cor Secundária</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.secondaryColor || formData.color}
                          onChange={(e) => setFormData((p) => ({ ...p, secondaryColor: e.target.value }))}
                          className="h-9 w-9 rounded border border-border cursor-pointer"
                        />
                        <input
                          value={formData.secondaryColor || ''}
                          onChange={(e) => setFormData((p) => ({ ...p, secondaryColor: e.target.value }))}
                          placeholder="#hex"
                          className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.gradient}
                        onChange={(e) => setFormData((p) => ({ ...p, gradient: e.target.checked }))}
                        className="rounded"
                      />
                      Usar Gradiente
                    </label>
                    {formData.gradient && (
                      <select
                        value={formData.gradientStyle}
                        onChange={(e) => setFormData((p) => ({ ...p, gradientStyle: e.target.value as 'linear' | 'radial' }))}
                        className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="linear">Linear</option>
                        <option value="radial">Radial</option>
                      </select>
                    )}
                  </div>

                  {/* Sliders */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <label>Intensidade de Brilho</label>
                        <span className="text-muted-foreground">{formData.glowIntensity}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={formData.glowIntensity}
                        onChange={(e) => setFormData((p) => ({ ...p, glowIntensity: parseInt(e.target.value) }))}
                        className="mt-1 w-full accent-primary"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <label>Intensidade de Partículas</label>
                        <span className="text-muted-foreground">{formData.particleIntensity}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={formData.particleIntensity}
                        onChange={(e) => setFormData((p) => ({ ...p, particleIntensity: parseInt(e.target.value) }))}
                        className="mt-1 w-full accent-primary"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <label>Velocidade da Animação</label>
                        <span className="text-muted-foreground">{formData.animationSpeed}x</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={5}
                        step={0.5}
                        value={formData.animationSpeed}
                        onChange={(e) => setFormData((p) => ({ ...p, animationSpeed: parseFloat(e.target.value) }))}
                        className="mt-1 w-full accent-primary"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <label>Tamanho das Partículas</label>
                        <span className="text-muted-foreground">{formData.particleSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={formData.particleSize}
                        onChange={(e) => setFormData((p) => ({ ...p, particleSize: parseInt(e.target.value) }))}
                        className="mt-1 w-full accent-primary"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <label>Opacidade</label>
                        <span className="text-muted-foreground">{formData.opacity}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={formData.opacity}
                        onChange={(e) => setFormData((p) => ({ ...p, opacity: parseInt(e.target.value) }))}
                        className="mt-1 w-full accent-primary"
                      />
                    </div>
                  </div>

                  {/* Distributions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Distribuição de Recompensas</label>
                      <span
                        className={`text-xs font-medium ${
                          distTotal === 100 ? 'text-emerald-500' : 'text-destructive'
                        }`}
                      >
                        Total: {distTotal}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      {formData.distributions.map((dist, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <select
                            value={dist.rewardType}
                            onChange={(e) => updateDistribution(i, 'rewardType', e.target.value)}
                            className="flex-1 rounded-lg border border-border bg-muted/50 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {Object.entries(REWARD_TYPE_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={dist.percentage}
                            onChange={(e) => updateDistribution(i, 'percentage', parseInt(e.target.value) || 0)}
                            className="w-16 rounded-lg border border-border bg-muted/50 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                          <button
                            onClick={() => removeDistribution(i)}
                            className="rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addDistribution}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      + Adicionar tipo
                    </button>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => { setShowForm(false); setEditingId(null); }}
                      className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={editingId ? handleUpdate : handleCreate}
                      className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      {editingId ? 'Salvar' : 'Criar'}
                    </button>
                  </div>
                </div>

                {/* Right: Live Preview */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/30 p-6">
                  <p className="text-xs text-muted-foreground mb-4">Preview ao Vivo</p>
                  <EnvelopePreview rarity={formData} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Edit3(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
    </svg>
  );
}
