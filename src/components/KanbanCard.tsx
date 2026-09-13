"use client";

import React from "react";
import { motion } from "framer-motion";
import { JobApplication } from "@/types/application";
import { formatDate } from "@/lib/utils";
import {
  Eye,
  Edit2,
  Trash2,
  Calendar,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import { DropIndicator } from "./DropIndicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SenderAvatar } from "@/components/ui/sender-avatar";

interface KanbanCardProps {
  application: JobApplication;
  index: number;
  onView: (application: JobApplication) => void;
  onEdit: (application: JobApplication) => void;
  onDelete: (id: string) => void;
  handleDragStart: (e: React.DragEvent, card: JobApplication) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  application,
  index,
  onView,
  onEdit,
  onDelete,
  handleDragStart,
}) => {
  const latestDate = application.latest_update_date || application.applied_date;

  // Generate a deterministic job code like JOB-101 from id
  const jobCode = `JOB-${100 + (Math.abs(application.company.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 900)}`;

  // Deterministic tag based on status that adapts to dark and light modes
  const getTagStyle = () => {
    switch (application.status) {
      case "offer":
        return {
          label: "Tier 1",
          dot: "bg-emerald-500",
        };
      case "interview":
        return {
          label: "In Progress",
          dot: "bg-blue-500",
        };
      case "reply":
        return {
          label: "Recruiter Reply",
          dot: "bg-amber-500",
        };
      case "rejected":
        return {
          label: "Archived",
          dot: "bg-rose-500",
        };
      default:
        return {
          label: "Active",
          dot: "bg-purple-500",
        };
    }
  };

  const tag = getTagStyle();

  return (
    <>
      <DropIndicator beforeId={application.id} column={application.status} />
      <motion.div
        layout="position"
        layoutId={application.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          duration: 0.4,
          ease: "easeOut",
        }}
        draggable="true"
        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, application)}
        onClick={() => onView(application)}
        className="group relative cursor-grab rounded-lg p-3 bg-card text-card-foreground border border-border hover:border-border/80 hover:shadow-sm transition-colors active:cursor-grabbing active:shadow-none overflow-hidden text-[13px] select-none w-full min-w-0 break-words"
      >


        {/* Top: Job Code & Avatar / Monogram */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-normal text-muted-foreground tracking-wide block mb-0.5">
              {jobCode}
            </span>
            <h4 className="font-medium text-[13px] text-foreground leading-tight break-words line-clamp-2">
              {application.role} <span className="text-muted-foreground font-normal">· {application.company}</span>
            </h4>
          </div>

          {/* Recruiter / Company Avatar */}
          <SenderAvatar
            sender={application.sender}
            company={application.company}
            size="sm"
          />
        </div>


        {/* Card Badges row */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap min-w-0">
          {/* Priority / Tag badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border shrink-0 ${tag}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${tag.dot}`}></span>
            <span>{tag.label}</span>
          </span>

          {/* Cycles / Thread badge */}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] text-muted-foreground bg-secondary/80 border border-border shrink-0">
            <RefreshCw className="w-3 h-3 text-muted-foreground" />
            <span>{application.history_log?.length || 1}</span>
          </span>

          {/* Date badge */}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] text-muted-foreground bg-secondary/80 border border-border shrink-0">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span>{formatDate(latestDate)}</span>
          </span>

          {/* Action dropdown button (shadcn DropdownMenu) */}
          <div className="ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                  title="Card options"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem
                  onClick={() => onView(application)}
                  className="cursor-pointer gap-2"
                >
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>View details</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onEdit(application)}
                  className="cursor-pointer gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(application.id)}
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>
    </>
  );
};
