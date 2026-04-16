"use client";

interface StatusToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export default function StatusToggle({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
}: StatusToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`relative inline-flex items-center flex-shrink-0 transition-colors duration-200 ease-out focus:outline-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: checked ? "#22c55e" : "#d1d5db",
      }}>
      <span
        className="absolute pointer-events-none"
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          top: 3,
          left: 3,
          background: "#ffffff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          transform: checked ? "translateX(20px)" : "translateX(0)",
          transition: "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      />
    </button>
  );
}