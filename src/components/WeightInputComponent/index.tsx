import React, { useState } from "react";
import { Card, message } from "antd";
import { WeightRecord, CalendarData, ExerciseRecord } from "../../types";
import { generateId } from "../../utils/helpers";
import { addRecord, updateRecord, deleteRecord, addExerciseRecord, updateExerciseRecord, getExerciseRecords } from "../../utils/api";
import dayjs, { Dayjs } from "dayjs";

// 导入子组件
import { CalendarView } from "./CalendarView";
import { DayRecordCard } from "./DayRecordCard";
import { TimeSlot } from "./constants";

interface WeightInputProps {
  onAdd: () => void;
  onExerciseChange: () => void; // 专门用于运动状态变化的回调
  calendarData: CalendarData;
}

export const WeightInput: React.FC<WeightInputProps> = ({
  onAdd,
  onExerciseChange,
  calendarData,
}) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [calendarView, setCalendarView] = useState<"date" | "month" | "year">(
    "date"
  );

  // 打开添加记录弹窗（现在直接在卡片上编辑，这个函数保留用于新增）
  const handleAddRecord = (date: Dayjs, timeSlot: TimeSlot) => {
    setSelectedDate(date);
  };

  // 编辑记录（现在直接在卡片上编辑，这个函数保留用于兼容）
  const handleEditRecord = (date: Dayjs, timeSlot: TimeSlot) => {
    setSelectedDate(date);
  };

  // 处理运动时长变化
  const handleExerciseDurationChange = async (date: Dayjs, duration: number | null) => {
    try {
      // 获取所有运动记录
      const exerciseRecords = await getExerciseRecords();
      const dateKey = date.format("YYYY-MM-DD");
      
      // 查找是否已有该日期的运动记录
      const existingRecord = exerciseRecords.find((record: ExerciseRecord) => 
        new Date(record.date).toISOString().split('T')[0] === dateKey
      );
      
      // 有时长且>0就保存，否则删除
      const hasExercise = duration !== null && duration > 0;
      
      if (existingRecord) {
        // 更新现有运动记录（后端会自动处理删除逻辑）
        await updateExerciseRecord(existingRecord.id, {
          date: date.hour(8).minute(0).second(0).toISOString(),
          duration: duration || 0,
        });
      } else if (hasExercise) {
        // 只有在有运动时长时才创建新记录
        await addExerciseRecord({
          date: date.hour(8).minute(0).second(0).toISOString(),
          duration: duration,
        });
      }

      message.success(hasExercise ? "运动记录保存成功！" : "已清除运动记录");
      
      // 通知父组件重新加载数据
      await onExerciseChange();
    } catch (error) {
      console.error("保存运动记录失败:", error);
      message.error("保存失败，请重试");
    }
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
              onDateSelect={setSelectedDate}
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
            onExerciseDurationChange={handleExerciseDurationChange}
            onDeleteRecord={handleDeleteRecord}
          />
        </div>
      </div>
    </div>
  );
};
