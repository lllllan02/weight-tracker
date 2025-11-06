import React from "react";
import { Card, Tag } from "antd";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { WeightRecord, CalendarData } from "../../types";
import { TIME_SLOTS, TimeSlot } from "./constants";
import { TimeSlotCard } from "./TimeSlotCard";

interface DayRecordCardProps {
  selectedDate: Dayjs;
  calendarData: CalendarData;
  onAddRecord: (date: Dayjs, timeSlot: TimeSlot) => void;
  onEditRecord: (date: Dayjs, timeSlot: TimeSlot) => void;
  onSaveRecord: (date: Dayjs, timeSlot: TimeSlot, weight: number) => void;
  onCancelEdit: () => void;
  onDeleteRecord: (date: Dayjs, timeSlot: TimeSlot) => void;
}

export const DayRecordCard: React.FC<DayRecordCardProps> = ({
  selectedDate,
  calendarData,
  onAddRecord,
  onEditRecord,
  onSaveRecord,
  onCancelEdit,
  onDeleteRecord,
}) => {
  const { dayRecords = {} } = calendarData;

  // 检查某个时间段是否已有记录
  const hasRecord = (date: Dayjs, timeSlot: TimeSlot): boolean => {
    const dateKey = date.format("YYYY-MM-DD");
    return !!dayRecords[dateKey]?.[timeSlot.key];
  };

  // 获取某个时间段的记录
  const getRecord = (date: Dayjs, timeSlot: TimeSlot) => {
    const dateKey = date.format("YYYY-MM-DD");
    return dayRecords[dateKey]?.[timeSlot.key] as WeightRecord | undefined;
  };

  return (
    <>
    <Card
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>
              {selectedDate.format("MM月DD日")}
            </span>
            <span style={{ fontSize: 14, color: "#666", fontWeight: 500 }}>
              {selectedDate.format("dddd")}
            </span>
          </div>
          {selectedDate.isSame(dayjs(), "day") && (
            <Tag
              color="#1677ff"
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 12,
                border: "none",
                background: "#e6f7ff",
                color: "#1677ff",
                fontWeight: 600,
              }}
            >
              今天
            </Tag>
          )}
        </div>
      }
      style={{
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        border: selectedDate.isSame(dayjs(), "day")
          ? "2px solid #1677ff"
          : "1px solid #f0f0f0",
        background: "#fff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
      styles={{ 
        body: { padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column" },
        header: { padding: "12px 16px", minHeight: "auto" }
      }}
    >
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 8,
        flex: 1
      }}>
        {TIME_SLOTS.map((slot) => {
          const hasRecordForSlot = hasRecord(selectedDate, slot);
          const record = getRecord(selectedDate, slot);

          return (
            <TimeSlotCard
              key={slot.key}
              slot={slot}
              selectedDate={selectedDate}
              hasRecord={hasRecordForSlot}
              record={record}
              onAddRecord={onAddRecord}
              onEditRecord={onEditRecord}
              onSaveRecord={onSaveRecord}
              onCancelEdit={onCancelEdit}
              onDeleteRecord={onDeleteRecord}
            />
          );
        })}
      </div>
    </Card>
    </>
  );
};
