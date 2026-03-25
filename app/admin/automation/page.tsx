"use client";

import { AdminSelect } from "@/components/ui/AdminSelect";
import { triggerService } from "@/lib/services/triggerService";
import { Trigger, TriggerObject } from "@/lib/types/trigger";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Space, Switch, Tag, Typography } from "antd";
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
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push("/admin/automation/new")}>
                Add Trigger
              </Button>
            </Space>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <AdminSelect
              containerClassName="w-full md:w-72"
              value={listFilterObject}
              onChange={(e) => setListFilterObject(e.target.value)}
            >
              <option value="all">Filter by Object</option>
              {objectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </AdminSelect>
            <Tag color="default">{filteredTriggers.length} triggers</Tag>
          </div>

          <div className="rounded-lg overflow-hidden" style={{ background: "var(--bg-surface)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--bg-base)", borderBottom: "2px solid var(--border)" }}>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                      Live
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                      Name
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                      Object
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                      Description
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTriggers.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        background: "var(--bg-surface)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <td className="px-6 py-4">
                        <Switch
                          size="small"
                          checked={item.live}
                          onChange={(checked) => {
                            setTriggerList((prev) =>
                              prev.map((trigger) =>
                                trigger.id === item.id ? { ...trigger, live: checked } : trigger
                              )
                            );
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold" style={{ color: "var(--text)" }}>
                            {item.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p style={{ color: "var(--text)" }}>{item.objectName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p style={{ color: "var(--text-secondary)" }}>{item.description || "-"}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => router.push(`/admin/automation/new?triggerId=${item.id}`)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTriggers.length === 0 && !loading && (
              <div className="text-center py-12">
                <p style={{ color: "var(--text-secondary)" }}>No triggers found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
