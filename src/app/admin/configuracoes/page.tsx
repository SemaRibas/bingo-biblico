'use client';

import React, { useState } from 'react';

import { useApp } from '@/contexts/AppContext';
import { useTheme } from 'next-themes';
import { Settings, Palette, Bell, Shield, Database, Save } from 'lucide-react';

export default function ConfiguracoesPage() {
  const { state, dispatch } = useApp();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [projectName, setProjectName] = useState(state.currentProject?.name || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (state.currentProject) {
      dispatch({ type: 'UPDATE_PROJECT', payload: { ...state.currentProject, name: projectName, updatedAt: new Date().toISOString() } });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'data', label: 'Dados', icon: Database },
  ];

  const inputStyle = { background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Configurações</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Gerencie as configurações do projeto</p>
        </div>

        <div className="flex gap-6 animate-fade-in" style={{ animationDelay: '40ms', animationFillMode: 'both' }}>
          <nav className="w-48 shrink-0">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all" style={activeTab === tab.id ? { background: 'var(--primary)', color: 'var(--primary-foreground)' } : { color: 'var(--muted-foreground)' }}>
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              ))}
            </div>
          </nav>

          <div className="flex-1 card-base rounded-xl p-6">
            {activeTab === 'general' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Geral</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Configurações básicas do projeto</p>
                </div>
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Nome do Projeto</label>
                  <input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20" style={inputStyle} />
                </div>
                <button onClick={handleSave} className="btn-glow flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/20" style={{ background: 'var(--accent-gradient)' }}>
                  <Save className="h-4 w-4" /> {saved ? 'Salvo!' : 'Salvar'}
                </button>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Aparência</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Personalize a aparência do aplicativo</p>
                </div>
                <div>
                  <label className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Tema</label>
                  <div className="mt-2 flex gap-3">
                    {[{ id: 'light', label: 'Claro' }, { id: 'dark', label: 'Escuro' }, { id: 'system', label: 'Sistema' }].map((t) => (
                      <button key={t.id} onClick={() => setTheme(t.id)} className="flex-1 rounded-xl border p-4 text-center text-sm font-medium transition-all" style={theme === t.id ? { borderColor: 'var(--primary)', background: 'var(--primary)' + '10', color: 'var(--primary)' } : { borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Notificações</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Configure as notificações</p>
                </div>
                {['Novas recompensas adicionadas', 'Jogos criados', 'Relatórios gerados'].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>{item}</span>
                    <div className="h-5 w-9 rounded-full bg-primary cursor-pointer relative"><div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-all" /></div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Segurança</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Configurações de segurança</p>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>Exportação de dados protegida por autenticação.</p>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Dados</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Gerencie os dados do projeto</p>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm mb-2" style={{ color: 'var(--foreground)' }}>Projeto: {state.currentProject?.name || 'N/A'}</p>
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>Raridades: {state.rarities.length}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    
  );
}
