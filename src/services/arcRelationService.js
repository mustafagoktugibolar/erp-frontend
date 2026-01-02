import { api } from "../api";

export const getRelations = async (sourceType, sourceId) => {
  const params = {};
  if (sourceType) params.sourceType = sourceType;
  if (sourceId) params.sourceId = sourceId;
  const response = await api.get("/relations", { params });
  return response.data;
};

export const createRelation = async (payload) => {
  // payload: { sourceType, sourceId, targetType, targetId, relationType, settings }
  const response = await api.post("/relations", payload);
  return response.data;
};

export const deleteRelation = async (id) => {
  await api.delete(`/relations/${id}`);
};

export const updateRelation = async (id, payload) => {
  const response = await api.put(`/relations/${id}`, payload);
  return response.data;
};
