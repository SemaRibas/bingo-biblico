'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/layout/SidebarContext';
import {
  LayoutDashboard,
  HelpCircle,
  LayoutGrid,
  ArrowLeftRight,
  Mail,
  Sparkles,
  Play,
  Settings,
  Printer,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Star,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, accent: 'from-violet-500 to-purple-600' },
  { name: 'Banco de Perguntas', href: '/perguntas', icon: HelpCircle, accent: 'from-blue-500 to-cyan-500' },
  { name: 'Cartelas de Bingo', href: '/cartelas', icon: LayoutGrid, accent: 'from-emerald-500 to-teal-500' },
  { name: 'Mapeamento', href: '/mapeamento', icon: ArrowLeftRight, accent: 'from-orange-500 to-amber-500' },
  { name: 'Envelopes Surpresa', href: '/envelopes', icon: Mail, accent: 'from-pink-500 to-rose-500' },
  { name: 'Raridades', href: '/raridades', icon: Sparkles, accent: 'from-yellow-400 to-amber-500' },
  { name: 'Simulador', href: '/simulador', icon: Play, accent: 'from-indigo-500 to-violet-500' },
  { name: 'Exportação', href: '/exportacao', icon: Printer, accent: 'from-slate-500 to-zinc-500' },
  { name: 'Configurações', href: '/configuracoes', icon: Settings, accent: 'from-gray-500 to-slate-500' },
];

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      <div
        className="h-full flex flex-col rounded-r-2xl overflow-hidden"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--glass-border)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-16 shrink-0 border-b',
          collapsed ? 'justify-center px-2' : 'gap-3 px-5'
        )} style={{ borderColor: 'var(--border)' }}>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <Trophy className="h-4.5 w-4.5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                Bingo Bíblico
              </span>
              <span className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Painel Admin
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                      isActive
                        ? 'sidebar-active text-white shadow-md'
                        : 'hover:bg-[var(--accent)]'
                    )}
                    style={isActive ? {
                      background: 'var(--accent-gradient)',
                      color: 'var(--primary-foreground)',
                    } : {
                      color: 'var(--muted-foreground)',
                    }}
                    title={collapsed ? item.name : undefined}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = 'var(--foreground)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = 'var(--muted-foreground)';
                    }}
                  >
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                    {isActive && !collapsed && (
                      <Star className="h-3 w-3 ml-auto fill-white/40 text-white/40" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse button */}
        <div className="shrink-0 p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex w-full items-center justify-center rounded-xl py-2.5 transition-all duration-200',
              'hover:bg-[var(--accent)]'
            )}
            style={{ color: 'var(--muted-foreground)' }}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <ChevronLeft className="h-4 w-4" />
                <span>Recolher</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
