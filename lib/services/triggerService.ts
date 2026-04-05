import { Trigger, TriggerActionType, TriggerObject, TriggerProperty, TriggerType } from "../types/trigger";
import axiosInstance from "./axiosInstance";

const normalizeArray = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const data = (payload as any).data;
    if (Array.isArray(data)) return data as T[];
    const items = (payload as any).items;
    if (Array.isArray(items)) return items as T[];
    const result = (payload as any).result;
    if (Array.isArray(result)) return result as T[];
  }
  return [];
};

const normalizeObject = <T,>(payload: unknown): T | null => {
  if (!payload) return null;
  if (typeof payload === "object") {
    const data = (payload as any).data;
    if (data && typeof data === "object") return data as T;
    const result = (payload as any).result;
    if (result && typeof result === "object") return result as T;
    return payload as T;
  }
  return null;
};

export const triggerService = {
  async getTriggerTypes(): Promise<TriggerType[]> {
    const res = await axiosInstance.get("/triggers/types");
    return normalizeArray<TriggerType>(res.data);
  },

  async getTriggerActionTypes(): Promise<TriggerActionType[]> {
    const res = await axiosInstance.get("/triggers/actions/types");
    return normalizeArray<TriggerActionType>(res.data);
  },

  async createTriggerObject(payload: unknown) {
    const res = await axiosInstance.post("/triggers/objects", payload);
    return res.data;
  },

  async getTriggers(): Promise<Trigger[]> {
    const res = await axiosInstance.get("/triggers");
    return normalizeArray<Trigger>(res.data);
  },

  async getTriggerObjects(): Promise<TriggerObject[]> {
    const res = await axiosInstance.get("/triggers/objects");
    return normalizeArray<TriggerObject>(res.data);
  },

  async getTriggerById(id: string | number) {
    const res = await axiosInstance.get(`/triggers/${id}`);
    return normalizeObject<Record<string, any>>(res.data);
  },

  async updateTriggerById(id: string | number, payload: unknown) {
    const res = await axiosInstance.put(`/triggers/${id}`, payload);
    return res.data;
  },

  async deleteTriggerById(id: string | number) {
    const res = await axiosInstance.delete(`/triggers/${id}`);
    return res.data;
  },

  async getTriggerObjectProperties(objectId: string | number): Promise<TriggerProperty[]> {
    const res = await axiosInstance.get(`/triggers/objects/${objectId}/properties`);
    return normalizeArray<TriggerProperty>(res.data);
  },
};
