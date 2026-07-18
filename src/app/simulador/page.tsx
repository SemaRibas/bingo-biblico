'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import type { SimulationResult, RewardType } from '@/types';
import { generateId, REWARD_TYPE_LABELS } from '@/lib/utils';
import { Play, BarChart3, AlertTriangle, RotateCcw } from 'lucide-react';

export default function SimuladorPage() {
  const { state, dispatch, projectId } = useApp();
  const [simCount, setSimCount] = useState(10);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const projectRarities = useMemo(
    () => state.rarities.filter((r) => r.projectId === projectId && r.active),
    [state.rarities, projectId]
  );

  const projectEnvelopes = useMemo(
    () => state.envelopes.filter((e) => e.projectId === projectId && e.status === 'active'),
    [state.envelopes, projectId]
  );

  const runSimulation = () => {
    setIsRunning(true);

    setTimeout(() => {
      const rarityBreakdown: Record<string, number> = {};
      const rewardBreakdown: Record<string, number> = {};

      const rewardTypes = ['premio', 'versiculo', 'doce', 'bonus', 'nova_tentativa', 'vazio', 'desafio_extra'] as const;
      rewardTypes.forEach((type) => {
        rewardBreakdown[type] = 0;
      });

      // Build weighted pool based on rarity distributions
      const pool: { rarityId: string; rarityName: string; rewardType: RewardType }[] = [];

      projectRarities.forEach((rarity) => {
        rarity.distributions.forEach((dist) => {
          const count = Math.round((dist.percentage / 100) * simCount * (1 / projectRarities.length));
          for (let i = 0; i < count; i++) {
            pool.push({
              rarityId: rarity.id,
              rarityName: rarity.name,
              rewardType: dist.rewardType,
            });
          }
        });
      });

      // If pool is smaller than simCount, fill with random
      while (pool.length < simCount) {
        const randomRarity = projectRarities[Math.floor(Math.random() * projectRarities.length)];
        if (randomRarity) {
          const randomDist = randomRarity.distributions[Math.floor(Math.random() * randomRarity.distributions.length)];
          if (randomDist) {
            pool.push({
              rarityId: randomRarity.id,
              rarityName: randomRarity.name,
              rewardType: randomDist.rewardType,
            });
          }
        }
      }

      // Draw from pool
      for (let i = 0; i < simCount; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        const item = pool[idx] || pool[0];
        if (item) {
          rarityBreakdown[item.rarityName] = (rarityBreakdown[item.rarityName] || 0) + 1;
          rewardBreakdown[item.rewardType] = (rewardBreakdown[item.rewardType] || 0) + 1;
        }
      }

      const result: SimulationResult = {
        id: generateId(),
        projectId: projectId || '',
        totalOpened: simCount,
        rarityBreakdown,
        rewardBreakdown: rewardBreakdown as Record<RewardType, number>,
        createdAt: new Date().toISOString(),
      };

      setResults(result);
      dispatch({ type: 'ADD_SIMULATION', payload: result });
      setIsRunning(false);
    }, 500);
  };

  const alerts: string[] = [];
  if (results) {
    Object.entries(results.rarityBreakdown).forEach(([name, count]) => {
      const pct = (count / results.totalOpened) * 100;
      const rarity = projectRarities.find((r) => r.name === name);
      if (rarity) {
        const expectedPct = 100 / projectRarities.length;
        if (Math.abs(pct - expectedPct) > 20) {
          alerts.push(`Raridade "${name}" teve ${pct.toFixed(1)}% (esperado ~${expectedPct.toFixed(1)}%)`);
        }
      }
    });
  }

  const maxReward = results
    ? Math.max(...Object.values(results.rewardBreakdown))
    : 1;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Simulador</h2>
          <p className="text-sm text-muted-foreground">
            Teste a distribuição de raridades e recompensas
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-sm font-medium">Quantidade de Simulações</label>
              <div className="flex items-center gap-2 mt-1">
                {[10, 50, 100, 1000].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSimCount(n)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      simCount === n
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={runSimulation}
              disabled={isRunning || projectRarities.length === 0}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isRunning ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning ? 'Executando...' : 'Executar Simulação'}
            </button>
          </div>
          {projectRarities.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Configure raridades antes de simular
            </p>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 text-amber-500 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Alertas de Desequilíbrio</span>
                </div>
                <ul className="space-y-1">
                  {alerts.map((alert, i) => (
                    <li key={i} className="text-sm text-muted-foreground">{alert}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rarity Breakdown */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Distribuição por Raridade</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(results.rarityBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => {
                      const pct = (count / results.totalOpened) * 100;
                      const rarity = projectRarities.find((r) => r.name === name);
                      return (
                        <div key={name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ background: rarity?.color || '#9CA3AF' }}
                              />
                              {name}
                            </span>
                            <span className="text-muted-foreground">
                              {count} ({pct.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                background: rarity?.color || '#9CA3AF',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Reward Breakdown */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Distribuição por Tipo</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(results.rewardBreakdown)
                    .filter(([, count]) => count > 0)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const pct = (count / results.totalOpened) * 100;
                      return (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{REWARD_TYPE_LABELS[type] || type}</span>
                            <span className="text-muted-foreground">
                              {count} ({pct.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-3">Resumo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">{results.totalOpened}</p>
                  <p className="text-xs text-muted-foreground">Total Abertos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{Object.keys(results.rarityBreakdown).length}</p>
                  <p className="text-xs text-muted-foreground">Raridades Sorteadas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{Object.keys(results.rewardBreakdown).filter((k) => results.rewardBreakdown[k as RewardType] > 0).length}</p>
                  <p className="text-xs text-muted-foreground">Tipos de Recompensa</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${alerts.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {alerts.length > 0 ? alerts.length : '✓'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alerts.length > 0 ? 'Alertas' : 'Balanceado'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Previous Simulations */}
        {state.simulations.filter((s) => s.projectId === projectId).length > 1 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">Simulações Anteriores</h3>
            <div className="space-y-2">
              {state.simulations
                .filter((s) => s.projectId === projectId)
                .slice(-5)
                .reverse()
                .map((sim) => (
                  <div key={sim.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <div>
                      <span className="font-medium">{sim.totalOpened} aberturas</span>
                      <span className="text-muted-foreground ml-2">
                        {new Date(sim.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {Object.entries(sim.rarityBreakdown).map(([name, count]) => (
                        <span key={name} className="text-xs text-muted-foreground">
                          {name}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
