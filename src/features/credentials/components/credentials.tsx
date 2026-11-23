"use client";

import { formatDistanceToNow } from "date-fns";
import { KeyRoundIcon } from "lucide-react";
import Image from "next/image";
import {
  EmptyView,
  EntityContainer,
  EntityHeader,
  EntityItem,
  EntityList,
  EntityPagination,
  EntitySearch,
  ErrorView,
  LoadingView,
} from "@/components/entity-components";
import { AI_PROVIDERS } from "@/features/executions/components/ai/providers";
import type { Credential } from "@/generated/prisma/browser";
import { useEntitySearch } from "@/hooks/use-entity-search";
import {
  useRemoveCredential,
  useSuspenseCredentials,
} from "../hooks/use-credentials";
import { useCredentialsParams } from "../hooks/use-credentials-params";

export const CredentialsSearch = () => {
  const [params, setParams] = useCredentialsParams();
  const { searchValue, onSearchChange } = useEntitySearch({
    params,
    setParams,
  });

  return (
    <EntitySearch
      value={searchValue}
      onChange={onSearchChange}
      placeholder="Search credentials"
    />
  );
};

export const CredentialsList = () => {
  const credentials = useSuspenseCredentials();

  return (
    <EntityList
      items={credentials.data.items}
      getKey={(credential) => credential.id}
      renderItem={(credential) => <CredentialItem data={credential} />}
      emptyView={<CredentialsEmpty />}
    />
  );
};

export const CredentialsHeader = ({ disabled }: { disabled?: boolean }) => {
  return (
    <EntityHeader
      title="Credentials"
      description="Create and manage your API keys"
      newButtonHref="/credentials/new"
      newButtonLabel="New credential"
      disabled={disabled}
    />
  );
};

export const CredentialsPagination = () => {
  const credentials = useSuspenseCredentials();
  const [params, setParams] = useCredentialsParams();

  return (
    <EntityPagination
      disabled={credentials.isFetching}
      totalPages={credentials.data.totalPages}
      page={credentials.data.page}
      onPageChange={(page) => setParams({ ...params, page })}
    />
  );
};

export const CredentialsContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <EntityContainer
      header={<CredentialsHeader />}
      search={<CredentialsSearch />}
      pagination={<CredentialsPagination />}
    >
      {children}
    </EntityContainer>
  );
};

export const CredentialsLoading = () => {
  return <LoadingView message="Loading credentials..." />;
};

export const CredentialsError = () => {
  return <ErrorView message="Error loading credentials" />;
};

export const CredentialsEmpty = () => {
  const [params] = useCredentialsParams();

  // A search with no results is not the same as having no credentials.
  if (params.search) {
    return (
      <EmptyView
        message={`No credentials match "${params.search}". Try a different search.`}
      />
    );
  }

  return (
    <EmptyView message="You haven't created any credentials yet. Save an API key here and pick it in your AI nodes." />
  );
};

// The credential data here never includes the saved key itself.
type CredentialListItem = Pick<
  Credential,
  "id" | "name" | "type" | "createdAt" | "updatedAt"
>;

export const CredentialItem = ({ data }: { data: CredentialListItem }) => {
  const removeCredential = useRemoveCredential();
  const provider = AI_PROVIDERS[data.type];

  const handleRemove = () => {
    removeCredential.mutate({ id: data.id });
  };

  return (
    <EntityItem
      href={`/credentials/${data.id}`}
      title={data.name}
      subtitle={
        <>
          {provider.label} &bull; Updated{" "}
          {formatDistanceToNow(data.updatedAt, { addSuffix: true })} &bull;
          Created {formatDistanceToNow(data.createdAt, { addSuffix: true })}
        </>
      }
      image={
        <div className="size-8 flex items-center justify-center">
          {provider ? (
            <Image
              src={provider.icon}
              alt={provider.label}
              width={20}
              height={20}
            />
          ) : (
            <KeyRoundIcon className="size-5 text-muted-foreground" />
          )}
        </div>
      }
      onRemove={handleRemove}
      isRemoving={removeCredential.isPending}
    />
  );
};
