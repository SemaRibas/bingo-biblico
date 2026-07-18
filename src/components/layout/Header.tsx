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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-foreground">
          {state.currentProject?.name || 'Bingo Bíblico'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            className="h-9 w-64 rounded-lg border border-border bg-muted/50 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
        </div>

        {/* New Project */}
        <button
          onClick={handleCreateProject}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Novo Projeto</span>
        </button>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}
