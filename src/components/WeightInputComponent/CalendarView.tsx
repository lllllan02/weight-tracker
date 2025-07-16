import React from "react";
import { Dayjs } from "dayjs";
import { CalendarData } from "../../types";
import { DateView } from "./views/DateView";
import { MonthView } from "./views/MonthView";
import { YearView } from "./views/YearView";

interface CalendarViewProps {
  currentDate: Dayjs;
  setCurrentDate: (date: Dayjs) => void;
  calendarView: "date" | "month" | "year";
  setCalendarView: (view: "date" | "month" | "year") => void;
  calendarData: CalendarData;
  onDateSelect: (date: Dayjs) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  setCurrentDate,
  calendarView,
  setCalendarView,
  calendarData,
  onDateSelect,
}) => {
  return (
    <>
      {calendarView === "date" ? (
        <DateView
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          calendarData={calendarData}
          onDateSelect={onDateSelect}
        />
      ) : calendarView === "month" ? (
        <MonthView
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          setCalendarView={setCalendarView}
          calendarData={calendarData}
        />
      ) : (
        <YearView
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          setCalendarView={setCalendarView}
          calendarData={calendarData}
        />
      )}
    </>
  );
};
