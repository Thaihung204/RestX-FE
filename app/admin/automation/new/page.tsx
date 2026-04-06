"use client";

import { DropDown } from "@/components/ui/DropDown";
import { triggerService } from "@/lib/services/triggerService";
import { App } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type TriggerGroup = { id: string; name: string };
type TriggerAction = {
  id: string;
  type: number;
  action: string;
  customProperties: Record<string, unknown>;
  groups: string[];
};
type TriggerCriteria = {
  id: string;
  type: number;
  logicType: number;
  propertyName: string;
  propertyValue: string;
  computedDescription: string;
  groups: string[];
};

const CRITERIA_TYPE_OPTIONS = [
  { value: "0", key: "any_property_change" },
  { value: "1", key: "specific_property_new_value" },
  { value: "2", key: "specific_property_old_value" },
  { value: "3", key: "specific_property_value" },
  { value: "4", key: "specific_property_value_not_equals" },
  { value: "5", key: "is_greater_than" },
  { value: "6", key: "is_less_than" },
  { value: "7", key: "is_updated" },
  { value: "8", key: "contains" },
];

const LOGIC_TYPE_OPTIONS = [
  { value: "0", key: "and" },
  { value: "1", key: "or" },
];

const makeId = () => Math.random().toString(36).slice(2, 10);

const fieldStyle: React.CSSProperties = {
  background: "var(--surface)",
  borderColor: "var(--border)",
  color: "var(--text)",
};

const panelStyle: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
};

export default function NewAutomationTriggerPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const triggerId = searchParams.get("triggerId");
  const isEditMode = Boolean(triggerId);

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("");
  const [triggerObjectId, setTriggerObjectId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  const [typeOptions, setTypeOptions] = useState<{ label: string; value: string }[]>([]);
  const [objectOptions, setObjectOptions] = useState<{ label: string; value: string }[]>([]);
  const [actionTypeOptions, setActionTypeOptions] = useState<{ label: string; value: string }[]>([]);

  const [groups, setGroups] = useState<TriggerGroup[]>([]);
  const [actions, setActions] = useState<TriggerAction[]>([]);
  const [criteria, setCriteria] = useState<TriggerCriteria[]>([]);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [actionType, setActionType] = useState("0");
  const [actionName, setActionName] = useState("");
  const [actionCustomProperties, setActionCustomProperties] = useState('{"newItemStatusId":35}');
  const [actionGroups, setActionGroups] = useState<string[]>([]);

  const [criteriaType, setCriteriaType] = useState("1");
  const [criteriaLogicType, setCriteriaLogicType] = useState("0");
  const [criteriaPropertyName, setCriteriaPropertyName] = useState("");
  const [criteriaPropertyValue, setCriteriaPropertyValue] = useState("");
  const [criteriaDescription, setCriteriaDescription] = useState("");
  const [criteriaGroups, setCriteriaGroups] = useState<string[]>([]);

  const getCriteriaTypeLabel = (value: number) => {
    const match = CRITERIA_TYPE_OPTIONS.find((item) => Number(item.value) === value);
    return match
      ? t(`automation.new.criteria_type_options.${match.key}`)
      : String(value);
  };

  const getLogicTypeLabel = (value: number) => {
    const match = LOGIC_TYPE_OPTIONS.find((item) => Number(item.value) === value);
    return match
      ? t(`automation.new.logic_type_options.${match.key}`)
      : String(value);
  };

  useEffect(() => {
    const loadMeta = async () => {
      setLoadingMeta(true);
      try {
        const [types, objects, actionTypes] = await Promise.all([
          triggerService.getTriggerTypes(),
          triggerService.getTriggerObjects(),
          triggerService.getTriggerActionTypes(),
        ]);

        const mappedTypes = types.map((x, index) => ({
          label:
            x.displayName ||
            x.name ||
            x.code ||
            t("automation.new.fallback.type_name", { index: index + 1 }),
          value: String(x.id ?? x.value ?? index + 1),
        }));

        const mappedObjects = objects.map((x, index) => ({
          label:
            x.displayName ||
            x.name ||
            x.code ||
            t("automation.new.fallback.object_name", { index: index + 1 }),
          value: String(x.id ?? x.code ?? index + 1),
        }));

        const mappedActionTypes = actionTypes.map((x, index) => ({
          label:
            x.displayName ||
            x.name ||
            x.code ||
            t("automation.new.fallback.type_name", { index: index + 1 }),
          value: String(x.id ?? x.value ?? index + 1),
        }));

        setTypeOptions(mappedTypes);
        setObjectOptions(mappedObjects);
        setActionTypeOptions(mappedActionTypes);

        if (mappedTypes.length > 0) setType((prev) => prev || mappedTypes[0].value);
        if (mappedObjects.length > 0) setTriggerObjectId((prev) => prev || mappedObjects[0].value);
        if (mappedActionTypes.length > 0) setActionType((prev) => prev || mappedActionTypes[0].value);
      } catch (error) {
        console.error(error);
        message.error(t("automation.new.messages.load_metadata_failed"));
      } finally {
        setLoadingMeta(false);
      }
    };

    loadMeta();
  }, [message, t]);

  const groupOptions = useMemo(
    () => groups.map((g) => ({ label: g.name, value: g.id })),
    [groups]
  );

  useEffect(() => {
    const loadTriggerDetail = async () => {
      if (!triggerId) return;
      setLoadingMeta(true);
      try {
        const detail = await triggerService.getTriggerById(triggerId);
        if (!detail) {
          message.error(t("automation.new.messages.trigger_not_found"));
          router.push("/admin/automation");
          return;
        }

        setName(String(detail.name ?? ""));
        setDescription(String(detail.description ?? ""));
        setType(String(detail.type ?? detail.triggerType ?? ""));
        setTriggerObjectId(String(detail.triggerObjectId ?? detail.objectId ?? ""));
        setIsActive(Boolean(detail.isActive ?? (String(detail.status ?? "").toLowerCase() === "active")));

        const mappedGroups = Array.isArray(detail.groups)
          ? detail.groups.map((g: any, index: number) => ({
              id: String(g?.id ?? g?.groupId ?? `group-${index + 1}`),
              name:
                String(g?.name ?? g?.displayName ?? "") ||
                t("automation.new.fallback.group_name", { index: index + 1 }),
            }))
          : [];

        const mappedActions = Array.isArray(detail.actions)
          ? detail.actions.map((a: any, index: number) => ({
              id: String(a?.id ?? `action-${index + 1}`),
              type: Number(a?.type ?? 0),
              action:
                String(a?.action ?? a?.name ?? "") ||
                t("automation.new.fallback.action_name", { index: index + 1 }),
              customProperties:
                a?.customProperties && typeof a.customProperties === "object"
                  ? a.customProperties
                  : {},
              groups: Array.isArray(a?.groups)
                ? a.groups.map((groupId: any) => String(groupId))
                : [],
            }))
          : [];

        const mappedCriteria = Array.isArray(detail.criteria)
          ? detail.criteria.map((c: any, index: number) => ({
              id: String(c?.id ?? `criteria-${index + 1}`),
              type: Number(c?.type ?? 0),
              logicType: Number(c?.logicType ?? 0),
              propertyName: String(c?.propertyName ?? ""),
              propertyValue: String(c?.propertyValue ?? ""),
              computedDescription: String(c?.computedDescription ?? ""),
              groups: Array.isArray(c?.groups)
                ? c.groups.map((groupId: any) => String(groupId))
                : [],
            }))
          : [];

        setGroups(mappedGroups);
        setActions(mappedActions);
        setCriteria(mappedCriteria);
      } catch (error) {
        console.error(error);
        message.error(t("automation.new.messages.load_detail_failed"));
      } finally {
        setLoadingMeta(false);
      }
    };

    loadTriggerDetail();
  }, [triggerId, message, router, t]);

  const handleAddGroup = () => {
    const normalized = groupName.trim();
    if (!normalized) return;
    setGroups((prev) => [...prev, { id: makeId(), name: normalized }]);
    setGroupName("");
    setShowGroupModal(false);
  };

  const handleRemoveGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setActions((prev) => prev.map((a) => ({ ...a, groups: a.groups.filter((id) => id !== groupId) })));
    setCriteria((prev) => prev.map((c) => ({ ...c, groups: c.groups.filter((id) => id !== groupId) })));
  };

  const handleSaveAction = () => {
    if (!actionName.trim()) return;

    let parsed: Record<string, unknown> = {};
    try {
      parsed = actionCustomProperties.trim() ? JSON.parse(actionCustomProperties) : {};
    } catch {
      message.error(t("automation.new.messages.invalid_json"));
      return;
    }

    setActions((prev) => [
      ...prev,
      {
        id: makeId(),
        type: Number(actionType || 0),
        action: actionName.trim(),
        customProperties: parsed,
        groups: actionGroups,
      },
    ]);

    setActionType("0");
    setActionName("");
    setActionCustomProperties('{"newItemStatusId":35}');
    setActionGroups([]);
    setShowActionModal(false);
  };

  const handleSaveCriteria = () => {
    if (!criteriaPropertyName.trim() || !criteriaPropertyValue.trim()) return;

    setCriteria((prev) => [
      ...prev,
      {
        id: makeId(),
        type: Number(criteriaType || 0),
        logicType: Number(criteriaLogicType || 0),
        propertyName: criteriaPropertyName.trim(),
        propertyValue: criteriaPropertyValue.trim(),
        computedDescription: criteriaDescription.trim(),
        groups: criteriaGroups,
      },
    ]);

    setCriteriaType("1");
    setCriteriaLogicType("0");
    setCriteriaPropertyName("");
    setCriteriaPropertyValue("");
    setCriteriaDescription("");
    setCriteriaGroups([]);
    setShowCriteriaModal(false);
  };

  const handleSubmitTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type || !triggerObjectId) return;

    const payload = {
      name: name.trim(),
      description: description.trim(),
      type: Number(type),
      triggerObjectId: Number(triggerObjectId),
      isActive,
      actions: actions.map((a) => ({
        type: a.type,
        action: a.action,
        customProperties: a.customProperties,
        groups: a.groups,
      })),
      criteria: criteria.map((c) => ({
        type: c.type,
        logicType: c.logicType,
        propertyName: c.propertyName,
        propertyValue: c.propertyValue,
        computedDescription: c.computedDescription,
        groups: c.groups,
      })),
      groups: groups.map((g) => ({ id: g.id, name: g.name })),
    };

    try {
      setSubmitting(true);
      if (isEditMode && triggerId) {
        await triggerService.updateTriggerById(triggerId, payload);
        message.success(t("automation.new.messages.update_success"));
      } else {
        await triggerService.createTriggerObject(payload);
        message.success(t("automation.new.messages.create_success"));
      }
      router.push("/admin/automation");
    } catch (error) {
      console.error(error);
      message.error(
        isEditMode
          ? t("automation.new.messages.update_failed")
          : t("automation.new.messages.create_failed")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-base)]">
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push("/admin/automation")}
              className="flex items-center gap-2 mb-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: "var(--text)" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("automation.new.actions.back_to_list")}
            </button>
            <h2 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
              {isEditMode
                ? t("automation.new.page.edit_title")
                : t("automation.new.page.create_title")}
            </h2>
          </div>

          <form onSubmit={handleSubmitTrigger} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <section className="rounded-xl p-6 shadow-sm" style={panelStyle}>
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <span className="w-1 h-5 rounded-full" style={{ background: "var(--primary)" }} />
                  {t("automation.new.sections.basic_information")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      {t("automation.new.fields.name")}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder={t("automation.new.placeholders.name")}
                      className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                      style={fieldStyle}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      {t("automation.new.fields.description")}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder={t("automation.new.placeholders.description")}
                      className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20 resize-none"
                      style={fieldStyle}
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      {t("automation.new.fields.type")}
                    </label>
                    <DropDown
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      style={fieldStyle}
                      disabled={loadingMeta}>
                      {typeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </DropDown>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                      {t("automation.new.fields.trigger_object")}
                    </label>
                    <DropDown
                      value={triggerObjectId}
                      onChange={(e) => setTriggerObjectId(e.target.value)}
                      style={fieldStyle}
                      disabled={loadingMeta}>
                      {objectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </DropDown>
                  </div>
                </div>
              </section>

              <section className="rounded-xl p-6 shadow-sm" style={panelStyle}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text)" }}>
                    <span className="w-1 h-5 rounded-full" style={{ background: "var(--primary)" }} />
                    {t("automation.new.sections.criteria")}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowGroupModal(true)}
                      className="px-3 py-2 rounded-lg text-sm font-semibold"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                      + {t("automation.new.actions.group")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCriteriaModal(true)}
                      className="px-3 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: "var(--primary)", color: "#fff" }}>
                      + {t("automation.new.actions.criteria")}
                    </button>
                  </div>
                </div>
                {criteria.length === 0 ? (
                  <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "#67b9d9", color: "white" }}>
                    {t("automation.new.empty.no_criteria")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {criteria.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg p-4 border"
                        style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 text-sm" style={{ color: "var(--text)" }}>
                            <p>
                              <b>{t("automation.new.fields.property_name")}:</b> {item.propertyName}
                            </p>
                            <p>
                              <b>{t("automation.new.fields.criteria_type")}:</b> {getCriteriaTypeLabel(item.type)} |{" "}
                              <b>{t("automation.new.fields.logic_type")}:</b> {getLogicTypeLabel(item.logicType)}
                            </p>
                            <p>
                              <b>{t("automation.new.fields.property_value")}:</b> {item.propertyValue}
                            </p>
                            <p>
                              <b>{t("automation.new.fields.computed_description")}:</b>{" "}
                              {item.computedDescription || t("automation.fallback.empty_description")}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCriteria((prev) => prev.filter((x) => x.id !== item.id))}
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              color: "#dc2626",
                              border: "1px solid rgba(239,68,68,0.3)",
                            }}>
                            {t("automation.new.actions.remove")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl p-6 shadow-sm" style={panelStyle}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text)" }}>
                    <span className="w-1 h-5 rounded-full" style={{ background: "var(--primary)" }} />
                    {t("automation.new.sections.actions")}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowActionModal(true)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ background: "var(--primary)", color: "#fff" }}>
                    + {t("automation.new.actions.action")}
                  </button>
                </div>
                {actions.length === 0 ? (
                  <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "#67b9d9", color: "white" }}>
                    {t("automation.new.empty.no_actions")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actions.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg p-4 border"
                        style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 text-sm" style={{ color: "var(--text)" }}>
                            <p>
                              <b>{t("automation.new.fields.action")}:</b> {item.action}
                            </p>
                            <p>
                              <b>{t("automation.new.fields.type")}:</b> {item.type}
                            </p>
                            <p>
                              <b>{t("automation.new.fields.custom_properties")}:</b> {JSON.stringify(item.customProperties)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActions((prev) => prev.filter((x) => x.id !== item.id))}
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              color: "#dc2626",
                              border: "1px solid rgba(239,68,68,0.3)",
                            }}>
                            {t("automation.new.actions.remove")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <section className="rounded-xl p-6 shadow-sm" style={panelStyle}>
                <h3 className="text-lg font-semibold mb-5 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <span className="w-1 h-5 rounded-full" style={{ background: "var(--primary)" }} />
                  {t("automation.new.sections.form_actions")}
                </h3>
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={submitting || loadingMeta}
                    className="w-full py-2.5 rounded-lg font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    style={{ background: submitting ? "#999" : "var(--primary)", color: "#fff" }}>
                    {submitting
                      ? isEditMode
                        ? t("automation.new.actions.updating")
                        : t("automation.new.actions.creating")
                      : isEditMode
                      ? t("automation.new.actions.update_trigger")
                      : t("automation.new.actions.create_trigger")}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/admin/automation")}
                    className="w-full py-2.5 rounded-lg font-medium transition-all"
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                    }}>
                    {t("automation.new.actions.cancel")}
                  </button>
                </div>
              </section>

              <section className="rounded-xl p-6 shadow-sm" style={panelStyle}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <span className="w-1 h-5 rounded-full" style={{ background: "var(--primary)" }} />
                  {t("automation.new.sections.status")}
                </h3>
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--surface)" }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                      {isActive
                        ? t("automation.new.status.active")
                        : t("automation.new.status.inactive")}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {isActive
                        ? t("automation.new.status.active_help")
                        : t("automation.new.status.inactive_help")}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                      style={{ background: isActive ? "var(--primary)" : "#4b5563" }}
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-xl p-6 shadow-sm" style={panelStyle}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <span className="w-1 h-5 rounded-full" style={{ background: "var(--primary)" }} />
                  {t("automation.new.sections.groups")}
                </h3>
                {groups.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {t("automation.new.empty.no_groups")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border"
                        style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                        <span className="text-sm" style={{ color: "var(--text)" }}>
                          {group.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGroup(group.id)}
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            background: "rgba(239,68,68,0.1)",
                            color: "#dc2626",
                            border: "1px solid rgba(239,68,68,0.3)",
                          }}>
                          {t("automation.new.actions.remove")}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </form>
        </div>
      </main>

      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl p-6" style={panelStyle}>
            <h3 className="text-2xl mb-5" style={{ color: "var(--text)" }}>
              {t("automation.new.modals.add_group_title")}
            </h3>
            <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              {t("automation.new.fields.group_name")}
            </label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t("automation.new.placeholders.group_name")}
              className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
              style={fieldStyle}
            />
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 rounded-lg"
                style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)" }}>
                {t("automation.new.actions.close")}
              </button>
              <button
                type="button"
                onClick={handleAddGroup}
                className="px-4 py-2 rounded-lg"
                style={{ background: "var(--primary)", color: "#fff" }}>
                {t("automation.new.actions.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-xl p-6" style={panelStyle}>
            <h3 className="text-2xl mb-5" style={{ color: "var(--text)" }}>
              {t("automation.new.modals.add_action_title")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {t("automation.new.fields.action")}
                </label>
                <input
                  value={actionName}
                  onChange={(e) => setActionName(e.target.value)}
                  placeholder={t("automation.new.placeholders.action")}
                  className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {t("automation.new.fields.type")}
                </label>
                {actionTypeOptions.length > 0 ? (
                  <DropDown
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    style={fieldStyle}>
                    {actionTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </DropDown>
                ) : (
                  <input
                    type="number"
                    min={0}
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                    style={fieldStyle}
                  />
                )}
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {t("automation.new.fields.groups")}
                </label>
                <select
                  multiple
                  value={actionGroups}
                  onChange={(e) =>
                    setActionGroups(Array.from(e.target.selectedOptions).map((o) => o.value))
                  }
                  className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all"
                  style={{ ...fieldStyle, minHeight: 100 }}>
                  {groupOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {t("automation.new.fields.custom_properties_json")}
                </label>
                <textarea
                  value={actionCustomProperties}
                  onChange={(e) => setActionCustomProperties(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all resize-none"
                  style={fieldStyle}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 rounded-lg"
                style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)" }}>
                {t("automation.new.actions.close")}
              </button>
              <button
                type="button"
                onClick={handleSaveAction}
                className="px-4 py-2 rounded-lg"
                style={{ background: "var(--primary)", color: "#fff" }}>
                {t("automation.new.actions.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCriteriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-xl p-6" style={panelStyle}>
            <h3 className="text-2xl mb-5" style={{ color: "var(--text)" }}>
              {t("automation.new.modals.add_criteria_title")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {t("automation.new.fields.property_name")}
                </label>
                <input
                  value={criteriaPropertyName}
                  onChange={(e) => setCriteriaPropertyName(e.target.value)}
                  placeholder={t("automation.new.placeholders.property_name")}
                  className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {t("automation.new.fields.property_value")}
                </label>
                <input
                  value={criteriaPropertyValue}
                  onChange={(e) => setCriteriaPropertyValue(e.target.value)}
                  placeholder={t("automation.new.placeholders.property_value")}
                  className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {t("automation.new.fields.criteria_type")}
                </label>
                <select
                  value={criteriaType}
                  onChange={(e) => setCriteriaType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                  style={fieldStyle}>
                  {CRITERIA_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value} - {t(`automation.new.criteria_type_options.${opt.key}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {t("automation.new.fields.logic_type")}
                </label>
                <select
                  value={criteriaLogicType}
                  onChange={(e) => setCriteriaLogicType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                  style={fieldStyle}>
                  {LOGIC_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value} - {t(`automation.new.logic_type_options.${opt.key}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {t("automation.new.fields.computed_description")}
                </label>
                <input
                  value={criteriaDescription}
                  onChange={(e) => setCriteriaDescription(e.target.value)}
                  placeholder={t("automation.new.placeholders.computed_description")}
                  className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
                  style={fieldStyle}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {t("automation.new.fields.groups")}
                </label>
                <select
                  multiple
                  value={criteriaGroups}
                  onChange={(e) =>
                    setCriteriaGroups(Array.from(e.target.selectedOptions).map((o) => o.value))
                  }
                  className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all"
                  style={{ ...fieldStyle, minHeight: 100 }}>
                  {groupOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowCriteriaModal(false)}
                className="px-4 py-2 rounded-lg"
                style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)" }}>
                {t("automation.new.actions.close")}
              </button>
              <button
                type="button"
                onClick={handleSaveCriteria}
                className="px-4 py-2 rounded-lg"
                style={{ background: "var(--primary)", color: "#fff" }}>
                {t("automation.new.actions.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
