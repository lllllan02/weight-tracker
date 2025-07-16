import React from "react";
import { Button } from "antd";
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

  return (
    <div style={{ padding: "16px" }}>
      {/* 年份导航 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          padding: "0 8px",
        }}
      >
        <Button
          type="text"
          size="small"
          onClick={() => {
            const newYear = currentDate.year() - 10;
            setCurrentDate(currentDate.year(newYear));
          }}
          style={{
            fontSize: 12,
            color: "#666",
            padding: "4px 8px",
          }}
        >
          ← 前10年
        </Button>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#333",
            minWidth: "80px",
            textAlign: "center",
          }}
        >
          {currentDate.year() - 5} - {currentDate.year() + 4}
        </span>
        <Button
          type="text"
          size="small"
          onClick={() => {
            const newYear = currentDate.year() + 10;
            setCurrentDate(currentDate.year(newYear));
          }}
          style={{
            fontSize: 12,
            color: "#666",
            padding: "4px 8px",
          }}
        >
          后10年 →
        </Button>
      </div>

      {/* 年份网格 */}
      <div
        style={{
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

      {/* 快速跳转到今年 */}
      <div
        style={{
          marginTop: "16px",
          textAlign: "center",
        }}
      >
        <Button
          type="text"
          size="small"
          onClick={() => {
            setCurrentDate(dayjs());
          }}
          style={{
            fontSize: 12,
            padding: "6px 16px",
            borderRadius: 20,
            background: "#f0f8ff",
            color: "#1677ff",
            border: "1px solid #91d5ff",
            fontWeight: 500,
            transition: "all 0.2s ease",
          }}
        >
          回到今年
        </Button>
      </div>
    </div>
  );
};
