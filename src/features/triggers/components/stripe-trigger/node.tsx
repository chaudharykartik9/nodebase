"use client";

import type { NodeProps } from "@xyflow/react";
import { CreditCardIcon } from "lucide-react";
import { memo, useState } from "react";
import { useNodeStatus } from "@/features/editor/hooks/use-workflow-status";
import { BaseTriggerNode } from "../base-trigger-node";
import { StripeTriggerDialog } from "./dialog";

export const StripeTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Live status while a workflow runs (loading, success or error).
  const nodeStatus = useNodeStatus(props.id);

  const handleOpenSettings = () => setDialogOpen(true);

  return (
    <>
      <StripeTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BaseTriggerNode
        {...props}
        icon={CreditCardIcon}
        name="Stripe"
        description="When a Stripe event happens"
        status={nodeStatus}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

StripeTriggerNode.displayName = "StripeTriggerNode";
