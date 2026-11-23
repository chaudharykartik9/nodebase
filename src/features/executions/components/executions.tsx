"use client";

import {
  EmptyView,
  EntityContainer,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  ErrorView,
  LoadingView,
} from "@/components/entity-components";
import type { ExecutionStatus } from "@/generated/prisma/enums";
import { useSuspenseExecutions } from "../hooks/use-executions";
import { useExecutionsParams } from "../hooks/use-executions-params";
import { formatDuration } from "../lib/format";
import {
  EXECUTION_STATUS_LABEL,
  ExecutionStatusIcon,
} from "./execution-status";
import { RelativeTime } from "./time";

type ExecutionListItem = {
  id: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt: Date | null;
  workflow: { id: string; name: string };
};

export const ExecutionsList = () => {
  const executions = useSuspenseExecutions();

  return (
    <EntityList
      items={executions.data.items}
      getKey={(execution) => execution.id}
      renderItem={(execution) => <ExecutionItem data={execution} />}
      emptyView={<ExecutionsEmpty />}
    />
  );
};

export const ExecutionsHeader = () => {
  return (
    <EntityHeader
      title="Executions"
      description="View the history of your workflow runs"
    />
  );
};

export const ExecutionsPagination = () => {
  const executions = useSuspenseExecutions();
  const [params, setParams] = useExecutionsParams();

  return (
    <EntityPagination
      disabled={executions.isFetching}
      totalPages={executions.data.totalPages}
      page={executions.data.page}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const ExecutionsContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <EntityContainer
      header={<ExecutionsHeader />}
      pagination={<ExecutionsPagination />}
    >
      {children}
    </EntityContainer>
  );
};

export const ExecutionsLoading = () => {
  return <LoadingView message="Loading executions..." />;
};

export const ExecutionsError = () => {
  return <ErrorView message="Error loading executions" />;
};

export const ExecutionsEmpty = () => {
  return (
    <EmptyView message="You haven't run any workflows yet. Run a workflow and it will show up here." />
  );
};

export const ExecutionItem = ({ data }: { data: ExecutionListItem }) => {
  const duration = data.completedAt
    ? formatDuration(data.completedAt.getTime() - data.startedAt.getTime())
    : null;

  return (
    <EntityItem
      href={`/executions/${data.id}`}
      title={data.workflow.name}
      subtitle={
        <>
          {EXECUTION_STATUS_LABEL[data.status]} &bull; Started{" "}
          <RelativeTime date={data.startedAt} />
          {duration ? <> &bull; Took {duration}</> : null}
        </>
      }
      image={
        <div className="size-8 flex items-center justify-center">
          <ExecutionStatusIcon status={data.status} />
        </div>
      }
    />
  );
};
