import React from "react";
import { Calendar } from "antd";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { CalendarData } from "../../../types";

interface DateViewProps {
  currentDate: Dayjs;
  setCurrentDate: (date: Dayjs) => void;
  calendarData: CalendarData;
  onDateSelect: (date: Dayjs) => void;
}

export const DateView: React.FC<DateViewProps> = ({
  currentDate,
  setCurrentDate,
  calendarData,
  onDateSelect,
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
  const getExerciseStatus = (date: Dayjs) => {
    const dateKey = date.format("YYYY-MM-DD");
    return exerciseRecords[dateKey] || false;
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
          marginBottom: 8,
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

        {/* 中间区域：月份和回到今天按钮 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* 当前月份和年份 */}
          <div
            style={{
              fontSize: 16,
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
    const hasRecord = dayWeights?.hasAnyRecord || false;
    const hasExercise = getExerciseStatus(date);
    const isCurrentMonth = date.month() === currentDate.month();

    // 根据状态确定样式
    let backgroundColor = "#fff";
    let borderColor = "transparent";
    let textColor = "#d9d9d9";
    let fontWeight = 400;

    if (isToday) {
      backgroundColor = "#e6f7ff";
      borderColor = "#1677ff";
      textColor = "#1677ff";
      fontWeight = 600;
    } else if (hasRecord && isCurrentMonth) {
      backgroundColor = "#f6ffed";
      borderColor = "#52c41a";
      textColor = "#389e0d";
      fontWeight = 600;
    } else if (hasExercise && isCurrentMonth) {
      backgroundColor = "#fff7e6";
      borderColor = "#fa8c16";
      textColor = "#d46b08";
      fontWeight = 600;
    } else if (isCurrentMonth) {
      textColor = "#333";
      fontWeight = 500;
    }

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 50,
          minWidth: 80,
          maxWidth: 80,
          maxHeight: 50,
          margin: "3px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          background: backgroundColor,
          border: `1px solid ${borderColor}`,
          boxSizing: "border-box",
          padding: "4px 2px",
          transition: "all 0.2s ease",
          cursor: "pointer",
          position: "relative",
        }}
        onClick={() => onDateSelect(date)}
      >
        {/* 运动符号 - 显示在右上角 */}
        {hasExercise && (
          <div
            style={{
              position: "absolute",
              top: 2,
              right: 4,
              fontSize: 14,
              color: "#52c41a",
              fontWeight: "bold",
              textShadow: "0 1px 2px rgba(255,255,255,0.8)",
              zIndex: 1,
            }}
          >
            🏃‍♂️
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
              lineHeight: 1.05,
              marginBottom: 0,
              letterSpacing: 0.1,
              whiteSpace: "nowrap",
              textAlign: "center",
              opacity: 0.9,
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
              lineHeight: 1.05,
              marginBottom: 0,
              letterSpacing: 0.1,
              whiteSpace: "nowrap",
              textAlign: "center",
              opacity: 0.9,
            }}
          >
            🏃‍♂️ 运动
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
