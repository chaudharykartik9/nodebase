"use client";

import type { NodeProps } from "@xyflow/react";
import { MousePointerIcon } from "lucide-react";
import { memo, useState } from "react";
import { useNodeStatus } from "@/features/editor/hooks/use-workflow-status";
import { BaseTriggerNode } from "../base-trigger-node";
import { ManualTriggerDialog } from "./dialog";

export const ManualTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Live status while a workflow runs (loading, success or error).
  const nodeStatus = useNodeStatus(props.id);

  const handleOpenSettings = () => setDialogOpen(true);

  return (
    <>
      <ManualTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BaseTriggerNode
        {...props}
        icon={MousePointerIcon}
        name="When clicking 'Execute workflow'"
        status={nodeStatus}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

ManualTriggerNode.displayName = "ManualTriggerNode";
