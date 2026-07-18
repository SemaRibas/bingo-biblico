'use client';

import React, { useState, useMemo, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { Printer, Download, Eye, Grid, Mail } from 'lucide-react';

export default function ExportacaoPage() {
  const { state } = useApp();
  const [exportType, setExportType] = useState<'cards' | 'envelopes'>('cards');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const projectId = state.currentProject?.id;

  const projectCards = useMemo(
    () => state.cards.filter((c) => c.projectId === projectId),
    [state.cards, projectId]
  );

  const projectEnvelopes = useMemo(
    () => state.envelopes.filter((e) => e.projectId === projectId),
    [state.envelopes, projectId]
  );

  const getQuestionText = (questionId?: string) => {
    if (!questionId) return '';
    const q = state.questions.find((q) => q.id === questionId);
    return q?.question || '';
  };

  const getRarityName = (rarityId: string) => {
    return state.rarities.find((r) => r.id === rarityId)?.name || '';
  };

  const getRarityColor = (rarityId: string) => {
    return state.rarities.find((r) => r.id === rarityId)?.color || '#9CA3AF';
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Bingo Bíblico - Impressão</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .card { page-break-inside: avoid; margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .card-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; }
            .grid { display: grid; gap: 4px; }
            .cell { border: 1px solid #ccc; padding: 6px; text-align: center; font-size: 10px; min-height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
            .cell.free { background: #f0f0f0; font-weight: bold; }
            .env { page-break-inside: avoid; margin-bottom: 20px; border: 1px solid #ddd; padding: 12px; border-radius: 8px; display: flex; align-items: center; gap: 12px; }
            .env-color { width: 40px; height: 50px; border-radius: 6px; }
            h1 { font-size: 18px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Bingo Bíblico - ${exportType === 'cards' ? 'Cartelas' : 'Envelopes'}</h1>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    // Use browser print as PDF
    handlePrint();
  };

  const toggleAll = () => {
    const items = exportType === 'cards' ? projectCards : projectEnvelopes;
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Exportação e Impressão</h2>
            <p className="text-sm text-muted-foreground">
              Exporte cartelas e envelopes para impressão
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Imprimir ({selectedIds.length})
            </button>
          </div>
        </div>

        {/* Type Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setExportType('cards'); setSelectedIds([]); }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              exportType === 'cards'
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'border border-border hover:bg-muted'
            }`}
          >
            <Grid className="h-4 w-4" />
            Cartelas ({projectCards.length})
          </button>
          <button
            onClick={() => { setExportType('envelopes'); setSelectedIds([]); }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              exportType === 'envelopes'
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'border border-border hover:bg-muted'
            }`}
          >
            <Mail className="h-4 w-4" />
            Envelopes ({projectEnvelopes.length})
          </button>
        </div>

        {/* Select All */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={
              selectedIds.length ===
              (exportType === 'cards' ? projectCards : projectEnvelopes).length &&
              selectedIds.length > 0
            }
            onChange={toggleAll}
            className="rounded"
          />
          <span className="text-sm text-muted-foreground">Selecionar todos</span>
        </div>

        {/* Items */}
        {exportType === 'cards' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projectCards.map((card) => (
              <div
                key={card.id}
                className={`rounded-xl border bg-card p-4 transition-colors cursor-pointer ${
                  selectedIds.includes(card.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
                onClick={() =>
                  setSelectedIds((prev) =>
                    prev.includes(card.id)
                      ? prev.filter((id) => id !== card.id)
                      : [...prev, card.id]
                  )
                }
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">{card.name}</h4>
                  <span className="text-xs text-muted-foreground">
                    {card.size}x{card.size}
                  </span>
                </div>
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${card.size}, 1fr)` }}
                >
                  {card.cells.map((cell) => (
                    <div
                      key={cell.id}
                      className={`rounded border p-1 text-center text-[8px] min-h-[28px] flex items-center justify-center ${
                        cell.isFree
                          ? 'border-primary bg-primary/10 font-bold'
                          : 'border-border'
                      }`}
                    >
                      {cell.isFree ? '★' : getQuestionText(cell.questionId) || '—'}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projectEnvelopes.map((env) => (
              <div
                key={env.id}
                className={`rounded-xl border bg-card p-4 transition-colors cursor-pointer ${
                  selectedIds.includes(env.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
                onClick={() =>
                  setSelectedIds((prev) =>
                    prev.includes(env.id)
                      ? prev.filter((id) => id !== env.id)
                      : [...prev, env.id]
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-8 rounded-lg"
                    style={{ background: getRarityColor(env.rarityId) }}
                  />
                  <div>
                    <h4 className="text-sm font-medium">{env.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono">{env.code}</p>
                    <p className="text-xs" style={{ color: getRarityColor(env.rarityId) }}>
                      {getRarityName(env.rarityId)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hidden print area */}
        <div ref={printRef} className="hidden">
          {exportType === 'cards' &&
            projectCards
              .filter((c) => selectedIds.includes(c.id))
              .map((card) => (
                <div key={card.id} className="card">
                  <div className="card-title">{card.name} ({card.size}x{card.size})</div>
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: `repeat(${card.size}, 1fr)` }}
                  >
                    {card.cells.map((cell) => (
                      <div key={cell.id} className={`cell ${cell.isFree ? 'free' : ''}`}>
                        {cell.isFree ? '★ Livre' : getQuestionText(cell.questionId) || '—'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          {exportType === 'envelopes' &&
            projectEnvelopes
              .filter((e) => selectedIds.includes(e.id))
              .map((env) => (
                <div key={env.id} className="env">
                  <div className="env-color" style={{ background: getRarityColor(env.rarityId) }} />
                  <div>
                    <strong>{env.name}</strong> ({env.code})<br />
                    Raridade: {getRarityName(env.rarityId)}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </AppLayout>
  );
}
