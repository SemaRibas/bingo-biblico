'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebar } from '@/components/layout/SidebarContext';
import { AppProvider } from '@/contexts/AppContext';
import { SidebarProvider } from '@/components/layout/SidebarContext';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AppProvider>
    </SidebarProvider>
  );
}

function AdminLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Sidebar />
      <div
        className="transition-all duration-300 ease-in-out"
        style={{ paddingLeft: collapsed ? 72 : 260 }}
      >
        <Header />
        <main className="p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}