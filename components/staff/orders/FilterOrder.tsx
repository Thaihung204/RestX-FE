import { FileAddOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Select } from "antd";

type FilterOption = {
  value: string;
  label: string;
};

interface FilterOrderProps {
  selectedTableId: string;
  tableFilterOptions: FilterOption[];
  onChangeTable: (value: string) => void;
  onAddItem: () => void;
  disableAddItem?: boolean;
  onCreateOrder: () => void;
  isMobile: boolean;
  isTablet: boolean;
  mode: "light" | "dark";
  t: (key: string, options?: Record<string, unknown>) => string;
}

export default function FilterOrder({
  selectedTableId,
  tableFilterOptions,
  onChangeTable,
  onAddItem,
  disableAddItem = false,
  onCreateOrder,
  isMobile,
  isTablet,
  mode,
  t,
}: FilterOrderProps) {
  const btnHeight = isMobile ? 40 : 48;
  const btnFontSize = isMobile ? 13 : 15;

  return (
    <Card
      style={{
        borderRadius: 12,
        border:
          mode === "dark"
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "1px solid #E5E5E5",
        marginBottom: isMobile ? 16 : 24,
        background: mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "#FFFFFF",
        boxShadow:
          mode === "dark"
            ? "0 2px 8px rgba(0, 0, 0, 0.3)"
            : "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
      styles={{ body: { padding: isMobile ? 16 : "20px 28px" } }}
    >
      <Row gutter={[12, 12]} align="middle">
        {/* Table filter dropdown */}
        <Col xs={24} sm={24} md={13} lg={14} xl={14}>
          <Select
            size={isMobile ? "middle" : "large"}
            style={{ width: "100%", fontSize: isMobile ? 13 : 14 }}
            value={selectedTableId}
            onChange={(value) => onChangeTable(String(value))}
            options={[
              { value: "all", label: t("staff.orders.filter.all_tables") },
              ...tableFilterOptions,
            ]}
          />
        </Col>

        {/* Action buttons */}
        <Col xs={24} sm={24} md={11} lg={10} xl={10}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {/* Create new order button */}
            <Button
              size={isMobile ? "middle" : "large"}
              icon={<FileAddOutlined />}
              onClick={onCreateOrder}
              style={{
                borderRadius: 12,
                height: btnHeight,
                fontWeight: 600,
                fontSize: btnFontSize,
                width: "100%",
              }}
            >
              {t("staff.orders.modal.create_order_short", {
                defaultValue: "Tạo order",
              })}
            </Button>

            {/* Add item to existing order button */}
            <Button
              type="primary"
              size={isMobile ? "middle" : "large"}
              icon={<PlusOutlined />}
              onClick={onAddItem}
              disabled={disableAddItem}
              style={{
                borderRadius: 12,
                height: btnHeight,
                fontWeight: 600,
                fontSize: btnFontSize,
                background: disableAddItem
                  ? undefined
                  : "linear-gradient(135deg, var(--primary) 0%, #FF6B3B 100%)",
                border: "none",
                width: "100%",
              }}
            >
              {t("staff.orders.modal.add_item")}
            </Button>
          </div>
        </Col>
      </Row>
    </Card>
  );
}

