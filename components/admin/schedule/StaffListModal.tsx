import { ScheduleCell, Staff } from "@/lib/types/schedule";
import {
    CalendarOutlined,
    DeleteOutlined,
    TeamOutlined,
    UserAddOutlined,
} from "@ant-design/icons";
import {
    Avatar,
    Button,
    Divider,
    Empty,
    Modal,
    Select,
    Tag,
    Typography,
} from "antd";
import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;
const { Option } = Select;

interface StaffListModalProps {
  cell: ScheduleCell;
  onClose: () => void;
  onAddStaff: (cell: ScheduleCell, staffId: string) => void;
  onRemoveStaff: (assignmentId: string) => void;
  availableStaff: Staff[];
}

export default function StaffListModal({
  cell,
  onClose,
  onAddStaff,
  onRemoveStaff,
  availableStaff,
}: StaffListModalProps) {
  const { t } = useTranslation("common");
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(
    undefined,
  );

  const assignedCount = cell.assignments.filter(
    (a) => a.status !== "cancelled",
  ).length;

  const handleAddStaffConfirm = () => {
    if (selectedStaffId) {
      onAddStaff(cell, selectedStaffId);
      setIsAddingStaff(false);
      setSelectedStaffId(undefined);
    }
  };

  // Get available staff (not already assigned to this cell)
  const assignedStaffIds = new Set(cell.assignments.map((a) => a.staffId));
  const staffToAdd = availableStaff.filter((s) => !assignedStaffIds.has(s.id));

  return (
    <Modal
      open={true}
      onCancel={onClose}
      footer={null}
      title={
        <div className="flex items-center gap-3 py-2">
          <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg text-orange-500">
            <CalendarOutlined style={{ fontSize: "20px" }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontSize: "18px" }}>
              {t("schedule.staff_modal.title")}
            </Title>
            <Text type="secondary" className="text-xs font-normal">
              {format(new Date(cell.date), "EEEE, MMMM d, yyyy")}
            </Text>
          </div>
        </div>
      }
      centered
      width={600}
      className="schedule-modal">
      <div className="mt-4">
        {/* Staff Count Section */}
        <div 
          className="p-4 rounded-xl mb-6"
          style={{ background: "var(--surface)" }}
        >
          <div className="flex justify-between items-center">
            <Text
              strong
              className="flex items-center gap-2"
              style={{ color: "var(--text)" }}
            >
              <TeamOutlined /> {t("schedule.staff_modal.assigned_staff")}
            </Text>
            <Tag color="blue">
              {assignedCount}{" "}
              {assignedCount === 1
                ? t("schedule.staff_modal.person")
                : t("schedule.staff_modal.people")}
            </Tag>
          </div>
        </div>

        {/* Staff List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {cell.assignments.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("schedule.staff_modal.no_staff")}
              className="py-8"
            />
          ) : (
            cell.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="group flex items-center justify-between p-3 rounded-xl border hover:shadow-md transition-all"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--card)"
                }}
              >
                <div className="flex items-center gap-4">
                  <Avatar
                    size={42}
                    style={{
                      backgroundColor: "#3b82f6",
                      color: "white",
                    }}>
                    {assignment.staffInitials}
                  </Avatar>
                  <div>
                    <div className="font-semibold" style={{ color: "var(--text)" }}>
                      {assignment.staffName}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          assignment.status === "confirmed"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-blue-500/10 text-blue-600"
                        }`}>
                        {t(`schedule.status.${assignment.status}`)}
                      </span>
                    </div>
                  </div>
                </div>

                {assignment.status !== "cancelled" && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onRemoveStaff(assignment.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                )}
              </div>
            ))
          )}
        </div>

        <Divider style={{ margin: "24px 0" }} />

        {/* Add Staff Section */}
        {isAddingStaff ? (
          <div 
            className="p-4 rounded-xl border border-dashed animate-fadeIn"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)"
            }}
          >
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <UserAddOutlined className="text-orange-500" />{" "}
              {t("schedule.staff_modal.assign_new_staff")}
            </h4>
            <div className="mb-3">
              <Select
                placeholder={t("schedule.staff_modal.select_staff")}
                className="w-full"
                value={selectedStaffId}
                onChange={setSelectedStaffId}
                size="large">
                {staffToAdd.map((staff) => (
                  <Option key={staff.id} value={staff.id}>
                    <div className="flex items-center gap-2">
                      <Avatar
                        size="small"
                        style={{
                          backgroundColor: "#3b82f6",
                          color: "white",
                        }}>
                        {staff.initials}
                      </Avatar>
                      {staff.name}
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setIsAddingStaff(false)}>
                {t("schedule.staff_modal.cancel")}
              </Button>
              <Button
                type="primary"
                onClick={handleAddStaffConfirm}
                disabled={!selectedStaffId}
                className="bg-orange-500 hover:bg-orange-600">
                {t("schedule.staff_modal.assign")}
              </Button>
            </div>
          </div>
        ) : (
          staffToAdd.length > 0 && (
            <Button
              type="dashed"
              block
              size="large"
              icon={<UserAddOutlined />}
              onClick={() => setIsAddingStaff(true)}
              className="h-12 hover:text-orange-500 hover:border-orange-500"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-muted)"
              }}
            >
              {t("schedule.staff_modal.add_staff_assignment")}
            </Button>
          )
        )}
      </div>
    </Modal>
  );
}
