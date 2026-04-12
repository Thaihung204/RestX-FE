"use client";

import { useState } from "react";

interface StatusToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * A beautiful, animated SQUARE status toggle switch.
 * - Green when active, red when inactive.
 * - Squared corners for a modern, industrial feel.
 */
export default function StatusToggle({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
}: StatusToggleProps) {
  const [isHovered, setIsHovered] = useState(false);

  const activeColor = "#22c55e";
  const inactiveColor = "#ef4444";
  const currentColor = checked ? activeColor : inactiveColor;

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative inline-flex items-center flex-shrink-0 cursor-pointer transition-all duration-300 ease-out ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      style={{
        width: 68,
        height: 40,
        borderRadius: 8,
        backgroundColor: currentColor,
        boxShadow:
          isHovered && !disabled
            ? `0 0 14px ${
                checked ? "rgba(34,197,94,0.45)" : "rgba(239,68,68,0.45)"
              }, inset 0 1px 3px rgba(0,0,0,0.12)`
            : "inset 0 1px 3px rgba(0,0,0,0.12)",
      }}
    >
      {/* Track shine overlay */}
      <span
        className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
        style={{
          borderRadius: 7,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 60%)",
          opacity: isHovered ? 1 : 0.7,
        }}
      />

      {/* Thumb */}
      <span
        className="absolute pointer-events-none"
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          top: 4,
          left: 4,
          background: "linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          transform: checked ? "translateX(28px)" : "translateX(0)",
          transition: "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      />
    </button>
  );
}