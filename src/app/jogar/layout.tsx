'use client';

import React from 'react';

export default function PlayerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="animate-fade-in">{children}</main>
    </div>
  );
}