'use client';

import React, { useState, useMemo } from 'react';

import { useApp } from '@/contexts/AppContext';
import { CheckCircle, ArrowRightCircle, AlertTriangle, List, Table as TableIcon, Layers } from 'lucide-react';

const VIEW_OPTIONS = [
  { id: 'grid' as const, label: 'Grade', icon: Layers },
  { id: 'list' as const, label: 'Lista', icon: List },
  { id: 'table' as const, label: 'Tabela', icon: TableIcon },
];

export default function MapeamentoPage() {
  const { state } = useApp();
  const [view, setView] = useState<'grid' | 'list' | 'table'>('grid');
  const [filterRarity, setFilterRarity] = useState<string>('all');

  const projectRarities = useMemo(() => state.rarities.filter((r) => r.projectId === state.currentProject?.id), [state.rarities, state.currentProject]);
  const projectEnvelopes = useMemo(() => state.envelopes.filter((e) => e.projectId === state.currentProject?.id), [state.envelopes, state.currentProject]);

  const envelopeByRarity = useMemo(() => {
    const result: Record<string, { name: string; count: number; color: string; envelopes: typeof projectEnvelopes }> = {};
    projectRarities.forEach((r) => {
      result[r.id] = { name: r.name, count: 0, color: r.color, envelopes: [] };
    });
    projectEnvelopes.forEach((e) => {
      if (result[e.rarityId]) {
        result[e.rarityId].count++;
        result[e.rarityId].envelopes.push(e);
      }
    });
    return result;
  }, [projectRarities, projectEnvelopes]);

  const filteredRarities = useMemo(() => {
    if (filterRarity === 'all') return Object.values(envelopeByRarity);
    return Object.values(envelopeByRarity).filter((r) => {
      const rarity = projectRarities.find((rp) => rp.name === r.name);
      return rarity?.id === filterRarity;
    });
  }, [envelopeByRarity, filterRarity, projectRarities]);

  const totalEnvelopes = projectEnvelopes.length;
  const mappedEnvelopes = projectEnvelopes.filter((e) => e.rarityId).length;
  const coverage = totalEnvelopes > 0 ? Math.round((mappedEnvelopes / totalEnvelopes) * 100) : 0;

  const inputStyle = { background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Mapeamento de Raridades</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Visualize como as raridades estão distribuídas nos envelopes</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '40ms', animationFillMode: 'both' }}>
          <div className="card-base rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-primary" /></div>
              <div><p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Cobertura</p><p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{coverage}%</p></div>
            </div>
          </div>
          <div className="card-base rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><ArrowRightCircle className="h-5 w-5 text-emerald-500" /></div>
              <div><p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Mapeados</p><p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{mappedEnvelopes}/{totalEnvelopes}</p></div>
            </div>
          </div>
          <div className="card-base rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-amber-500" /></div>
              <div><p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Sem Raridade</p><p className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{totalEnvelopes - mappedEnvelopes}</p></div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 animate-fade-in" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {VIEW_OPTIONS.map((v) => (
              <button key={v.id} onClick={() => setView(v.id)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all" style={view === v.id ? { background: 'var(--primary)', color: 'var(--primary-foreground)' } : { background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                <v.icon className="h-3.5 w-3.5" /> {v.label}
              </button>
            ))}
          </div>
          <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)} className="rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle}>
            <option value="all">Todas as Raridades</option>
            {projectRarities.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
          </select>
        </div>

        {filteredRarities.length === 0 ? (
          <div className="card-base rounded-xl py-16 text-center animate-fade-in">
            <Layers className="mx-auto h-12 w-12 opacity-20" style={{ color: 'var(--muted-foreground)' }} />
            <p className="mt-3 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Nenhum mapeamento encontrado</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRarities.map((r, i) => (
              <div key={r.name} className="card-base rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: r.color }}><span className="text-white font-bold text-sm">{r.count}</span></div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{r.name}</h4>
                    <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{r.count} envelopes</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'var(--muted)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: totalEnvelopes > 0 ? `${(r.count / totalEnvelopes) * 100}%` : '0%', background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        ) : view === 'table' ? (
          <div className="card-base rounded-xl overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--foreground)' }}>Raridade</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--foreground)' }}>Envelopes</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--foreground)' }}>%</th>
                </tr></thead>
                <tbody>
                  {filteredRarities.map((r) => (
                    <tr key={r.name} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}><div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full" style={{ background: r.color }} />{r.name}</div></td>
                      <td className="px-4 py-3 text-center" style={{ color: 'var(--muted-foreground)' }}>{r.count}</td>
                      <td className="px-4 py-3 text-center" style={{ color: 'var(--muted-foreground)' }}>{totalEnvelopes > 0 ? Math.round((r.count / totalEnvelopes) * 100) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRarities.map((r, i) => (
              <div key={r.name} className="card-base rounded-xl p-4 animate-fade-in flex items-center gap-4" style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: r.color }}><span className="text-white font-bold text-xs">{r.count}</span></div>
                <h4 className="text-sm font-bold min-w-[120px]" style={{ color: 'var(--foreground)' }}>{r.name}</h4>
                <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--muted)' }}><div className="h-full rounded-full" style={{ width: totalEnvelopes > 0 ? `${(r.count / totalEnvelopes) * 100}%` : '0%', background: r.color }} /></div>
                <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{r.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    
  );
}
