"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { JobApplication, ApplicationStatus, COLUMNS, ColumnDefinition } from "@/types/application";
import { KanbanCard } from "./KanbanCard";
import { DropIndicator } from "./DropIndicator";
import { Plus, Clock } from "lucide-react";

interface KanbanBoardProps {
  applications: JobApplication[];
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus, beforeId?: string | null) => void;
  onViewApplication: (application: JobApplication) => void;
  onEditApplication: (application: JobApplication) => void;
  onDeleteApplication: (id: string) => void;
  onQuickAdd: (status: ApplicationStatus) => void;
  onAddCard?: (card: Partial<JobApplication>) => void;
}

const COLUMN_DOT_COLORS: Record<ApplicationStatus, { border: string; bg: string; dot: string }> = {
  applied: { border: "border-purple-500", bg: "bg-purple-500/10", dot: "bg-purple-500" },
  reply: { border: "border-amber-500", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  interview: { border: "border-blue-500", bg: "bg-blue-500/10", dot: "bg-blue-500" },
  offer: { border: "border-emerald-500", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  rejected: { border: "border-rose-400", bg: "bg-rose-500/10", dot: "bg-rose-400" },
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onStatusChange,
  onViewApplication,
  onEditApplication,
  onDeleteApplication,
  onQuickAdd,
  onAddCard,
}) => {
  return (
    <div className="flex gap-3 sm:gap-4 h-full items-stretch min-w-max snap-x snap-mandatory sm:snap-none">
      {COLUMNS.map((column) => (
        <Column
          key={column.id}
          column={column}
          dotStyle={COLUMN_DOT_COLORS[column.id]}
          applications={applications}
          onStatusChange={onStatusChange}
          onViewApplication={onViewApplication}
          onEditApplication={onEditApplication}
          onDeleteApplication={onDeleteApplication}
          onQuickAdd={onQuickAdd}
          onAddCard={onAddCard}
        />
      ))}
    </div>
  );
};

interface ColumnProps {
  column: ColumnDefinition;
  dotStyle: { border: string; bg: string; dot: string };
  applications: JobApplication[];
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus, beforeId?: string | null) => void;
  onViewApplication: (application: JobApplication) => void;
  onEditApplication: (application: JobApplication) => void;
  onDeleteApplication: (id: string) => void;
  onQuickAdd: (status: ApplicationStatus) => void;
  onAddCard?: (card: Partial<JobApplication>) => void;
}

const Column: React.FC<ColumnProps> = ({
  column,
  dotStyle,
  applications,
  onStatusChange,
  onViewApplication,
  onEditApplication,
  onDeleteApplication,
  onQuickAdd,
  onAddCard,
}) => {
  const [active, setActive] = useState(false);

  const columnApplications = applications.filter((c) => c.status === column.id);

  const handleDragStart = (e: React.DragEvent, card: JobApplication) => {
    e.dataTransfer.setData("cardId", card.id);
    e.dataTransfer.setData("sourceColumn", card.status);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    highlightIndicator(e);
    setActive(true);
  };

  const clearHighlights = (els?: HTMLElement[]) => {
    const indicators = els || getIndicators();
    indicators.forEach((i) => {
      i.style.opacity = "0";
    });
  };

  const highlightIndicator = (e: React.DragEvent) => {
    const indicators = getIndicators();
    clearHighlights(indicators);
    const el = getNearestIndicator(e, indicators);
    if (el && el.element) {
      el.element.style.opacity = "1";
    }
  };

  const getNearestIndicator = (e: React.DragEvent, indicators: HTMLElement[]) => {
    const DISTANCE_OFFSET = 50;
    const res = indicators.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE_OFFSET);
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );
    return res;
  };

  const getIndicators = (): HTMLElement[] => {
    return Array.from(document.querySelectorAll(`[data-column="${column.id}"]`));
  };

  const handleDragLeave = () => {
    clearHighlights();
    setActive(false);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const cardId = e.dataTransfer.getData("cardId");
    setActive(false);
    clearHighlights();

    const indicators = getIndicators();
    const nearest = getNearestIndicator(e, indicators);
    const before = nearest?.element?.dataset?.before || "-1";

    if (cardId && before !== cardId) {
      onStatusChange(cardId, column.id, before);
    }
  };

  return (
    <div className="w-[85vw] max-w-[340px] sm:w-[320px] md:w-[300px] lg:w-[320px] shrink-0 snap-center flex flex-col h-full max-h-full min-h-0 bg-input dark:bg-sidebar rounded-xl border border-transparent p-2 select-none">
      {/* 1. Column Header - Pinned at top of column, shrink-0 */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-1 text-foreground select-none shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-3.5 h-3.5 rounded-full border-2 ${dotStyle.border} ${dotStyle.bg} flex items-center justify-center shrink-0`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotStyle.dot}`}></span>
          </span>
          <span className="font-medium text-[13px] text-foreground truncate">{column.title}</span>
          <div className="flex items-center gap-1 text-muted-foreground text-[12px] ml-0.5 font-medium shrink-0">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span>{columnApplications.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
          <button
            onClick={() => onQuickAdd(column.id)}
            className="hover:text-foreground p-0.5 rounded hover:bg-accent transition-colors"
            title={`Add to ${column.title}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Cards List - Independently scrolls vertically with flex-1 min-h-0 overflow-y-auto */}
      <div
        onDrop={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scroll space-y-1 pr-0.5 p-1 rounded-lg transition-colors ${
          active ? "bg-accent/40 ring-1 ring-border" : ""
        }`}
      >
        {columnApplications.map((app, index) => (
          <KanbanCard
            key={app.id}
            application={app}
            index={index}
            onView={onViewApplication}
            onEdit={onEditApplication}
            onDelete={onDeleteApplication}
            handleDragStart={handleDragStart}
          />
        ))}
        <DropIndicator beforeId={null} column={column.id} />

        {/* Inline Add Card Component */}
        <AddCard column={column.id} onAddCard={onAddCard} />
      </div>
    </div>
  );
};

interface AddCardProps {
  column: ApplicationStatus;
  onAddCard?: (card: Partial<JobApplication>) => void;
}

export const AddCard: React.FC<AddCardProps> = ({ column, onAddCard }) => {
  const [adding, setAdding] = useState(false);
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim() || !company.trim()) return;

    onAddCard?.({
      role: role.trim(),
      company: company.trim(),
      status: column,
    });

    setRole("");
    setCompany("");
    setAdding(false);
  };

  return (
    <>
      <AnimatePresence>
        {adding ? (
          <motion.form
            layout
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onSubmit={handleSubmit}
            className="rounded-lg bg-card p-2.5 border border-border shadow-xs space-y-2 mt-2"
          >
            <input
              type="text"
              autoFocus
              placeholder="Job role..."
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded-md bg-input dark:bg-sidebar border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
            <input
              type="text"
              placeholder="Company..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full text-xs px-2 py-1.5 rounded-md bg-input dark:bg-sidebar border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
            <div className="flex items-center justify-end gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setRole("");
                  setCompany("");
                }}
                className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!role.trim() || !company.trim()}
                className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md shadow hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.button
            layout
            onClick={() => setAdding(true)}
            className="w-full py-1.5 px-2 text-left text-xs text-muted-foreground hover:text-foreground hover:bg-card/70 rounded-md transition border border-dashed border-border hover:border-foreground/30 font-medium flex items-center gap-1.5 mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add application</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
