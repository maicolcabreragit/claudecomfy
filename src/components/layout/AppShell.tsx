"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell - Contenedor principal de la aplicación
 * 
 * Layout:
 * ┌─────────────────────────────────────────────────────────┐
 * │                     TopBar (48px)                       │
 * ├────────────┬────────────────────────────────────────────┤
 * │   Sidebar  │             Main Content                   │
 * │   (240px)  │                                            │
 * │            │                                            │
 * └────────────┴────────────────────────────────────────────┘
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar - Fixed width, collapsable */}
      <Sidebar />

      {/* Main area - Flexible */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar - Fixed 48px height */}
        <TopBar />

        {/* Content area - Scrollable, with consistent padding */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
