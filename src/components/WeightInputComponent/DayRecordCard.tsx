import React, { useState, useEffect, useRef } from "react";
import { Card, Tag, InputNumber } from "antd";
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
  onExerciseDurationChange: (date: Dayjs, duration: number | null) => void;
  onDeleteRecord: (date: Dayjs, timeSlot: TimeSlot) => void;
}

export const DayRecordCard: React.FC<DayRecordCardProps> = ({
  selectedDate,
  calendarData,
  onAddRecord,
  onEditRecord,
  onSaveRecord,
  onCancelEdit,
  onExerciseDurationChange,
  onDeleteRecord,
}) => {
  const { dayRecords = {}, exerciseRecords = {} } = calendarData;
  const [exerciseDuration, setExerciseDuration] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // 当选中日期或日历数据变化时，更新输入框的值
  useEffect(() => {
    const dateKey = selectedDate.format("YYYY-MM-DD");
    const data = exerciseRecords[dateKey];
    const duration = data?.duration || null;
    setExerciseDuration(duration);
  }, [selectedDate, exerciseRecords]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // 处理运动时长变化（带防抖）
  const handleDurationChange = (value: number | null) => {
    setExerciseDuration(value);
    setIsSaving(true);
    
    // 清除之前的定时器
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // 设置新的定时器，1000ms 后保存
    saveTimerRef.current = setTimeout(async () => {
      try {
        await onExerciseDurationChange(selectedDate, value);
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  };

  return (
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
      }}
      styles={{ body: { padding: "16px 12px" } }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

        {/* 运动时长输入 */}
        <div
          style={{
            border: exerciseDuration && exerciseDuration > 0 ? "2px solid #52c41a" : "1px dashed #d9d9d9",
            borderRadius: 12,
            background: exerciseDuration && exerciseDuration > 0 ? "#f6ffed" : "#fafbfc",
            padding: "16px",
            textAlign: "center",
            position: "relative",
            minHeight: 60,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "all 0.3s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#52c41a" }}>
              🏃‍♂️ 运动时长（分钟）
            </span>
            {isSaving && (
              <span style={{ fontSize: 12, color: "#999" }}>保存中...</span>
            )}
          </div>
          <InputNumber
            value={exerciseDuration}
            onChange={handleDurationChange}
            placeholder="输入分钟数"
            min={0}
            max={1440}
            precision={0}
            style={{
              width: "100%",
              borderRadius: 8,
              height: 36,
              fontSize: 16,
            }}
            controls={false}
          />
        </div>
      </div>
    </Card>
  );
};
