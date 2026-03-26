"use client";

import { AdminSelect } from "@/components/ui/AdminSelect";
import { triggerService } from "@/lib/services/triggerService";
import { Trigger, TriggerObject } from "@/lib/types/trigger";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Button, Space, Switch, Tag, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const router = useRouter();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [triggerObjects, setTriggerObjects] = useState<TriggerObject[]>([]);
  const [triggerList, setTriggerList] = useState<TriggerListItem[]>([]);
  const [listFilterObject, setListFilterObject] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mapTriggerObjectName = (
    trigger: Trigger,
    objects: TriggerObject[]
  ): string => {
    const objectId = String(trigger.triggerObjectId ?? trigger.objectId ?? "");
    const object = objects.find(
      (obj) => String(obj.id ?? obj.code ?? "") === objectId
    );
    return object
      ? toLabel(object, t("automation.fallback.unknown_object"))
      : t("automation.fallback.unknown_object");
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
            name: trigger.name || t("automation.fallback.trigger_name", { index: index + 1 }),
            triggerObjectId: objectId,
            objectName: mapTriggerObjectName(trigger, objects),
            description: trigger.description || "",
          };
        })
      );
    } catch (error) {
      console.error(t("automation.logs.fetch_triggers_failed"), error);
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
        label: toLabel(
          item,
          t("automation.fallback.object_name", { index: index + 1 })
        ),
        value: String(item.id ?? item.code ?? `object-${index}`),
      })),
    [triggerObjects]
  );

  const filteredTriggers = useMemo(() => {
    if (listFilterObject === "all") return triggerList;
    return triggerList.filter((item) => item.triggerObjectId === listFilterObject);
  }, [listFilterObject, triggerList]);

  const handleDeleteTrigger = async (triggerId: string) => {
    try {
      setDeletingId(triggerId);
      await triggerService.deleteTriggerById(triggerId);
      setTriggerList((prev) => prev.filter((item) => item.id !== triggerId));
      message.success(t("automation.messages.delete_success"));
    } catch (error) {
      console.error(t("automation.logs.delete_trigger_failed"), error);
      message.error(t("automation.messages.delete_failed"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-base)]">
      <main className="flex-1 px-6 lg:px-8 py-6 overflow-y-auto">
        <div className="space-y-5 w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <Typography.Title level={2} style={{ margin: 0, color: "var(--text)" }}>
                {t("automation.page.title")}
              </Typography.Title>
              <Typography.Text style={{ color: "var(--text-muted)" }}>
                {t("automation.page.subtitle")}
              </Typography.Text>
            </div>
            <Space wrap>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push("/admin/automation/new")}>
                {t("automation.actions.add_trigger")}
              </Button>
            </Space>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <AdminSelect
              containerClassName="w-full md:w-72"
              value={listFilterObject}
              onChange={(e) => setListFilterObject(e.target.value)}
            >
              <option value="all">{t("automation.filter.by_object")}</option>
              {objectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </AdminSelect>
            <Tag color="default">
              {t("automation.summary.total_triggers", { count: filteredTriggers.length })}
            </Tag>
          </div>

          <div className="rounded-lg overflow-hidden" style={{ background: "var(--bg-surface)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--bg-base)", borderBottom: "2px solid var(--border)" }}>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {t("automation.table.live")}
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {t("automation.table.name")}
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {t("automation.table.object")}
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {t("automation.table.description")}
                    </th>
                    <th className="text-center px-6 py-4 text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {t("automation.table.actions")}
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
                        <p style={{ color: "var(--text-secondary)" }}>
                          {item.description || t("automation.fallback.empty_description")}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Space size={8} className="w-full justify-center">
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => router.push(`/admin/automation/new?triggerId=${item.id}`)}
                          >
                            {t("automation.actions.edit")}
                          </Button>
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            loading={deletingId === item.id}
                            onClick={() => {
                              modal.confirm({
                                title: t("automation.actions.delete_confirm_title"),
                                content: t("automation.actions.delete_confirm_description", {
                                  name: item.name,
                                }),
                                okText: t("automation.actions.delete_confirm_ok"),
                                okType: "danger",
                                cancelText: t("automation.actions.delete_confirm_cancel"),
                                onOk: async () => {
                                  await handleDeleteTrigger(item.id);
                                },
                              });
                            }}
                          >
                            {t("automation.actions.delete")}
                          </Button>
                        </Space>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTriggers.length === 0 && !loading && (
              <div className="text-center py-12">
                <p style={{ color: "var(--text-secondary)" }}>
                  {t("automation.empty.no_triggers")}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
