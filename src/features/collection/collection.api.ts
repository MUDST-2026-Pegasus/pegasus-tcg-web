import { api, type PageResponse } from "@/lib/api";

import type { CollectionItem, CollectionPayload, CollectionVariant, PublicCollectionItem } from "./collection.types";

export function getCollection(page: number): Promise<PageResponse<CollectionItem>> {
  return api.get("/collection", { query: { page, size: 20 } });
}

export function getPublicCollection(username: string, page: number): Promise<PageResponse<PublicCollectionItem>> {
  return api.get(`/users/${encodeURIComponent(username)}/collection`, { auth: false, query: { page, size: 20 } });
}

export function getCollectionVariants(productId: number): Promise<CollectionVariant[]> {
  return api.get(`/catalog/products/${productId}/variants`, { auth: false });
}

export function addCollectionItem(payload: CollectionPayload): Promise<CollectionItem> {
  return api.post("/collection", payload);
}

export function updateCollectionItem(id: number, payload: CollectionPayload): Promise<CollectionItem> {
  return api.put(`/collection/${id}`, payload);
}

export function removeCollectionItem(id: number): Promise<void> {
  return api.delete(`/collection/${id}`);
}
