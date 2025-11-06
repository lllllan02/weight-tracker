import React from "react";
import { Calendar, Button } from "antd";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { CalendarData } from "../../../types";

interface DateViewProps {
  currentDate: Dayjs;
  setCurrentDate: (date: Dayjs) => void;
  calendarData: CalendarData;
  onDateSelect: (date: Dayjs) => void;
  calendarView: "date" | "month" | "year";
  setCalendarView: (view: "date" | "month" | "year") => void;
  selectedDate?: Dayjs;
}

export const DateView: React.FC<DateViewProps> = ({
  currentDate,
  setCurrentDate,
  calendarData,
  onDateSelect,
  calendarView,
  setCalendarView,
  selectedDate,
}) => {
  const { dayRecords = {}, exerciseRecords = {} } = calendarData;

  // 获取当天的早上和睡前体重
  const getDayWeights = (date: Dayjs) => {
    const dateKey = date.format("YYYY-MM-DD");
    const dayData = dayRecords[dateKey];
    if (!dayData) return null;

    // 获取早上和睡前的记录
    const morningRecord = dayData.morning;
    const nightRecord = dayData.night;

    return {
      morning: morningRecord?.weight || null,
      night: nightRecord?.weight || null,
      hasAnyRecord: !!(morningRecord || nightRecord),
    };
  };

  // 获取当天的运动状态
  const getExerciseData = (date: Dayjs) => {
    const dateKey = date.format("YYYY-MM-DD");
    const data = exerciseRecords[dateKey];
    if (!data) {
      return { exercise: false, duration: undefined };
    }
    return data;
  };

  // 切换到上个月
  const goToPreviousMonth = () => {
    setCurrentDate(currentDate.subtract(1, "month"));
  };

  // 切换到下个月
  const goToNextMonth = () => {
    setCurrentDate(currentDate.add(1, "month"));
  };

  // 回到今天
  const goToToday = () => {
    console.log("回到今天按钮被点击");
    const today = dayjs();
    console.log("目标日期:", today.format("YYYY-MM-DD"));
    console.log("当前日历日期:", currentDate.format("YYYY-MM-DD"));
    setCurrentDate(today);
    // 同时更新选中的日期，这样右侧面板也会更新
    onDateSelect(today);
  };

  // 自定义头部渲染
  const customHeaderRender = () => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          marginBottom: 4,
        }}
      >
        {/* 左箭头 */}
        <button
          onClick={goToPreviousMonth}
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

        {/* 中间区域：视图切换 + 月份 + 今天按钮 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          {/* 视图切换按钮组 */}
          <div
            style={{
              display: "flex",
              border: "1px solid #d9d9d9",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <Button
              type={calendarView === "date" ? "primary" : "default"}
              size="small"
              onClick={() => setCalendarView("date")}
              style={{
                borderRadius: 0,
                border: "none",
                background: calendarView === "date" ? "#1677ff" : "#fff",
                color: calendarView === "date" ? "#fff" : "#666",
                transition: "all 0.2s ease",
                height: 24,
                padding: "0 8px",
                fontSize: 12,
              }}
            >
              日期
            </Button>
            <Button
              type={calendarView === "month" ? "primary" : "default"}
              size="small"
              onClick={() => setCalendarView("month")}
              style={{
                borderRadius: 0,
                border: "none",
                background: calendarView === "month" ? "#1677ff" : "#fff",
                color: calendarView === "month" ? "#fff" : "#666",
                transition: "all 0.2s ease",
                height: 24,
                padding: "0 8px",
                fontSize: 12,
              }}
            >
              月份
            </Button>
            <Button
              type={calendarView === "year" ? "primary" : "default"}
              size="small"
              onClick={() => setCalendarView("year")}
              style={{
                borderRadius: 0,
                border: "none",
                background: calendarView === "year" ? "#1677ff" : "#fff",
                color: calendarView === "year" ? "#fff" : "#666",
                transition: "all 0.2s ease",
                height: 24,
                padding: "0 8px",
                fontSize: 12,
              }}
            >
              年份
            </Button>
          </div>

          {/* 当前月份和年份 */}
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#333",
              textAlign: "center",
            }}
          >
            {currentDate.format("YYYY年M月")}
          </div>

          {/* 回到今天按钮 */}
          <button
            onClick={goToToday}
            style={{
              background: "#1890ff",
              border: "none",
              cursor: "pointer",
              padding: "0 8px",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#fff",
              transition: "all 0.2s ease",
              fontWeight: 500,
              height: 24,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#40a9ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1890ff";
            }}
          >
            今天
          </button>
        </div>

        {/* 右箭头 */}
        <button
          onClick={goToNextMonth}
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
    );
  };

  // 渲染整个日期单元格
  const dateFullCellRender = (date: Dayjs) => {
    const dayWeights = getDayWeights(date);
    const isToday = date.isSame(dayjs(), "day");
    const isSelected = selectedDate ? date.isSame(selectedDate, "day") : false;
    const hasRecord = dayWeights?.hasAnyRecord || false;
    const exerciseData = getExerciseData(date);
    const hasExercise = exerciseData.exercise;
    const isCurrentMonth = date.month() === currentDate.month();

    // 根据状态确定样式 - 现代简洁配色
    let backgroundColor = "#fff";
    let borderColor = "transparent";
    let textColor = "#d9d9d9";
    let fontWeight = 400;
    let boxShadow = "none";

    if (isToday) {
      // 今天：蓝色强调
      backgroundColor = "#1890ff";
      borderColor = "#1890ff";
      textColor = "#fff";
      fontWeight = 600;
      boxShadow = "0 2px 8px rgba(24, 144, 255, 0.35)";
    } else if (isSelected && isCurrentMonth) {
      // 选中的日期：紫色高亮
      backgroundColor = "#f9f0ff";
      borderColor = "#d3adf7";
      textColor = "#722ed1";
      fontWeight = 600;
      boxShadow = "0 2px 6px rgba(114, 46, 209, 0.25)";
    } else if ((hasRecord || hasExercise) && isCurrentMonth) {
      // 有数据（体重或运动）：淡蓝色背景
      backgroundColor = "#f0f5ff";
      borderColor = "#d6e4ff";
      textColor = "#1890ff";
      fontWeight = 600;
    } else if (isCurrentMonth) {
      // 普通日期：灰色文字
      borderColor = "transparent";
      textColor = "#595959";
      fontWeight = 400;
    }

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: backgroundColor,
          border: `2px solid ${borderColor}`,
          boxSizing: "border-box",
          padding: "4px 3px",
          transition: "all 0.2s ease",
          cursor: "pointer",
          position: "relative",
          boxShadow: boxShadow,
        }}
        onClick={() => onDateSelect(date)}
      >
        {/* 运动符号 - 显示在右上角 */}
        {hasExercise && (
          <div
            style={{
              position: "absolute",
              top: 1,
              right: 3,
              fontSize: 14,
              zIndex: 1,
            }}
          >
            🏃
          </div>
        )}
        <div
          style={{
            fontSize: 14,
            fontWeight: fontWeight,
            color: textColor,
            marginBottom: dayWeights?.hasAnyRecord ? 2 : 0,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          {date.date()}
        </div>
        {dayWeights?.hasAnyRecord ? (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: textColor,
              lineHeight: 1.1,
              marginBottom: 0,
              whiteSpace: "nowrap",
              textAlign: "center",
              opacity: isToday ? 0.95 : 0.85,
            }}
          >
            {dayWeights.morning ? dayWeights.morning.toFixed(1) : "—"}/
            {dayWeights.night ? dayWeights.night.toFixed(1) : "—"}
          </div>
        ) : hasExercise ? (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: textColor,
              lineHeight: 1.1,
              marginBottom: 0,
              whiteSpace: "nowrap",
              textAlign: "center",
              opacity: 0.85,
            }}
          >
            {exerciseData.duration ? `${exerciseData.duration}分钟` : "运动"}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <Calendar
      fullscreen={false}
      value={currentDate}
      onPanelChange={(date) => setCurrentDate(date)}
      fullCellRender={dateFullCellRender}
      onSelect={(date) => onDateSelect(date)}
      headerRender={customHeaderRender}
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: 8,
        border: "none",
      }}
      className="custom-calendar"
    />
  );
};
