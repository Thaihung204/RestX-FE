import React from "react";

type AddGroupModalProps = {
  open: boolean;
  groupName: string;
  fieldStyle: React.CSSProperties;
  panelStyle: React.CSSProperties;
  onGroupNameChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function AddGroupModal({
  open,
  groupName,
  fieldStyle,
  panelStyle,
  onGroupNameChange,
  onClose,
  onSave,
}: AddGroupModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl p-6" style={panelStyle}>
        <h3 className="text-2xl mb-5" style={{ color: "var(--text)" }}>
          Add Group
        </h3>
        <label
          className="block mb-1.5 text-sm font-medium"
          style={{ color: "var(--text-muted)" }}>
          Group name
        </label>
        <input
          value={groupName}
          onChange={(e) => onGroupNameChange(e.target.value)}
          placeholder="New Group"
          className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20"
          style={fieldStyle}
        />
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
