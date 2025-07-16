import React, { useState } from "react";
import { Card, Form, message } from "antd";
import { WeightRecord, UserProfile, CalendarData, ExerciseRecord } from "../../types";
import { generateId } from "../../utils/helpers";
import { addRecord, updateRecord, updateProfile, deleteRecord, addExerciseRecord, updateExerciseRecord, getExerciseRecords } from "../../utils/api";
import dayjs, { Dayjs } from "dayjs";

// 导入子组件
import { CalendarView } from "./CalendarView";
import { DayRecordCard } from "./DayRecordCard";
import { SettingsModal } from "./SettingsModal";
import { CalendarHeader } from "./CalendarHeader";
import { TIME_SLOTS, TimeSlot } from "./constants";

interface WeightInputProps {
  onAdd: () => void;
  onExerciseChange: () => void; // 专门用于运动状态变化的回调
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  calendarData: CalendarData;
}

export const WeightInput: React.FC<WeightInputProps> = ({
  onAdd,
  onExerciseChange,
  profile,
  onProfileChange,
  calendarData,
}) => {
  const [settingsForm] = Form.useForm();
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
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

  // 处理运动状态变化
  const handleExerciseChange = async (date: Dayjs, exercise: boolean) => {
    try {
      setLoading(true);
      
      // 获取所有运动记录
      const exerciseRecords = await getExerciseRecords();
      const dateKey = date.format("YYYY-MM-DD");
      
      // 查找是否已有该日期的运动记录
      const existingRecord = exerciseRecords.find((record: ExerciseRecord) => 
        new Date(record.date).toISOString().split('T')[0] === dateKey
      );
      
      if (existingRecord) {
        // 更新现有运动记录
        await updateExerciseRecord(existingRecord.id, {
          date: date.hour(8).minute(0).second(0).toISOString(),
          exercise: exercise,
        });
      } else {
        // 创建新的运动记录
        await addExerciseRecord({
          date: date.hour(8).minute(0).second(0).toISOString(),
          exercise: exercise,
        });
      }

      message.success(exercise ? "已标记为运动日" : "已取消运动标记");
      onExerciseChange(); // 通知父组件重新加载数据
    } catch (error) {
      console.error("更新运动状态失败:", error);
      message.error("更新运动状态失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 保存记录（直接在卡片上编辑）
  const handleSaveRecord = async (date: Dayjs, timeSlot: TimeSlot, weight: number, fasting: boolean) => {
    try {
      setLoading(true);
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
          fasting: fasting ? "空腹" : "非空腹",
        };

        await updateRecord(existingRecord.id, updatedRecord);
        message.success("记录更新成功！");
      } else {
        // 新增记录
        const record: WeightRecord = {
          id: generateId(),
          date: recordDate.toISOString(),
          weight: weight,
          fasting: fasting ? "空腹" : "非空腹",
        };

        await addRecord(record);
        message.success("记录添加成功！");
      }

      onAdd(); // 通知父组件重新加载数据
    } catch (error) {
      console.error("保存记录失败:", error);
      message.error("保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // 取消编辑，不需要特殊处理
  };

  // 删除记录
  const handleDeleteRecord = async (date: Dayjs, timeSlot: TimeSlot) => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };



  // 设置相关函数
  const handleSettingsSave = async () => {
    try {
      const values = await settingsForm.validateFields();
      const newProfile: UserProfile = {
        ...profile,
        height: values.height,
        targetWeight: values.targetWeight || undefined,
      };
      await updateProfile(newProfile);
      onProfileChange(newProfile);
      setIsSettingsModalVisible(false);
      message.success("设置保存成功！");
    } catch (error) {
      console.error("保存设置失败:", error);
      message.error("保存设置失败");
    }
  };

  const handleSettingsCancel = () => {
    settingsForm.resetFields();
    setIsSettingsModalVisible(false);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* 左侧日历 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Card
            title={
              <CalendarHeader
                calendarView={calendarView}
                setCalendarView={setCalendarView}
                onSettingsClick={() => setIsSettingsModalVisible(true)}
              />
            }
            style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            styles={{ body: { padding: 0, border: "none" } }}
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
        <div style={{ width: 260, flexShrink: 0 }}>
          <DayRecordCard
            selectedDate={selectedDate}
            calendarData={calendarData}
            onAddRecord={handleAddRecord}
            onEditRecord={handleEditRecord}
            onSaveRecord={handleSaveRecord}
            onCancelEdit={handleCancelEdit}
            onExerciseChange={handleExerciseChange}
            onDeleteRecord={handleDeleteRecord}
          />
        </div>
      </div>



      {/* 设置弹窗 */}
      <SettingsModal
        isVisible={isSettingsModalVisible}
        onOk={handleSettingsSave}
        onCancel={handleSettingsCancel}
        profile={profile}
        form={settingsForm}
      />
    </div>
  );
};
