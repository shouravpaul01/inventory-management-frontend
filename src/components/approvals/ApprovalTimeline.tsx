"use client";

import { TApprovalRecord } from "@/type";
import { CheckCircle2, XCircle, Clock, AlertCircle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ApprovalTimelineProps {
  records: TApprovalRecord[];
  currentLevel?: number;
}

export default function ApprovalTimeline({
  records,
  currentLevel = 1,
}: ApprovalTimelineProps) {
  const sortedRecords = [...records].sort((a, b) => a.level - b.level);

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Multi-Tier Approval Progress
      </h4>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {sortedRecords.map((record) => {
          const isCurrent = record.level === currentLevel && record.status === "PENDING";
          const isPassed = record.status === "APPROVED";
          const isRejected = record.status === "REJECTED";

          return (
            <div key={record.id || record.level} className="relative group">
              {/* Status Circle Node */}
              <div
                className={`absolute -left-6 top-0.5 size-5 rounded-full flex items-center justify-center ring-4 ring-background ${
                  isPassed
                    ? "bg-emerald-600 text-white"
                    : isRejected
                    ? "bg-rose-600 text-white"
                    : isCurrent
                    ? "bg-sky-600 text-white animate-pulse"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isPassed ? (
                  <CheckCircle2 className="size-3" />
                ) : isRejected ? (
                  <XCircle className="size-3" />
                ) : isCurrent ? (
                  <Clock className="size-3" />
                ) : (
                  <span className="text-[10px] font-bold">{record.level}</span>
                )}
              </div>

              {/* Tier Content */}
              <div
                className={`p-3 rounded-lg border text-xs transition-colors ${
                  isCurrent
                    ? "border-sky-500/50 bg-sky-50/50 dark:bg-sky-950/20"
                    : "bg-card"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      Level {record.level} Review
                    </span>
                    {isCurrent && (
                      <Badge variant="secondary" className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 text-[10px]">
                        Active Stage
                      </Badge>
                    )}
                  </div>

                  <Badge
                    variant={
                      isPassed
                        ? "default"
                        : isRejected
                        ? "destructive"
                        : "outline"
                    }
                    className={`text-[10px] ${
                      isPassed ? "bg-emerald-600 hover:bg-emerald-600" : ""
                    }`}
                  >
                    {record.status}
                  </Badge>
                </div>

                <div className="mt-2 text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                  {record.approver && (
                    <div className="flex items-center gap-1 font-medium text-foreground">
                      <User className="size-3 text-muted-foreground" />
                      <span>
                        {record.approver.firstName} {record.approver.lastName}
                      </span>
                    </div>
                  )}

                  {record.actedAt && (
                    <span>
                      Acted:{" "}
                      {new Date(record.actedAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>

                {record.comments && (
                  <div className="mt-2 p-2 rounded bg-muted/40 border text-muted-foreground text-xs italic">
                    &ldquo;{record.comments}&rdquo;
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
