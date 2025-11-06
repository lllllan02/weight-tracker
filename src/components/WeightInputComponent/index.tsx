import React, { useState } from "react";
import { Card, message } from "antd";
import { WeightRecord, CalendarData } from "../../types";
import { generateId } from "../../utils/helpers";
import { addRecord, updateRecord, deleteRecord } from "../../utils/api";
import dayjs, { Dayjs } from "dayjs";

// 导入子组件
import { CalendarView } from "./CalendarView";
import { DayRecordCard } from "./DayRecordCard";
import { TimeSlot } from "./constants";

interface WeightInputProps {
  onAdd: () => void;
  calendarData: CalendarData;
  onDateSelect?: (date: Dayjs) => void; // 日期选择回调
}

export const WeightInput: React.FC<WeightInputProps> = ({
  onAdd,
  calendarData,
  onDateSelect: onDateSelectProp,
}) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [calendarView, setCalendarView] = useState<"date" | "month" | "year">(
    "date"
  );

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
    if (onDateSelectProp) {
      onDateSelectProp(date);
    }
  };

  // 打开添加记录弹窗（现在直接在卡片上编辑，这个函数保留用于新增）
  const handleAddRecord = (date: Dayjs, timeSlot: TimeSlot) => {
    setSelectedDate(date);
  };

  // 编辑记录（现在直接在卡片上编辑，这个函数保留用于兼容）
  const handleEditRecord = (date: Dayjs, timeSlot: TimeSlot) => {
    setSelectedDate(date);
  };

  // 保存记录（直接在卡片上编辑）
  const handleSaveRecord = async (date: Dayjs, timeSlot: TimeSlot, weight: number) => {
    try {
      const recordDate = date.hour(timeSlot.hour).minute(timeSlot.minute).second(0);
      
      // 检查是否已有记录
      const { dayRecords = {} } = calendarData;
      const dateKey = date.format("YYYY-MM-DD");
      const existingRecord = dayRecords[dateKey]?.[timeSlot.key];

      if (existingRecord) {
        // 更新现有记录
        const updatedRecord: WeightRecord = {
          ...existingRecord,
          date: recordDate.toISOString(),
          weight: weight,
          fasting: "空腹", // 默认为空腹
        };

        await updateRecord(existingRecord.id, updatedRecord);
        message.success("记录更新成功！");
      } else {
        // 新增记录
        const record: WeightRecord = {
          id: generateId(),
          date: recordDate.toISOString(),
          weight: weight,
          fasting: "空腹", // 默认为空腹
        };

        await addRecord(record);
        message.success("记录添加成功！");
      }

      onAdd(); // 通知父组件重新加载数据
    } catch (error) {
      console.error("保存记录失败:", error);
      message.error("保存失败，请重试");
    }
  };

  const handleCancelEdit = () => {
    // 取消编辑，不需要特殊处理
  };

  // 删除记录
  const handleDeleteRecord = async (date: Dayjs, timeSlot: TimeSlot) => {
    try {
      const { dayRecords = {} } = calendarData;
      const dateKey = date.format("YYYY-MM-DD");
      const existingRecord = dayRecords[dateKey]?.[timeSlot.key];

      if (existingRecord) {
        await deleteRecord(existingRecord.id);
        message.success("记录删除成功！");
        onAdd(); // 通知父组件重新加载数据
      }
    } catch (error) {
      console.error("删除记录失败:", error);
      message.error("删除失败，请重试");
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex" }}>
      <div style={{ width: "100%", display: "flex", gap: 20, alignItems: "stretch" }}>
        {/* 左侧日历 */}
        <div style={{ flex: 1, minWidth: 450, display: "flex", flexDirection: "column" }}>
          <Card
            style={{ 
              borderRadius: 12, 
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              height: "100%",
              display: "flex",
              flexDirection: "column"
            }}
            styles={{ body: { padding: 0, border: "none", flex: 1 } }}
          >
            <CalendarView
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              calendarView={calendarView}
              setCalendarView={setCalendarView}
              calendarData={calendarData}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          </Card>
        </div>

        {/* 右侧当天记录 */}
        <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <DayRecordCard
            selectedDate={selectedDate}
            calendarData={calendarData}
            onAddRecord={handleAddRecord}
            onEditRecord={handleEditRecord}
            onSaveRecord={handleSaveRecord}
            onCancelEdit={handleCancelEdit}
            onDeleteRecord={handleDeleteRecord}
          />
        </div>
      </div>
    </div>
  );
};
