import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import { ExecutionStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export const EXECUTION_STATUS_LABEL: Record<ExecutionStatus, string> = {
  [ExecutionStatus.RUNNING]: "Running",
  [ExecutionStatus.SUCCESS]: "Success",
  [ExecutionStatus.FAILED]: "Failed",
};

export const ExecutionStatusIcon = ({
  status,
  className,
}: {
  status: ExecutionStatus;
  className?: string;
}) => {
  switch (status) {
    case ExecutionStatus.SUCCESS:
      return (
        <CheckCircle2Icon
          aria-label="Success"
          className={cn("size-5 text-green-600", className)}
        />
      );
    case ExecutionStatus.FAILED:
      return (
        <XCircleIcon
          aria-label="Failed"
          className={cn("size-5 text-red-600", className)}
        />
      );
    default:
      return (
        <Loader2Icon
          aria-label="Running"
          className={cn("size-5 animate-spin text-blue-600", className)}
        />
      );
  }
};
