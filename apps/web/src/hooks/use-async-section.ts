"use client";

import { useCallback, useEffect, useState } from "react";
import type { SectionStatus } from "@/types/home";

type UseAsyncSectionOptions<T> = {
  load: () => Promise<T>;
  isEmpty?: (data: T) => boolean;
  deps?: unknown[];
};

export function useAsyncSection<T>({
  load,
  isEmpty,
  deps = [],
}: UseAsyncSectionOptions<T>) {
  const [status, setStatus] = useState<SectionStatus>("loading");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const next = await load();
      if (isEmpty?.(next)) {
        setData(next);
        setStatus("empty");
        return;
      }
      setData(next);
      setStatus("success");
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Failed to load");
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { status, data, error, reload };
}
