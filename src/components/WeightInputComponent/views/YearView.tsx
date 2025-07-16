import React from "react";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { CalendarData } from "../../../types";

interface YearViewProps {
  currentDate: Dayjs;
  setCurrentDate: (date: Dayjs) => void;
  setCalendarView: (view: "date" | "month" | "year") => void;
  calendarData: CalendarData;
}

export const YearView: React.FC<YearViewProps> = ({
  currentDate,
  setCurrentDate,
  setCalendarView,
  calendarData,
}) => {
  const { dayRecords = {} } = calendarData;

  // 切换到前10年
  const goToPreviousDecade = () => {
    const newYear = currentDate.year() - 10;
    setCurrentDate(currentDate.year(newYear));
  };

  // 切换到后10年
  const goToNextDecade = () => {
    const newYear = currentDate.year() + 10;
    setCurrentDate(currentDate.year(newYear));
  };

  // 回到今年
  const goToCurrentYear = () => {
    setCurrentDate(dayjs());
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
          onClick={goToPreviousDecade}
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

        {/* 中间区域：年份范围和回到今年按钮 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* 当前年份范围 */}
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#333",
              textAlign: "center",
            }}
          >
            {currentDate.year() - 5} - {currentDate.year() + 4}
          </div>

          {/* 回到今年按钮 */}
          <button
            onClick={goToCurrentYear}
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
            今年
          </button>
        </div>

        {/* 右箭头 */}
        <button
          onClick={goToNextDecade}
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

      {/* 年份网格 */}
      <div
        style={{
          padding: "8px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        {Array.from({ length: 10 }, (_, i) => {
          const year = currentDate.year() - 5 + i;
          const isCurrentYear = year === dayjs().year();
          const isSelectedYear = year === currentDate.year();
          const hasRecords = Object.keys(dayRecords).some((dateKey) => {
            const date = dayjs(dateKey);
            return date.year() === year;
          });

          return (
            <div
              key={i}
              onClick={() => {
                setCurrentDate(currentDate.year(year));
                setCalendarView("month");
              }}
              style={{
                padding: "16px 8px",
                textAlign: "center",
                borderRadius: 8,
                background: isCurrentYear
                  ? "#e6f7ff"
                  : isSelectedYear
                  ? "#f0f8ff"
                  : hasRecords
                  ? "#f6ffed"
                  : "#fff",
                border: `1px solid ${
                  isCurrentYear
                    ? "#1677ff"
                    : isSelectedYear
                    ? "#91d5ff"
                    : hasRecords
                    ? "#52c41a"
                    : "#f0f0f0"
                }`,
                color: isCurrentYear
                  ? "#1677ff"
                  : isSelectedYear
                  ? "#1677ff"
                  : hasRecords
                  ? "#389e0d"
                  : "#666",
                fontWeight:
                  isCurrentYear || isSelectedYear || hasRecords ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontSize: 14,
                position: "relative",
              }}
            >
              {year}
              {isCurrentYear && (
                <div
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#1677ff",
                    border: "2px solid #fff",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
