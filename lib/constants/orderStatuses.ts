export interface MockOrderStatus {
  id: string;
  name: string;
  colorCode: string;
  code: string;
  isDefault: boolean;
}

export const MOCK_ORDER_STATUSES: MockOrderStatus[] = [
  {
    id: "0",
    name: "Open",
    colorCode: "#faad14",
    code: "OPEN",
    isDefault: true,
  },
  {
    id: "1",
    name: "Completed",
    colorCode: "#52c41a",
    code: "COMPLETED",
    isDefault: false,
  },
  {
    id: "2",
    name: "Cancelled",
    colorCode: "#ff4d4f",
    code: "CANCELLED",
    isDefault: false,
  },
];

export const findMockOrderStatusById = (id: string | number) =>
  MOCK_ORDER_STATUSES.find((status) => status.id === String(id));
