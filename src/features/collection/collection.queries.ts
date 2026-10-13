import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import * as collectionApi from "./collection.api";
import type { CollectionPayload } from "./collection.types";

const collectionKey = ["collection"] as const;

export function useCollection() {
  return useInfiniteQuery({
    queryKey: [...collectionKey, "mine"],
    queryFn: ({ pageParam }) => collectionApi.getCollection(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.page + 1 < last.totalPages ? last.page + 1 : undefined,
  });
}

export function usePublicCollection(username: string) {
  return useInfiniteQuery({
    queryKey: [...collectionKey, "public", username],
    queryFn: ({ pageParam }) => collectionApi.getPublicCollection(username, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.page + 1 < last.totalPages ? last.page + 1 : undefined,
    enabled: Boolean(username),
  });
}

function useInvalidateCollection() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: collectionKey });
}

export function useAddCollectionItem() {
  return useMutation({ mutationFn: collectionApi.addCollectionItem, onSuccess: useInvalidateCollection() });
}

export function useAddCollectionItems() {
  return useMutation({ mutationFn: collectionApi.addCollectionItems, onSuccess: useInvalidateCollection() });
}

export function useUpdateCollectionItem() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CollectionPayload }) => collectionApi.updateCollectionItem(id, payload),
    onSuccess: useInvalidateCollection(),
  });
}

export function useRemoveCollectionItem() {
  return useMutation({ mutationFn: collectionApi.removeCollectionItem, onSuccess: useInvalidateCollection() });
}
