import { PlusOutlined } from "@ant-design/icons";
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
  isMobile: boolean;
  isTablet: boolean;
  mode: "light" | "dark";
  t: (key: string) => string;
}

export default function FilterOrder({
  selectedTableId,
  tableFilterOptions,
  onChangeTable,
  onAddItem,
  disableAddItem = false,
  isMobile,
  isTablet,
  mode,
  t,
}: FilterOrderProps) {
  const selectFontSize = isMobile ? 13 : 14;

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
      styles={{ body: { padding: isMobile ? 16 : "20px 28px" } }}>
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} sm={24} md={18} lg={18} xl={18}>
          <Select
            size={isMobile ? "middle" : "large"}
            style={{ width: "100%", fontSize: selectFontSize }}
            value={selectedTableId}
            onChange={(value) => onChangeTable(String(value))}
            options={[
              { value: "all", label: t("staff.orders.filter.all_tables") },
              ...tableFilterOptions,
            ]}
          />
        </Col>
        <Col xs={24} sm={24} md={6} lg={6} xl={6}>
          <Button
            type="primary"
            size={isMobile ? "middle" : "large"}
            icon={<PlusOutlined />}
            onClick={onAddItem}
            disabled={disableAddItem}
            block={isMobile || isTablet}
            style={{
              borderRadius: 12,
              height: isMobile ? 40 : 48,
              fontWeight: 600,
              fontSize: isMobile ? 14 : 16,
              background: "linear-gradient(135deg, var(--primary) 0%, #FF6B3B 100%)",
              border: "none",
              width: "100%",
            }}>
            {t("staff.orders.modal.add_item")}
          </Button>
        </Col>
      </Row>
    </Card>
  );
}
