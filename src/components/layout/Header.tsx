'use client';

import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Search, Bell, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
  const { state, dispatch } = useApp();
  const router = useRouter();

  const handleCreateProject = () => {
    const newProject = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 15),
      name: 'Novo Projeto',
      description: 'Descrição do projeto',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active' as const,
    };
    dispatch({ type: 'ADD_PROJECT', payload: newProject });
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: newProject });
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 border-b"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'var(--glass-border)',
      }}
    >
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-[15px] font-bold" style={{ color: 'var(--foreground)' }}>
            {state.currentProject?.name || 'Bingo Bíblico'}
          </h1>
          {state.currentProject?.description && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {state.currentProject.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--muted-foreground)' }}
          />
          <input
            type="text"
            placeholder="Buscar..."
            className="h-9 w-56 rounded-xl border pl-9 pr-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20 focus:w-72"
            style={{
              background: 'var(--muted)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>

        {/* New Project */}
        <button
          onClick={handleCreateProject}
          className="btn-glow flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Novo Projeto</span>
        </button>

        {/* Notifications */}
        <button
          className="relative rounded-xl p-2.5 transition-all duration-200 hover:scale-105"
          style={{
            color: 'var(--muted-foreground)',
            background: 'var(--muted)',
          }}
        >
          <Bell className="h-4 w-4" />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
            style={{ background: 'var(--accent-gradient)' }}
          />
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}
