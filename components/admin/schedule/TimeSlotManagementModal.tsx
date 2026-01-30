"use client";

import { TimeSlot } from "@/lib/types/schedule";
import { ClockCircleOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, message, Modal, Popconfirm, TimePicker } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

interface TimeSlotManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeSlots: TimeSlot[];
  onUpdateSlots: (slots: TimeSlot[]) => void;
}

export default function TimeSlotManagementModal({
  isOpen,
  onClose,
  timeSlots,
  onUpdateSlots,
}: TimeSlotManagementModalProps) {
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddStart = () => {
    setEditingId("new");
    form.resetFields();
  };

  const handleSave = (values: any) => {
    const newSlot: TimeSlot = {
      id: editingId === "new" ? `slot-${Date.now()}` : editingId!,
      // label: values.label,
      startTime: values.timeRange[0].format("HH:mm"),
      endTime: values.timeRange[1].format("HH:mm"),
    };

    if (editingId === "new") {
      onUpdateSlots([...timeSlots, newSlot]);
      message.success("Time slot added");
    } else {
      onUpdateSlots(
        timeSlots.map((slot) => (slot.id === editingId ? newSlot : slot))
      );
      message.success("Time slot updated");
    }
    
    setEditingId(null);
    form.resetFields();
  };

  const handleDelete = (id: string) => {
    onUpdateSlots(timeSlots.filter((slot) => slot.id !== id));
    message.success("Time slot deleted");
  };

  const handleEdit = (slot: TimeSlot) => {
    setEditingId(slot.id);
    form.setFieldsValue({
      // label: slot.label,
      timeRange: [
        dayjs(slot.startTime, "HH:mm"),
        dayjs(slot.endTime, "HH:mm"),
      ],
    });
  };

  return (
    <Modal
      title="Manage Time Slots"
      open={isOpen}
      onCancel={() => {
        setEditingId(null);
        onClose();
      }}
      footer={null}
      destroyOnHidden={true} 
      centered
      className="timeslot-modal"
    >
      <div className="space-y-4 pt-4">
        {editingId ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{}}
            onValuesChange={(changedValues) => {
              if (changedValues.timeRange) {
                const [start, end] = changedValues.timeRange;
                if (start && end) {
                  // Format logic: if minutes are 0, just show Hour + 'h', else show HH:mm
                  const startStr = start.minute() === 0 ? start.format('H[h]') : start.format('HH:mm');
                  const endStr = end.minute() === 0 ? end.format('H[h]') : end.format('HH:mm');
                  const autoLabel = `${startStr} - ${endStr}`;
                  form.setFieldValue("label", autoLabel);
                }
              }
            }}
            className="p-5 rounded-xl border animate-fadeIn"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)"
            }}
          >
            <Form.Item
              name="label"
              label="Label (Auto-generated)"
              rules={[{ required: true, message: "Please enter a label" }]}
            >
              <Input placeholder="e.g. 7h - 9h" size="large" />
            </Form.Item>
            <Form.Item
              name="timeRange"
              label="Time Range"
              rules={[{ required: true, message: "Please select time range" }]}
            >
              <TimePicker.RangePicker format="HH:mm" className="w-full" size="large" />
            </Form.Item>
            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={() => setEditingId(null)} size="large">Cancel</Button>
              <Button type="primary" htmlType="submit" size="large" className="bg-orange-500 hover:bg-orange-600">
                Save Changes
              </Button>
            </div>
          </Form>
        ) : (
          <Button
            type="dashed"
            block
            size="large"
            icon={<PlusOutlined />}
            onClick={handleAddStart}
            className="mb-6 h-12 hover:text-orange-500 hover:border-orange-500"
            style={{
               color: "var(--text-muted)",
               borderColor: "var(--border)"
            }}
          >
            Add New Time Slot
          </Button>
        )}

        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
          {timeSlots.map((slot) => (
            <div
              key={slot.id}
              className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-sm`}
              style={{
                borderColor: editingId === slot.id ? "#f97316" : "var(--border)", // orange-500
                backgroundColor: editingId === slot.id ? "rgba(249, 115, 22, 0.1)" : "var(--card)"
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors`}
                  style={{
                    backgroundColor: editingId === slot.id ? "rgba(249, 115, 22, 0.2)" : "var(--surface)",
                    color: editingId === slot.id ? "#ea580c" : "var(--text-muted)" // orange-600
                  }}
                >
                  <ClockCircleOutlined className="text-lg" />
                </div>
                <div>
                  <p className="font-medium text-sm mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>
                    {slot.startTime} - {slot.endTime}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  type="text"
                  className="text-orange-600 hover:bg-orange-50"
                  onClick={() => handleEdit(slot)}
                  disabled={editingId !== null}
                >
                  Edit
                </Button>
                
                <div className="w-px h-4 mx-1" style={{ background: "var(--border)" }} />
                
                <Popconfirm
                  title="Delete this slot?"
                  description="This will affect existing schedules."
                  onConfirm={() => handleDelete(slot.id)}
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                  disabled={editingId !== null}
                >
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    disabled={editingId !== null}
                    className="hover:bg-red-50"
                  />
                </Popconfirm>
              </div>
            </div>
          ))}
          
          {timeSlots.length === 0 && (
            <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
              <ClockCircleOutlined className="text-4xl opacity-20 mb-3" />
              <p>No time slots configured</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
