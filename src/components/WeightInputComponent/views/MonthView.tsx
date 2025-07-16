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

  return (
    <div
      style={{
        padding: "16px",
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
                isCurrentMonth ? "#1677ff" : hasRecords ? "#52c41a" : "#f0f0f0"
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
  );
};
