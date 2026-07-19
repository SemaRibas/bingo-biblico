'use client';

import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { Project } from '@/types';
import {
  HelpCircle,
  LayoutGrid,
  Mail,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  FolderOpen,
  Edit3,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { REWARD_TYPE_LABELS } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { state, dispatch } = useApp();
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const stats = [
    {
      label: 'Perguntas Cadastradas',
      value: state.questions.length,
      icon: HelpCircle,
      className: 'stat-card-blue',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Cartelas Geradas',
      value: state.cards.length,
      icon: LayoutGrid,
      className: 'stat-card-emerald',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Envelopes Cadastrados',
      value: state.envelopes.length,
      icon: Mail,
      className: 'stat-card-purple',
      iconColor: 'text-purple-500',
    },
    {
      label: 'Raridades Ativas',
      value: state.rarities.filter((r) => r.active).length,
      icon: Sparkles,
      className: 'stat-card-amber',
      iconColor: 'text-amber-500',
    },
  ];

  const alerts: string[] = [];

  const questionsWithoutLink = state.questions.filter(
    (q) => q.linkedCells.length === 0 && q.status === 'active'
  );
  if (questionsWithoutLink.length > 0) {
    alerts.push(
      `${questionsWithoutLink.length} pergunta(s) sem vínculo a cartelas`
    );
  }

  const envelopesWithoutRarity = state.envelopes.filter(
    (e) => !state.rarities.find((r) => r.id === e.rarityId)
  );
  if (envelopesWithoutRarity.length > 0) {
    alerts.push(
      `${envelopesWithoutRarity.length} envelope(s) sem raridade válida`
    );
  }

  const raritiesWithBadPercent = state.rarities.filter((r) => {
    const total = r.distributions.reduce((sum, d) => sum + d.percentage, 0);
    return total !== 100 && r.distributions.length > 0;
  });
  if (raritiesWithBadPercent.length > 0) {
    alerts.push(
      `${raritiesWithBadPercent.length} raridade(s) com porcentagens inválidas`
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
          Dashboard
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Visão geral do seu projeto de Bingo Bíblico
        </p>
      </div>

      {/* Stats Grid */}
      {state.loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card-base rounded-xl p-5 animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-3 w-24 rounded skeleton" />
                  <div className="h-8 w-16 rounded skeleton mt-3" />
                </div>
                <div className="h-11 w-11 rounded-xl skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`card-base rounded-xl p-5 ${stat.className} animate-fade-in`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-xl p-3 ${stat.iconColor}`} style={{ background: 'var(--muted)' }}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div
          className="rounded-xl border p-4 animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06), rgba(245, 158, 11, 0.02))',
            borderColor: 'rgba(245, 158, 11, 0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-amber-500/10 p-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              Alertas de Inconsistência
            </span>
          </div>
          <ul className="space-y-1 ml-9">
            {alerts.map((alert, i) => (
              <li key={i} className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Projects + Categories */}
      {state.loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card-base rounded-xl p-5 lg:col-span-2">
            <div className="h-4 w-32 rounded skeleton mb-4" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl mb-2">
                <div className="h-8 w-8 rounded-lg skeleton" />
                <div className="flex-1"><div className="h-3 w-32 rounded skeleton mb-1.5" /><div className="h-2.5 w-48 rounded skeleton" /></div>
              </div>
            ))}
          </div>
          <div className="card-base rounded-xl p-5">
            <div className="h-4 w-40 rounded skeleton mb-4" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between mb-1"><div className="h-2.5 w-24 rounded skeleton" /><div className="h-2.5 w-6 rounded skeleton" /></div>
                <div className="h-1.5 rounded-full skeleton" />
              </div>
            ))}
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Projects */}
        <div className="card-base rounded-xl p-5 lg:col-span-2 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              Projetos Recentes
            </h3>
            <FolderOpen className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          {state.projects.length === 0 ? (
            <div className="py-8 text-center">
              <TrendingUp className="mx-auto h-8 w-8 opacity-30" style={{ color: 'var(--muted-foreground)' }} />
              <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Nenhum projeto ainda. Crie seu primeiro projeto!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {state.projects.slice(0, 5).map((project) => {
                const isEditing = editingProjectId === project.id;
                return (
                  <div
                    key={project.id}
                    className="group flex items-center justify-between rounded-xl p-3 transition-all duration-200 hover:shadow-sm"
                    style={{ background: 'var(--muted)' }}
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: 'var(--accent-gradient)' }}
                        >
                          {editForm.name.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            value={editForm.name}
                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                            className="w-full rounded-lg border px-2.5 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                            autoFocus
                          />
                          <input
                            value={editForm.description}
                            onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                            className="w-full rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20"
                            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                            placeholder="Descrição"
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              if (editForm.name.trim()) {
                                dispatch({ type: 'UPDATE_PROJECT', payload: { ...project, name: editForm.name.trim(), description: editForm.description.trim(), updatedAt: new Date().toISOString() } });
                              }
                              setEditingProjectId(null);
                            }}
                            className="rounded-lg p-1.5 hover:bg-emerald-500/10 text-emerald-500 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingProjectId(null)}
                            className="rounded-lg p-1.5 hover:bg-[var(--card)] transition-colors"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => dispatch({ type: 'SET_CURRENT_PROJECT', payload: project })}
                        >
                          <div
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: 'var(--accent-gradient)' }}
                          >
                            {project.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                              {project.name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              {project.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              project.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'text-gray-500'
                            }`}
                            style={project.status !== 'active' ? { background: 'var(--muted)' } : undefined}
                          >
                            {project.status === 'active' ? 'Ativo' : 'Arquivado'}
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProjectId(project.id);
                                setEditForm({ name: project.name, description: project.description });
                              }}
                              className="rounded-lg p-1.5 hover:bg-[var(--card)] transition-colors"
                              style={{ color: 'var(--muted-foreground)' }}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Excluir permanentemente o projeto "${project.name}"? Esta ação não pode ser desfeita.`)) {
                                  dispatch({ type: 'DELETE_PROJECT', payload: project.id });
                                }
                              }}
                              className="rounded-lg p-1.5 hover:bg-destructive/10 transition-colors"
                              style={{ color: 'var(--muted-foreground)' }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Questions by Category */}
        <div className="card-base rounded-xl p-5 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            Perguntas por Categoria
          </h3>
          {state.questions.length > 0 ? (
            <div className="space-y-3">
              {Object.entries(
                state.questions.reduce(
                  (acc, q) => {
                    acc[q.category] = (acc[q.category] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>
                )
              )
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => {
                  const total = state.questions.length;
                  const pct = (count / total) * 100;
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="capitalize font-medium" style={{ color: 'var(--foreground)' }}>
                          {cat.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: 'var(--accent-gradient)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: 'var(--muted-foreground)' }}>
              Nenhuma pergunta cadastrada
            </p>
          )}
        </div>
      </div>
      )}
    </div>
  );
}