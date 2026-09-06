"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";

interface BurnBarrelProps {
  onDeleteApplication: (id: string) => void;
}

export const BurnBarrel: React.FC<BurnBarrelProps> = ({ onDeleteApplication }) => {
  const [active, setActive] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setActive(true);
  };

  const handleDragLeave = () => {
    setActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");
    if (cardId) {
      onDeleteApplication(cardId);
    }
    setActive(false);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`mt-8 grid h-64 w-64 shrink-0 place-content-center rounded-2xl border transition-all duration-200 ${
        active
          ? "border-red-400 bg-red-50 text-red-500 scale-[1.02] shadow-xl shadow-red-500/10"
          : "border-neutral-200/90 bg-neutral-100/50 text-neutral-400 hover:border-neutral-300 hover:text-neutral-500"
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
        <Trash2 className={`w-9 h-9 transition-transform duration-200 ${active ? "scale-110 text-red-500" : "text-neutral-400"}`} />
        <span className="text-[11px] font-medium tracking-wide uppercase text-neutral-400">
          {active ? "Drop to Delete" : "Trash Drop"}
        </span>
      </div>
    </div>
  );
};
