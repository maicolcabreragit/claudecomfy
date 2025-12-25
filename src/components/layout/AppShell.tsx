"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell - Contenedor principal de la aplicación
 * 
 * Layout: TopBar + Sidebar + Main Content
 * El sidebar es colapsable y el contenido ocupa el resto.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar */}
        <TopBar />

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
