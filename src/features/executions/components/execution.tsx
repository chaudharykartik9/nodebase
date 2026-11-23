"use client";

import Link from "next/link";
import { ErrorView, LoadingView } from "@/components/entity-components";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSuspenseExecution } from "../hooks/use-executions";
import { formatDuration } from "../lib/format";
import {
  EXECUTION_STATUS_LABEL,
  ExecutionStatusIcon,
} from "./execution-status";
import { LocalTime, RelativeTime } from "./time";

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="text-sm">{children}</div>
  </div>
);

export const ExecutionView = ({ executionId }: { executionId: string }) => {
  const { data: execution } = useSuspenseExecution(executionId);

  const duration = execution.completedAt
    ? formatDuration(
        execution.completedAt.getTime() - execution.startedAt.getTime(),
      )
    : null;

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ExecutionStatusIcon status={execution.status} className="size-6" />
          <div>
            <CardTitle>{EXECUTION_STATUS_LABEL[execution.status]}</CardTitle>
            <CardDescription>
              Execution of {execution.workflow.name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Workflow">
            <Link
              href={`/workflows/${execution.workflow.id}`}
              className="text-primary hover:underline"
              prefetch
            >
              {execution.workflow.name}
            </Link>
          </Field>
          <Field label="Status">
            {EXECUTION_STATUS_LABEL[execution.status]}
          </Field>
          <Field label="Started">
            <LocalTime date={execution.startedAt} /> (
            <RelativeTime date={execution.startedAt} />)
          </Field>
          {execution.completedAt ? (
            <Field label="Finished">
              <LocalTime date={execution.completedAt} />
            </Field>
          ) : null}
          {duration ? <Field label="Duration">{duration}</Field> : null}
        </div>

        {execution.error ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-600">Error</p>
            <p className="rounded-md border border-red-200 bg-red-50 p-3 font-mono text-sm text-red-900 break-words whitespace-pre-wrap">
              {execution.error}
            </p>
            {execution.errorStack ? (
              <details>
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Technical details (stack trace)
                </summary>
                <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
                  {execution.errorStack}
                </pre>
              </details>
            ) : null}
          </div>
        ) : null}

        {execution.output ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Output</p>
            <pre className="max-h-[32rem] overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(execution.output, null, 2)}
            </pre>
          </div>
        ) : null}

        <Button variant="outline" asChild>
          <Link href="/executions" prefetch>
            Back to executions
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export const ExecutionLoading = () => {
  return <LoadingView message="Loading execution..." />;
};

export const ExecutionError = () => {
  return <ErrorView message="Error loading execution" />;
};
