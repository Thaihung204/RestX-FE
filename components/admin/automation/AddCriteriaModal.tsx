import React from "react";

type GroupOption = { label: string; value: string };
type SelectOption = { value: string; label: string };

type AddCriteriaModalProps = {
  open: boolean;
  criteriaPropertyName: string;
  criteriaPropertyValue: string;
  criteriaType: string;
  criteriaLogicType: string;
  criteriaDescription: string;
  criteriaGroups: string[];
  criteriaTypeOptions: SelectOption[];
  logicTypeOptions: SelectOption[];
  groupOptions: GroupOption[];
  fieldStyle: React.CSSProperties;
  panelStyle: React.CSSProperties;
  onCriteriaPropertyNameChange: (value: string) => void;
  onCriteriaPropertyValueChange: (value: string) => void;
  onCriteriaTypeChange: (value: string) => void;
  onCriteriaLogicTypeChange: (value: string) => void;
  onCriteriaDescriptionChange: (value: string) => void;
  onCriteriaGroupsChange: (value: string[]) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function AddCriteriaModal({
  open,
  criteriaPropertyName,
  criteriaPropertyValue,
  criteriaType,
  criteriaLogicType,
  criteriaDescription,
  criteriaGroups,
  criteriaTypeOptions,
  logicTypeOptions,
  groupOptions,
  fieldStyle,
  panelStyle,
  onCriteriaPropertyNameChange,
  onCriteriaPropertyValueChange,
  onCriteriaTypeChange,
  onCriteriaLogicTypeChange,
  onCriteriaDescriptionChange,
  onCriteriaGroupsChange,
  onClose,
  onSave,
}: AddCriteriaModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl p-6" style={panelStyle}>
        <h3 className="text-2xl mb-5" style={{ color: "var(--text)" }}>
          Add Criteria
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ color: "var(--text-muted)" }}>
              Property Name
            </label>
            <input
              value={criteriaPropertyName}
              onChange={(e) => onCriteriaPropertyNameChange(e.target.value)}
              placeholder="OrderStatusId"
              className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
              style={fieldStyle}
            />
          </div>
          <div>
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ color: "var(--text-muted)" }}>
              Property Value
            </label>
            <input
              value={criteriaPropertyValue}
              onChange={(e) => onCriteriaPropertyValueChange(e.target.value)}
              placeholder="Confirmed"
              className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
              style={fieldStyle}
            />
          </div>
          <div>
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ color: "var(--text-muted)" }}>
              Criteria Type
            </label>
            <select
              value={criteriaType}
              onChange={(e) => onCriteriaTypeChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
              style={fieldStyle}>
              {criteriaTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} - {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ color: "var(--text-muted)" }}>
              Logic Type
            </label>
            <select
              value={criteriaLogicType}
              onChange={(e) => onCriteriaLogicTypeChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
              style={fieldStyle}>
              {logicTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value} - {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ color: "var(--text-muted)" }}>
              Computed Description
            </label>
            <input
              value={criteriaDescription}
              onChange={(e) => onCriteriaDescriptionChange(e.target.value)}
              placeholder="Order status changed to Confirmed"
              className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
              style={fieldStyle}
            />
          </div>
          <div className="md:col-span-2">
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ color: "var(--text-muted)" }}>
              Groups
            </label>
            <select
              multiple
              value={criteriaGroups}
              onChange={(e) =>
                onCriteriaGroupsChange(
                  Array.from(e.target.selectedOptions).map((o) => o.value),
                )
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
            onClick={onClose}
            className="px-4 py-2 rounded-lg"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}>
            Close
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 rounded-lg text-white"
            style={{ background: "var(--primary)" }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
