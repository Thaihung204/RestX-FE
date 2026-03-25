"use client";

import { triggerService } from "@/lib/services/triggerService";
import { Trigger, TriggerObject } from "@/lib/types/trigger";
import { EditOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Select, Space, Switch, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const toLabel = (item: any, fallback: string) =>
  item?.displayName || item?.name || item?.code || item?.value || fallback;

type TriggerListItem = {
  id: string;
  live: boolean;
  name: string;
  triggerObjectId?: string;
  objectName: string;
  description: string;
};

export default function AutomationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [triggerObjects, setTriggerObjects] = useState<TriggerObject[]>([]);
  const [triggerList, setTriggerList] = useState<TriggerListItem[]>([]);
  const [listFilterObject, setListFilterObject] = useState<string>("all");

  const mapTriggerObjectName = (
    trigger: Trigger,
    objects: TriggerObject[]
  ): string => {
    const objectId = String(trigger.triggerObjectId ?? trigger.objectId ?? "");
    const object = objects.find(
      (obj) => String(obj.id ?? obj.code ?? "") === objectId
    );
    return object ? toLabel(object, "Unknown Object") : "Unknown Object";
  };

  const fetchTriggerData = async () => {
    setLoading(true);
    try {
      const [objects, triggers] = await Promise.all([
        triggerService.getTriggerObjects(),
        triggerService.getTriggers(),
      ]);

      setTriggerObjects(objects);
      setTriggerList(
        triggers.map((trigger, index) => {
          const objectId = String(trigger.triggerObjectId ?? trigger.objectId ?? "");
          return {
            id: String(trigger.id ?? `trigger-${index}`),
            live:
              typeof trigger.isActive === "boolean"
                ? trigger.isActive
                : String(trigger.status ?? "").toLowerCase() === "active",
            name: trigger.name || `Trigger ${index + 1}`,
            triggerObjectId: objectId,
            objectName: mapTriggerObjectName(trigger, objects),
            description: trigger.description || "",
          };
        })
      );
    } catch (error) {
      console.error("Failed to load triggers:", error);
      setTriggerObjects([]);
      setTriggerList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriggerData();
  }, []);

  const objectOptions = useMemo(
    () =>
      triggerObjects.map((item, index) => ({
        label: toLabel(item, `Object ${index + 1}`),
        value: String(item.id ?? item.code ?? `object-${index}`),
      })),
    [triggerObjects]
  );

  const filteredTriggers = useMemo(() => {
    if (listFilterObject === "all") return triggerList;
    return triggerList.filter((item) => item.triggerObjectId === listFilterObject);
  }, [listFilterObject, triggerList]);

  const listColumns: ColumnsType<TriggerListItem> = [
    {
      title: "Live",
      dataIndex: "live",
      key: "live",
      width: 80,
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.live}
          onChange={(checked) => {
            setTriggerList((prev) =>
              prev.map((item) =>
                item.id === record.id ? { ...item, live: checked } : item
              )
            );
          }}
        />
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 320,
      render: (value: string) => (
        <Typography.Text style={{ color: "var(--text)" }} strong>
          {value}
        </Typography.Text>
      ),
    },
    {
      title: "Object",
      dataIndex: "objectName",
      key: "objectName",
      width: 180,
      render: (value: string) => <Tag color="processing">{value}</Tag>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (value: string) => (
        <Typography.Text style={{ color: "var(--text-muted)" }}>
          {value}
        </Typography.Text>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 100,
      align: "right",
      render: (_, record) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => router.push(`/admin/automation/new?triggerId=${record.id}`)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-base)]">
      <main className="flex-1 px-6 lg:px-8 py-6 overflow-y-auto">
        <div className="space-y-5 w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <Typography.Title level={2} style={{ margin: 0, color: "var(--text)" }}>
                Trigger Manager
              </Typography.Title>
              <Typography.Text style={{ color: "var(--text-muted)" }}>
                View and manage your restaurant automation triggers.
              </Typography.Text>
            </div>
            <Space wrap>
              <Button icon={<ReloadOutlined />} onClick={fetchTriggerData} loading={loading}>
                Reload Metadata
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push("/admin/automation/new")}>
                Add Trigger
              </Button>
            </Space>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <Select
              className="w-full md:w-72"
              value={listFilterObject}
              options={[{ label: "Filter by Object", value: "all" }, ...objectOptions]}
              onChange={setListFilterObject}
            />
            <Tag color="default">{filteredTriggers.length} triggers</Tag>
          </div>

          <Table
            rowKey="id"
            columns={listColumns}
            dataSource={filteredTriggers}
            loading={loading}
            size="middle"
            scroll={{ x: 980 }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            className="admin-tenants-table"
            style={{ background: "transparent" }}
          />
        </div>
      </main>
    </div>
  );
}
