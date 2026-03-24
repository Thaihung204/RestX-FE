import axiosInstance from "./axiosInstance";
import { Trigger, TriggerObject, TriggerProperty, TriggerType } from "../types/trigger";

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

export const triggerService = {
  async getTriggerTypes(): Promise<TriggerType[]> {
    const res = await axiosInstance.get("/triggers/types");
    return normalizeArray<TriggerType>(res.data);
  },

  async getTriggers(): Promise<Trigger[]> {
    const res = await axiosInstance.get("/triggers");
    return normalizeArray<Trigger>(res.data);
  },

  async getTriggerObjects(): Promise<TriggerObject[]> {
    const res = await axiosInstance.get("/triggers/objects");
    return normalizeArray<TriggerObject>(res.data);
  },

  async getTriggerObjectProperties(objectId: string | number): Promise<TriggerProperty[]> {
    const res = await axiosInstance.get(`/triggers/objects/${objectId}/properties`);
    return normalizeArray<TriggerProperty>(res.data);
  },
};
