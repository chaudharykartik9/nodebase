"use client";

import { createId } from "@paralleldrive/cuid2";
import { useReactFlow } from "@xyflow/react";
import { GlobeIcon, MousePointerIcon } from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NodeType } from "@/generated/prisma/enums";
import { Separator } from "./ui/separator";

export type NodeTypeOption = {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }> | string;
};

const triggerNodes: NodeTypeOption[] = [
  {
    type: NodeType.MANUAL_TRIGGER,
    label: "Trigger manually",
    description:
      "Runs the flow on clicking a button. Good for getting started quickly",
    icon: MousePointerIcon,
  },
  {
    type: NodeType.GOOGLE_FORM_TRIGGER,
    label: "Google Form",
    description: "Runs the flow when a Google Form is submitted",
    icon: "/googleform.svg",
  },
];

const executionNodes: NodeTypeOption[] = [
  {
    type: NodeType.HTTP_REQUEST,
    label: "HTTP Request",
    description: "Makes an HTTP request",
    icon: GlobeIcon,
  },
];

// A workflow can have one trigger of each kind (for example one manual trigger
// and one Google Form trigger). Add new trigger types here.
const TRIGGER_TYPES = new Set<NodeType>([
  NodeType.MANUAL_TRIGGER,
  NodeType.GOOGLE_FORM_TRIGGER,
]);

interface NodeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const NodeOption = ({
  option,
  onSelect,
}: {
  option: NodeTypeOption;
  onSelect: (option: NodeTypeOption) => void;
}) => {
  const Icon = option.icon;

  return (
    <button
      type="button"
      className="w-full text-left h-auto py-5 px-4 cursor-pointer border-l-2 border-transparent hover:border-l-primary hover:bg-muted/50"
      onClick={() => onSelect(option)}
    >
      <div className="flex items-center gap-6 w-full overflow-hidden">
        {typeof Icon === "string" ? (
          <Image
            src={Icon}
            alt={option.label}
            width={20}
            height={20}
            className="size-5 object-contain rounded-sm"
          />
        ) : (
          <Icon className="size-5" />
        )}
        <div className="flex flex-col items-start text-left">
          <span className="font-medium text-sm">{option.label}</span>
          <span className="text-xs text-muted-foreground">
            {option.description}
          </span>
        </div>
      </div>
    </button>
  );
};

export function NodeSelector({
  open,
  onOpenChange,
  children,
}: NodeSelectorProps) {
  const { setNodes, getNodes, screenToFlowPosition } = useReactFlow();

  const handleNodeSelect = useCallback(
    (selection: NodeTypeOption) => {
      // Only one trigger of each kind per workflow
      if (TRIGGER_TYPES.has(selection.type)) {
        const alreadyThere = getNodes().some(
          (node) => node.type === selection.type,
        );

        if (alreadyThere) {
          toast.error(
            `Only one "${selection.label}" trigger is allowed per workflow`,
          );
          return;
        }
      }

      setNodes((nodes) => {
        // The placeholder node disappears as soon as a real node is added.
        const withoutPlaceholder = nodes.filter(
          (node) => node.type !== NodeType.INITIAL,
        );

        // Drop the new node near the middle of the screen, slightly shifted
        // so several new nodes do not land exactly on top of each other.
        const flowPosition = screenToFlowPosition({
          x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
          y: window.innerHeight / 2 + (Math.random() - 0.5) * 200,
        });

        const newNode = {
          id: createId(),
          data: {},
          position: flowPosition,
          type: selection.type,
        };

        return [...withoutPlaceholder, newNode];
      });

      onOpenChange(false);
    },
    [setNodes, getNodes, onOpenChange, screenToFlowPosition],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>What triggers this workflow?</SheetTitle>
          <SheetDescription>
            A trigger is a step that starts your workflow.
          </SheetDescription>
        </SheetHeader>
        <div>
          {triggerNodes.map((option) => (
            <NodeOption
              key={option.type}
              option={option}
              onSelect={handleNodeSelect}
            />
          ))}
        </div>
        <Separator />
        <div>
          {executionNodes.map((option) => (
            <NodeOption
              key={option.type}
              option={option}
              onSelect={handleNodeSelect}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
