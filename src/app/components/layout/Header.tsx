"use client";

import { Search } from "lucide-react";

type HeaderProps = {
  onSearch: () => void;
};

export default function Header({
  onSearch,
}: HeaderProps) {
  return (
    <header className="flex h-[72px] items-center justify-between border-b border-white/10 px-5 md:px-8">

      {/* Search */}

      <div className="relative w-full max-w-md">
        <button
          onClick={onSearch}
          className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-left transition hover:border-white/20"
        >
          <Search className="h-4 w-4 text-white/30" />

          <span className="text-sm text-white/30">
            Search stocks...
          </span>
        </button>
      </div>

      {/* Market status */}

      <div className="ml-5 flex items-center gap-5">

        <div className="hidden items-center gap-2 md:flex">
          <div className="h-2 w-2 rounded-full bg-[#00d9a5]" />

          <span className="text-xs text-white/50">
            Market Open
          </span>

          <span className="text-xs text-white/20">
            NSE
          </span>
        </div>

        {/* User */}

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
          V
        </div>
      </div>
    </header>
  );
}