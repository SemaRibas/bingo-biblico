'use client';

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import {
  HelpCircle,
  LayoutGrid,
  Mail,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  FolderOpen,
} from 'lucide-react';
import { REWARD_TYPE_LABELS } from '@/lib/utils';

export default function DashboardPage() {
  const { state, dispatch } = useApp();

  const stats = [
    {
      label: 'Perguntas Cadastradas',
      value: state.questions.length,
      icon: HelpCircle,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Cartelas Geradas',
      value: state.cards.length,
      icon: LayoutGrid,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Envelopes Cadastrados',
      value: state.envelopes.length,
      icon: Mail,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Raridades Ativas',
      value: state.rarities.filter((r) => r.active).length,
      icon: Sparkles,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
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
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Visão geral do seu projeto de Bingo Bíblico
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Alertas de Inconsistência</span>
            </div>
            <ul className="space-y-1">
              {alerts.map((alert, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  {alert}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent Projects */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Projetos Recentes
            </h3>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          {state.projects.length === 0 ? (
            <div className="py-8 text-center">
              <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhum projeto ainda. Crie seu primeiro projeto!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {state.projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() =>
                    dispatch({
                      type: 'SET_CURRENT_PROJECT',
                      payload: project,
                    })
                  }
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {project.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.description}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      project.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {project.status === 'active' ? 'Ativo' : 'Arquivado'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats by Category */}
        {state.questions.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Perguntas por Categoria
            </h3>
            <div className="space-y-2">
              {Object.entries(
                state.questions.reduce(
                  (acc, q) => {
                    acc[q.category] = (acc[q.category] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>
                )
              ).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">
                    {cat.replace(/_/g, ' ')}
                  </span>
                  <span className="font-medium text-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
