import {
    CalendarOutlined,
    CopyOutlined,
    LeftOutlined,
    RightOutlined,
} from "@ant-design/icons";
import {
    addWeeks,
    endOfWeek,
    format,
    isSameWeek,
    startOfWeek,
    subWeeks,
} from "date-fns";
import { useTranslation } from "react-i18next";

interface WeekNavigatorProps {
  currentWeek: Date;
  onWeekChange: (date: Date) => void;
}

export default function WeekNavigator({
  currentWeek,
  onWeekChange,
}: WeekNavigatorProps) {
  const { t } = useTranslation("common");
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const isCurrentWeek = isSameWeek(currentWeek, new Date(), {
    weekStartsOn: 1,
  });

  const handlePrevWeek = () => onWeekChange(subWeeks(currentWeek, 1));
  const handleNextWeek = () => onWeekChange(addWeeks(currentWeek, 1));
  const handleToday = () => onWeekChange(new Date());

  return (
    <div
      className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl shadow-sm transition-all"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}>
      <div className="flex items-center gap-3 mb-4 md:mb-0">
        <div 
          className="flex p-1 rounded-lg border shadow-sm"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-md transition-all hover:shadow-sm"
            style={{ color: "var(--text-muted)" }}
          >
            <LeftOutlined style={{ fontSize: "14px" }} />
          </button>

          <button
            onClick={handleToday}
            disabled={isCurrentWeek}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              isCurrentWeek
                ? "shadow-sm"
                : "hover:shadow-sm"
            }`}
            style={{
              background: isCurrentWeek ? "var(--bg-base)" : "transparent",
              color: isCurrentWeek ? "#ea580c" : "var(--text-muted)", // orange-600
              border: isCurrentWeek ? "1px solid var(--border)" : "none"
            }}
          >
            {t("schedule.week_navigator.today")}
          </button>

          <button
            onClick={handleNextWeek}
            className="p-2 rounded-md transition-all hover:shadow-sm"
            style={{ color: "var(--text-muted)" }}
          >
            <RightOutlined style={{ fontSize: "14px" }} />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 mx-4">
        <h3 className="text-lg md:text-xl font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
          <CalendarOutlined className="text-orange-500" />
          <span>
            {format(weekStart, "MMMM d")}{" "}
            <span className="font-light" style={{ color: "var(--text-muted)" }}>-</span>{" "}
            {format(weekEnd, "MMMM d, yyyy")}
          </span>
        </h3>
        <p className="text-xs font-medium uppercase tracking-wider mt-1 opacity-60" style={{ color: "var(--text-muted)" }}>
          {t("schedule.week_navigator.week")} {format(weekStart, "w")}
        </p>
      </div>

      <div className="flex items-center gap-2 mt-4 md:mt-0">
        <button
          className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm hover:shadow-md active:scale-95"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}>
          <CopyOutlined />
          <span className="hidden sm:inline">
            {t("schedule.week_navigator.copy_previous_week")}
          </span>
        </button>
      </div>
    </div>
  );
}
