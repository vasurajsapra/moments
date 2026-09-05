"use client";

import {
  Bell,
  Eye,
  LayoutDashboard,
  Zap,
} from "lucide-react";

type SidebarProps = {
  activeTab:
    | "watchlist"
    | "moments"
    | "attention"
    | "ripple";

  momentCount: number;

  onTabChange: (
    tab:
      | "watchlist"
      | "moments"
      | "attention"
      | "ripple"
  ) => void;
};

export default function Sidebar({
  activeTab,
  momentCount,
  onTabChange,
}: SidebarProps) {
  return (
    <aside className="hidden w-[230px] shrink-0 border-r border-white/10 bg-[#0a120f] px-4 py-5 lg:block">
      <div className="flex items-center gap-3 px-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00d9a5]">
          <Zap className="h-5 w-5 text-[#07100c]" />
        </div>

        <div>
          <div className="text-sm font-semibold tracking-tight">
            Moments
          </div>

          <div className="text-[10px] uppercase tracking-widest text-white/30">
            Groww Intelligence
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-1">
        <button
          onClick={() => onTabChange("watchlist")}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
            activeTab === "watchlist"
              ? "bg-white/7 text-white"
              : "text-white/45 hover:bg-white/5 hover:text-white"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Watchlist
        </button>

        <button
          onClick={() => onTabChange("moments")}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
            activeTab === "moments"
              ? "bg-white/7 text-white"
              : "text-white/45 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Zap className="h-4 w-4" />
          Moments

          {momentCount > 0 && (
            <span className="ml-auto rounded-full bg-[#00d9a5]/10 px-2 py-0.5 text-[10px] text-[#00d9a5]">
              {momentCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange("attention")}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
            activeTab === "attention"
              ? "bg-white/7 text-white"
              : "text-white/45 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Eye className="h-4 w-4" />
          Attention Map
        </button>

        <button
          onClick={() => onTabChange("ripple")}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
            activeTab === "ripple"
              ? "bg-white/7 text-white"
              : "text-white/25 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Bell className="h-4 w-4" />
          Event Ripple
        </button>
      </div>

      <div className="absolute bottom-5 px-3 text-[11px] text-white/20">
        Market Intelligence
      </div>
    </aside>
  );
}