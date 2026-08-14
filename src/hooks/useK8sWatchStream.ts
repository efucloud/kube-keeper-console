import type { WatchEvent } from "@/services/common";
import { getResourceKey } from "@/utils/cluster";
import { encodeQueryParams } from "@/utils/discovery";
import { getToken } from "@/utils/global";
import { parseNDJSONStream } from "@/utils/ndjson-stream";
import { useIntl } from "@umijs/max";
import { message } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseK8sWatchStreamOptions {
  cluster: string;
  address: string;
  namespace?: string;
  labelSelector?: Record<string, string>;
  fieldSelector?: Record<string, string>;
}

interface ParsedAddress {
  group: string;
  version: string;
  resource: string;
  namespace?: string;
}

const parseAddress = (address?: string): ParsedAddress | null => {
  if (typeof address !== "string") {
    return null;
  }

  const normalized = address.trim().replace(/^\/+/, "").split("?")[0];
  if (!normalized) {
    return null;
  }

  let segments = normalized.split("/").filter(Boolean);
  const apiRootIndex = segments.findIndex(
    (segment) => segment === "api" || segment === "apis"
  );
  if (apiRootIndex > 0) {
    segments = segments.slice(apiRootIndex);
  }

  if (segments[0] === "api") {
    if (segments.length < 3) {
      return null;
    }
    const version = segments[1];
    if (!version) {
      return null;
    }

    // namespaced path: api/v1/namespaces/{namespace}/{resource}
    if (segments[2] === "namespaces" && segments.length >= 5) {
      return {
        group: "",
        version,
        namespace: segments[3],
        resource: segments[4],
      };
    }

    // cluster scoped path (including api/v1/namespaces)
    return {
      group: "",
      version,
      resource: segments[2],
    };
  }

  if (segments[0] === "apis") {
    if (segments.length < 4) {
      return null;
    }

    const group = segments[1];
    const version = segments[2];
    if (!group || !version) {
      return null;
    }

    // namespaced path: apis/{group}/{version}/namespaces/{namespace}/{resource}
    if (segments[3] === "namespaces" && segments.length >= 6) {
      return {
        group,
        version,
        namespace: segments[4],
        resource: segments[5],
      };
    }

    return {
      group,
      version,
      resource: segments[3],
    };
  }

  return null;
};

export function useK8sWatchStream<T>(options: UseK8sWatchStreamOptions) {
  const intl = useIntl();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const { cluster, address, namespace, labelSelector = {}, fieldSelector = {} } =
    options;
  const latestOptionsRef = useRef<UseK8sWatchStreamOptions>({
    cluster,
    address,
    namespace,
    labelSelector,
    fieldSelector,
  });
  latestOptionsRef.current = {
    cluster,
    address,
    namespace,
    labelSelector,
    fieldSelector,
  };
  const intlRef = useRef(intl);
  intlRef.current = intl;

  const startWatch = useCallback(async () => {
    const {
      cluster: currentCluster,
      address: currentAddress,
      namespace: currentNamespace,
      labelSelector: currentLabelSelector = {},
      fieldSelector: currentFieldSelector = {},
    } = latestOptionsRef.current;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const parsed = parseAddress(currentAddress);
    if (!parsed) {
      message.error(
        intlRef.current.formatMessage({ id: "cluster.resource.watch.start.failed" }) +
          `: invalid address (${String(currentAddress || "")})`
      );
      return;
    }

    const watchNamespace = currentNamespace || parsed.namespace;
    const token = getToken();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);
    setData([]);

    const query = {
      group: parsed.group,
      version: parsed.version,
      resource: parsed.resource,
    } as Record<string, string>;

    const fieldSelectors: string[] = [];
    Object.entries(currentFieldSelector).forEach(([key, value]) => {
      if (value != null && value !== "") {
        fieldSelectors.push(`${key}=${value}`);
      }
    });
    if (fieldSelectors.length > 0) {
      query.fieldSelector = fieldSelectors.join(",");
    }

    const labelSelectors: string[] = [];
    Object.entries(currentLabelSelector).forEach(([key, value]) => {
      if (value != null && value !== "") {
        labelSelectors.push(`${key}=${value}`);
      }
    });
    if (labelSelectors.length > 0) {
      query.labelSelector = labelSelectors.join(",");
    }

    const queryParams = encodeQueryParams(query);
    const baseUrl =
      watchNamespace && watchNamespace !== "-"
        ? `/api/stream/cluster/${currentCluster}/namespace/${watchNamespace}`
        : `/api/stream/cluster/${currentCluster}`;

    try {
      const response = await fetch(`${baseUrl}?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token?.access_token || ""}`,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => intlRef.current.formatMessage({ id: "pages.unknown.error" }));
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      await parseNDJSONStream(
        response,
        (event: WatchEvent<T>) => {
          if (!isMountedRef.current || controller.signal.aborted) {
            return;
          }
          if (event.Type === "BOOKMARK" || !event.Object) {
            return;
          }

          setData((prev) => {
            const newItem = event.Object;
            const newKey = getResourceKey(newItem as any);

            if (event.Type === "DELETED") {
              return prev.filter((item) => getResourceKey(item as any) !== newKey);
            }

            if (event.Type === "ADDED" || event.Type === "MODIFIED") {
              const filtered = prev.filter(
                (item) => getResourceKey(item as any) !== newKey
              );
              return [newItem, ...filtered];
            }

            return prev;
          });
        },
        (error) => {
          if (!isMountedRef.current || controller.signal.aborted) {
            return;
          }
          message.error(
            `${intlRef.current.formatMessage({ id: "cluster.resource.watch.failed" })}: ${
              error.message
            }`
          );
        }
      );
    } catch (error: any) {
      if (!controller.signal.aborted) {
        message.error(
          `${intlRef.current.formatMessage({
            id: "cluster.resource.watch.start.failed",
          })}: ${error.message}`
        );
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const stopWatch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    startWatch,
    stopWatch,
  };
}
