'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/contexts/AppContext';
import { Download, FileText, Printer, Loader2 } from 'lucide-react';

export default function ExportacaoPage() {
  const { state } = useApp();
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png'>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const projectEnvelopes = useMemo(() => state.envelopes.filter((e) => e.projectId === state.currentProject?.id), [state.envelopes, state.currentProject]);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => { setIsExporting(false); alert('Exportação simulada concluída!'); }, 2000);
  };

  const inputStyle = { background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Exportação</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Exporte envelopes e relatórios</p>
        </div>

        <div className="card-base rounded-xl p-5 animate-fade-in" style={{ animationDelay: '40ms', animationFillMode: 'both' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Envelope</label>
              <select value={selectedEnvelopeId} onChange={(e) => setSelectedEnvelopeId(e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle}>
                <option value="">Todos os envelopes</option>
                {projectEnvelopes.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Formato</label>
              <div className="mt-1.5 flex rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => setExportFormat('pdf')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all" style={exportFormat === 'pdf' ? { background: 'var(--primary)', color: 'var(--primary-foreground)' } : { background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                  <FileText className="h-4 w-4" /> PDF
                </button>
                <button onClick={() => setExportFormat('png')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-all" style={exportFormat === 'png' ? { background: 'var(--primary)', color: 'var(--primary-foreground)' } : { background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                  <Printer className="h-4 w-4" /> PNG
                </button>
              </div>
            </div>
            <div className="flex items-end">
              <button onClick={handleExport} disabled={isExporting} className="btn-glow w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: 'var(--accent-gradient)' }}>
                {isExporting ? <><Loader2 className="h-4 w-4 animate-spin" /> Exportando...</> : <><Download className="h-4 w-4" /> Exportar</>}
              </button>
            </div>
          </div>
        </div>

        <div className="card-base rounded-xl py-16 text-center animate-fade-in" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <Download className="mx-auto h-12 w-12 opacity-20" style={{ color: 'var(--muted-foreground)' }} />
          <p className="mt-3 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Selecione um envelope para exportar</p>
        </div>
      </div>
    </AppLayout>
  );
}
