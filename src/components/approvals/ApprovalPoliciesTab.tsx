"use client";

import { ShieldCheck } from "lucide-react";
import ApprovalPolicyTable from "@/components/approvals/ApprovalPolicyTable";
import { TApprovalPolicy } from "@/type";

export interface ApprovalPoliciesTabProps {
  policies: TApprovalPolicy[];
  isLoading: boolean;
  onAddPolicy?: () => void;
  onEditPolicy?: (policy: TApprovalPolicy) => void;
}

export default function ApprovalPoliciesTab({
  policies,
  isLoading,
  onAddPolicy,
  onEditPolicy,
}: ApprovalPoliciesTabProps) {
  return (
    <div className="space-y-6">
      {/* Institutional Status Banner */}
      <div className="p-5 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary shrink-0" />
            <h3 className="text-sm font-bold text-foreground">
              Super Admin Approval Rule Engine &amp; Exemption Manager
            </h3>
          </div>
          <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
            By default, <strong>all mutations</strong> (creating or editing
            items, stock, categories, requisitions, departments, etc.) require
            Super Admin approval. As Super Admin, you can declare exemptions
            below so specific trusted persons, roles, or actions can save
            directly without approval.
          </p>
        </div>
      </div>

      {/* Policy Table with Direct Query Search & Filtering */}
      <ApprovalPolicyTable
        policies={policies}
        isLoading={isLoading}
        onAddPolicy={onAddPolicy}
        onEditPolicy={onEditPolicy}
      />
    </div>
  );
}
