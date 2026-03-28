import { forwardRef } from "react";

type AdminSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  containerClassName?: string;
};

const baseSelectClassName =
  "w-full px-4 py-2.5 pr-10 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-orange-500/20 appearance-none";

  const baseStyle: React.CSSProperties = {
    background: "var(--surface)",
    borderColor: "var(--border)",
    color: "var(--text)",
    cursor: "pointer",
  };

const iconStyle: React.CSSProperties = {
  color: "var(--text-muted)",
};

export const AdminSelect = forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({ className = "", style, containerClassName = "", children, ...props }, ref) => {
    return (
      <div className={`relative ${containerClassName}`.trim()}>
        <select
          ref={ref}
          className={`${baseSelectClassName} ${className}`.trim()}
          style={{ ...baseStyle, ...style }}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5"
            style={iconStyle}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    );
  }
);

AdminSelect.displayName = "AdminSelect";
