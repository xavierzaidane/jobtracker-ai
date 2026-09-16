"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Sparkles, Target } from "lucide-react";
import { TopProspects } from "./types";

interface TopTargetRolesProps {
  topProspects: TopProspects;
  onQuickApply?: () => void;
}

export const TopTargetRoles: React.FC<TopTargetRolesProps> = ({
  topProspects,
  onQuickApply,
}) => {
  const hasAnyCard = Boolean(topProspects.card1 || topProspects.card2);

  return (
    <Card className="rounded-2xl p-5 shadow-xs border border-border bg-card text-card-foreground space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Briefcase className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-lg font-normal tracking-tight text-foreground">
            Top Target Roles
          </h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onQuickApply}
          className="h-7 text-xs font-medium rounded-xl border-border bg-background hover:bg-secondary text-foreground"
        >
          + New Role
        </Button>
      </div>

      {!hasAnyCard ? (
        <div className="rounded-2xl p-6 border border-dashed border-border/70 flex flex-col items-center justify-center text-center space-y-2 min-h-[160px]">
          <Target className="w-6 h-6 text-muted-foreground opacity-50" />
          <p className="text-xs font-medium text-foreground">No active target roles</p>
          <p className="text-[11px] text-muted-foreground max-w-[260px]">
            Applications moving to interview or offer stages will be highlighted here as top prospects.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={onQuickApply}
            className="h-7 text-xs rounded-lg mt-1"
          >
            Add First Application
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Interviewing Card */}
          {topProspects.card1 ? (
            <div className="rounded-2xl p-3.5 bg-secondary text-secondary-foreground shadow-xs flex flex-col justify-between min-h-[160px] border border-border relative overflow-hidden select-none">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-normal bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    Interviewing
                  </span>
                </div>
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-normal text-foreground">
                  {topProspects.card1.company.charAt(0)}
                </div>
              </div>

              <div className="relative z-10 pt-2">
                <div className="text-sm font-normal text-foreground truncate">
                  {topProspects.card1.company}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {topProspects.card1.role}
                </div>
              </div>

              <div className="space-y-1 relative z-10 pt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Next Step:</span>
                  <span className="font-normal text-foreground truncate">
                    {topProspects.card1.stage}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-mono text-primary font-normal">
                    {topProspects.card1.compRange}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-3.5 border border-dashed border-border flex flex-col items-center justify-center text-center text-xs text-muted-foreground min-h-[160px]">
              No active interviews
            </div>
          )}

          {/* Card 2: Offer Card */}
          {topProspects.card2 ? (
            <div className="rounded-2xl p-3.5 bg-primary text-primary-foreground shadow-xs flex flex-col justify-between min-h-[160px] border border-primary/30 relative overflow-hidden select-none">
              <div className="absolute right-3 top-8 text-primary-foreground/20 pointer-events-none">
                <Sparkles className="w-5 h-5" />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-normal bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/30 px-2 py-0.5 rounded-full">
                    Offer In Hand
                  </span>
                </div>
                <div className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center text-[10px] font-normal text-primary-foreground">
                  {topProspects.card2.company.charAt(0)}
                </div>
              </div>

              <div className="relative z-10 pt-2">
                <div className="text-sm font-normal text-primary-foreground truncate">
                  {topProspects.card2.company}
                </div>
                <div className="text-xs text-primary-foreground/80 truncate mt-0.5">
                  {topProspects.card2.role}
                </div>
              </div>

              <div className="space-y-1 relative z-10 pt-2 border-t border-primary-foreground/20">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-primary-foreground/80">Stage:</span>
                  <span className="font-normal text-primary-foreground truncate">
                    {topProspects.card2.stage}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-primary-foreground/80">Status:</span>
                  <span className="font-mono text-primary-foreground font-normal">
                    {topProspects.card2.compRange}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-3.5 border border-dashed border-border flex flex-col items-center justify-center text-center text-xs text-muted-foreground min-h-[160px]">
              No offers extended yet
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
