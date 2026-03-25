import React from "react";

type GroupOption = { label: string; value: string };

type AddActionModalProps = {
  open: boolean;
  actionName: string;
  actionType: string;
  actionCustomProperties: string;
  actionGroups: string[];
  groupOptions: GroupOption[];
  fieldStyle: React.CSSProperties;
  panelStyle: React.CSSProperties;
  onActionNameChange: (value: string) => void;
  onActionTypeChange: (value: string) => void;
  onActionCustomPropertiesChange: (value: string) => void;
  onActionGroupsChange: (value: string[]) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function AddActionModal({
  open,
  actionName,
  actionType,
  actionCustomProperties,
  actionGroups,
  groupOptions,
  fieldStyle,
  panelStyle,
  onActionNameChange,
  onActionTypeChange,
  onActionCustomPropertiesChange,
  onActionGroupsChange,
  onClose,
  onSave,
}: AddActionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl p-6" style={panelStyle}>
        <h3 className="text-2xl mb-5" style={{ color: "var(--text)" }}>
          Add Action
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ color: "var(--text-muted)" }}>
              Action
            </label>
            <input
              value={actionName}
              onChange={(e) => onActionNameChange(e.target.value)}
              placeholder="CascadePendingToPreparing"
              className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
              style={fieldStyle}
            />
          </div>
          <div>
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ color: "var(--text-muted)" }}>
              Type
            </label>
            <input
              type="number"
              min={0}
              value={actionType}
              onChange={(e) => onActionTypeChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
              style={fieldStyle}
            />
          </div>
          <div>
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ color: "var(--text-muted)" }}>
              Groups
            </label>
            <select
              multiple
              value={actionGroups}
              onChange={(e) =>
                onActionGroupsChange(
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
          <div className="md:col-span-2">
            <label
              className="block mb-1.5 text-sm font-medium"
              style={{ color: "var(--text-muted)" }}>
              Custom Properties (JSON)
            </label>
            <textarea
              value={actionCustomProperties}
              onChange={(e) => onActionCustomPropertiesChange(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all resize-none"
              style={fieldStyle}
            />
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
