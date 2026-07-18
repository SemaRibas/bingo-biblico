'use client';

import React, { useState, useMemo, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { Sparkles } from 'lucide-react';
import type { RewardType } from '@/types';

const REWARD_TYPE_LABELS: Record<string, string> = { versiculo: 'Versículo', doce: 'Doce', bonus: 'Bônus', premio: 'Prêmio', nova_tentativa: 'Nova Tentativa', vazio: 'Vazio', desafio_extra: 'Desafio Extra' };

export default function SimuladorPage() {
  const { state } = useApp();
  const [numSimulations, setNumSimulations] = useState(20);
  const [results, setResults] = useState<Array<{ index: number; rarity: string; rewardType: string; color: string }>>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const projectRarities = useMemo(() => state.rarities.filter((r) => r.projectId === state.currentProject?.id && r.active), [state.rarities, state.currentProject]);
  const projectEnvelopes = useMemo(() => state.envelopes.filter((e) => e.projectId === state.currentProject?.id), [state.envelopes, state.currentProject]);

  const simulate = useCallback(() => {
    setIsSimulating(true);
    setResults([]);

    setTimeout(() => {
      const newResults: Array<{ index: number; rarity: string; rewardType: string; color: string }> = [];

      for (let i = 0; i < numSimulations; i++) {
        let rarityIdx = 0;
        if (projectRarities.length > 1) {
          rarityIdx = Math.floor(Math.random() * projectRarities.length);
        }
        const rarity = projectRarities[rarityIdx];
        if (!rarity) continue;

        const dist = rarity.distributions;
        const totalPct = dist.reduce((s, d) => s + d.percentage, 0);
        let roll = Math.random() * totalPct;
        let selectedType: RewardType = dist[0]?.rewardType || 'versiculo';
        for (const d of dist) {
          roll -= d.percentage;
          if (roll <= 0) { selectedType = d.rewardType; break; }
        }

        newResults.push({ index: i + 1, rarity: rarity.name, rewardType: selectedType, color: rarity.color });
      }

      setResults(newResults);
      setIsSimulating(false);
    }, 800);
  }, [numSimulations, projectRarities]);

  const stats = useMemo(() => {
    if (results.length === 0) return null;
    const byRarity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    results.forEach((r) => { byRarity[r.rarity] = (byRarity[r.rarity] || 0) + 1; byType[r.rewardType] = (byType[r.rewardType] || 0) + 1; });
    return { byRarity, byType };
  }, [results]);

  const inputStyle = { background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Simulador</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Teste a distribuição simulando aberturas de envelopes</p>
        </div>

        <div className="card-base rounded-xl p-5 animate-fade-in" style={{ animationDelay: '40ms', animationFillMode: 'both' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Simulações</label>
              <input type="number" min={1} max={200} value={numSimulations} onChange={(e) => setNumSimulations(parseInt(e.target.value) || 1)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle} />
            </div>
            <div>
              <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Envelopes disponíveis</label>
              <p className="mt-1.5 text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{projectEnvelopes.length}</p>
            </div>
            <div className="flex items-end">
              <button onClick={simulate} disabled={isSimulating || projectRarities.length === 0} className="btn-glow w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50" style={{ background: 'var(--accent-gradient)' }}>
                {isSimulating ? 'Simulando...' : 'Simular Aberturas'}
              </button>
            </div>
          </div>
        </div>

        {isSimulating && (
          <div className="flex justify-center py-12 animate-fade-in">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl skeleton" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {results.length > 0 && !isSimulating && (
          <div className="space-y-6 animate-fade-in">
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card-base rounded-xl p-4">
                  <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--foreground)' }}>Por Raridade</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.byRarity).sort((a, b) => b[1] - a[1]).map(([name, count]) => {
                      const rarity = projectRarities.find((r) => r.name === name);
                      return (
                        <div key={name}>
                          <div className="flex justify-between text-xs mb-1"><span style={{ color: 'var(--foreground)' }}>{name}</span><span style={{ color: 'var(--muted-foreground)' }}>{count} ({Math.round((count / results.length) * 100)}%)</span></div>
                          <div className="h-1.5 rounded-full" style={{ background: 'var(--muted)' }}><div className="h-full rounded-full" style={{ width: `${(count / results.length) * 100}%`, background: rarity?.color || '#818cf8' }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="card-base rounded-xl p-4">
                  <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--foreground)' }}>Por Tipo de Recompensa</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                      <div key={type}>
                        <div className="flex justify-between text-xs mb-1"><span style={{ color: 'var(--foreground)' }}>{REWARD_TYPE_LABELS[type] || type}</span><span style={{ color: 'var(--muted-foreground)' }}>{count} ({Math.round((count / results.length) * 100)}%)</span></div>
                        <div className="h-1.5 rounded-full" style={{ background: 'var(--muted)' }}><div className="h-full rounded-full bg-primary" style={{ width: `${(count / results.length) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="card-base rounded-xl p-4">
              <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--foreground)' }}>Resultados Individuais</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl border p-2.5" style={{ borderColor: 'var(--border)' }}>
                    <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: r.color }}><Sparkles className="h-3 w-3 text-white" /></div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold" style={{ color: 'var(--foreground)' }}>#{r.index}</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--muted-foreground)' }}>{REWARD_TYPE_LABELS[r.rewardType] || r.rewardType}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {results.length === 0 && !isSimulating && (
          <div className="card-base rounded-xl py-16 text-center animate-fade-in">
            <Sparkles className="mx-auto h-12 w-12 opacity-20" style={{ color: 'var(--muted-foreground)' }} />
            <p className="mt-3 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>{projectRarities.length === 0 ? 'Crie raridades primeiro' : 'Clique em Simular para testar'}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
