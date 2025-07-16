import React from "react";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { CalendarData } from "../../../types";

interface MonthViewProps {
  currentDate: Dayjs;
  setCurrentDate: (date: Dayjs) => void;
  setCalendarView: (view: "date" | "month" | "year") => void;
  calendarData: CalendarData;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  setCurrentDate,
  setCalendarView,
  calendarData,
}) => {
  const { dayRecords = {} } = calendarData;

  // 切换到上一年
  const goToPreviousYear = () => {
    setCurrentDate(currentDate.subtract(1, "year"));
  };

  // 切换到下一年
  const goToNextYear = () => {
    setCurrentDate(currentDate.add(1, "year"));
  };

  // 回到当前月份
  const goToCurrentMonth = () => {
    const today = dayjs();
    setCurrentDate(today);
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: 8,
        border: "none",
      }}
    >
      {/* 头部导航 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          marginBottom: 8,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        {/* 左箭头 */}
        <button
          onClick={goToPreviousYear}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            color: "#666",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f5f5f5";
            e.currentTarget.style.color = "#333";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#666";
          }}
        >
          ←
        </button>

        {/* 中间区域：年份和回到当前月份按钮 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* 当前年份 */}
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#333",
              textAlign: "center",
            }}
          >
            {currentDate.format("YYYY年")}
          </div>

          {/* 回到当前月份按钮 */}
          <button
            onClick={goToCurrentMonth}
            style={{
              background: "#1890ff",
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#fff",
              transition: "all 0.2s ease",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#40a9ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1890ff";
            }}
          >
            本月
          </button>
        </div>

        {/* 右箭头 */}
        <button
          onClick={goToNextYear}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            color: "#666",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f5f5f5";
            e.currentTarget.style.color = "#333";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#666";
          }}
        >
          →
        </button>
      </div>

      {/* 月份网格 */}
      <div
        style={{
          padding: "8px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        {Array.from({ length: 12 }, (_, i) => {
          const month = dayjs().month(i);
          const isCurrentMonth = month.month() === currentDate.month();
          const hasRecords = Object.keys(dayRecords).some((dateKey) => {
            const date = dayjs(dateKey);
            return date.month() === i && date.year() === currentDate.year();
          });

          return (
            <div
              key={i}
              onClick={() => {
                setCurrentDate(currentDate.month(i));
                setCalendarView("date");
              }}
              style={{
                padding: "16px 8px",
                textAlign: "center",
                borderRadius: 8,
                background: isCurrentMonth
                  ? "#e6f7ff"
                  : hasRecords
                  ? "#f6ffed"
                  : "#fff",
                border: `1px solid ${
                  isCurrentMonth
                    ? "#1677ff"
                    : hasRecords
                    ? "#52c41a"
                    : "#f0f0f0"
                }`,
                color: isCurrentMonth
                  ? "#1677ff"
                  : hasRecords
                  ? "#389e0d"
                  : "#666",
                fontWeight: isCurrentMonth || hasRecords ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontSize: 14,
              }}
            >
              {month.format("MMM")}
            </div>
          );
        })}
      </div>
    </div>
  );
};
