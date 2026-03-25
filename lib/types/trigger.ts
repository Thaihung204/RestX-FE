export type TriggerPrimitiveId = string | number;

export interface TriggerType {
  id?: TriggerPrimitiveId;
  name?: string;
  code?: string;
  value?: string;
  displayName?: string;
}

export interface TriggerObject {
  id?: TriggerPrimitiveId;
  name?: string;
  code?: string;
  displayName?: string;
}

export interface TriggerProperty {
  id?: TriggerPrimitiveId;
  name?: string;
  displayName?: string;
  code?: string;
  dataType?: string;
  type?: string;
  operators?: string[];
}

export interface Trigger {
  id?: TriggerPrimitiveId;
  name?: string;
  description?: string;
  triggerObjectId?: TriggerPrimitiveId;
  objectId?: TriggerPrimitiveId;
  isActive?: boolean;
  status?: string;
}
