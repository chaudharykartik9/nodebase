import { useEffect, useRef, useState } from "react";
import { PAGINATION } from "@/config/constants";

interface UseEntitySearchProps<
  T extends {
    search: string;
    page: number;
  },
> {
  params: T;
  setParams: (params: T) => void;
  debounceMs?: number;
}

// Keeps the input responsive and writes to the URL only after the user stops typing.
export function useEntitySearch<
  T extends {
    search: string;
    page: number;
  },
>({ params, setParams, debounceMs = 500 }: UseEntitySearchProps<T>) {
  const [localSearch, setLocalSearch] = useState(params.search);

  // Always read the latest params without making the effect depend on the object identity.
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    const current = paramsRef.current;

    // Clearing the box applies immediately.
    if (localSearch === "" && current.search !== "") {
      setParams({ ...current, search: "", page: PAGINATION.DEFAULT_PAGE });
      return;
    }

    const timer = setTimeout(() => {
      if (localSearch !== paramsRef.current.search) {
        setParams({
          ...paramsRef.current,
          search: localSearch,
          page: PAGINATION.DEFAULT_PAGE,
        });
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localSearch, setParams, debounceMs]);

  // Keep the input in sync when the URL changes (back button, link).
  useEffect(() => {
    setLocalSearch(params.search);
  }, [params.search]);

  return {
    searchValue: localSearch,
    onSearchChange: setLocalSearch,
  };
}
