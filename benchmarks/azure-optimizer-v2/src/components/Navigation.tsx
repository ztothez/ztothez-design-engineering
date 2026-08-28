"use client";

import { Activity, Download, History, LayoutDashboard } from "lucide-react";

export type WorkspaceView = "overview" | "analysis" | "history" | "export";

const items = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "analysis" as const, label: "Analyze", icon: Activity },
  { id: "history" as const, label: "History", icon: History },
  { id: "export" as const, label: "Export", icon: Download },
];

interface NavigationProps {
  active: WorkspaceView;
  onChange: (view: WorkspaceView) => void;
}

export function Navigation({ active, onChange }: NavigationProps) {
  return (
    <aside className="navigation">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">Z</span>
        <span>
          <strong>Azure Optimizer</strong>
          <small>Design engineering benchmark</small>
        </span>
      </div>
      <nav className="navigation-list" aria-label="Workspace">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className="navigation-item"
              data-view={item.id}
              data-active={active === item.id}
              aria-current={active === item.id ? "page" : undefined}
              key={item.id}
              onClick={() => onChange(item.id)}
              type="button"
            >
              <Icon aria-hidden="true" size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="navigation-boundary">
        <strong>Benchmark boundary</strong>
        <span>No Azure tenant connected</span>
        <span>Fixed imported dataset</span>
      </div>
    </aside>
  );
}
