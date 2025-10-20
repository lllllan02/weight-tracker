import React, { useState, useEffect, useCallback } from "react";
import { Layout, Typography, message } from "antd";
import { DashboardOutlined } from "@ant-design/icons";
import {
  UserProfile,
  WeightStats,
  CalendarData,
  ChartData,
  Report,
} from "./types";
import {
  getCalendarData,
  getStats,
  getChartData,
  getProfile,
  updateProfile,
  getWeeklyReport,
  getMonthlyReport,
  getAvailableWeeks,
  getAvailableMonths,
} from "./utils/api";
import { WeightInput } from "./components/WeightInput";
import { StatsCard } from "./components/StatsCard";
import { WeightChart } from "./components/WeightChart";
import { TargetProgress } from "./components/TargetProgress";
import { ReportCard } from "./components/ReportCard";
import { DataBackup } from "./components/DataBackup";
import { MilestonesCard } from "./components/MilestonesCard";

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

function App() {
  const [calendarData, setCalendarData] = useState<CalendarData>({
    timeSlots: [],
    dayRecords: {},
    exerciseRecords: {},
  });
  const [stats, setStats] = useState<WeightStats>({
    current: 0,
    average: 0,
    min: 0,
    max: 0,
    bmi: 0,
    change: 0,
    totalRecords: 0,
    thisMonth: 0,
    thisWeek: 0,
    targetProgress: 0,
    targetRemaining: 0,
    initialWeight: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [profile, setProfile] = useState<UserProfile>({
    height: 170,
    theme: "light",
  });
  const [weeklyReport, setWeeklyReport] = useState<Report | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<Report | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [canGoPreviousWeek, setCanGoPreviousWeek] = useState(false);
  const [canGoNextWeek, setCanGoNextWeek] = useState(false);
  const [canGoPreviousMonth, setCanGoPreviousMonth] = useState(false);
  const [canGoNextMonth, setCanGoNextMonth] = useState(false);

  useEffect(() => {
    loadData();
    loadAvailableDates();
  }, []);

  useEffect(() => {
    if (availableWeeks.length > 0) {
      loadWeeklyReport();
      updateWeekNavigation();
    }
  }, [currentWeekDate, availableWeeks]);

  useEffect(() => {
    if (availableMonths.length > 0) {
      loadMonthlyReport();
      updateMonthNavigation();
    }
  }, [currentMonthDate, availableMonths]);

  const loadAvailableDates = async () => {
    try {
      const [weeks, months] = await Promise.all([
        getAvailableWeeks(),
        getAvailableMonths(),
      ]);
      setAvailableWeeks(weeks);
      setAvailableMonths(months);
    } catch (error) {
      console.error("加载可用日期失败:", error);
    }
  };

  const loadData = async () => {
    try {
      const [calendar, statsData, chart, profileData] = await Promise.all([
        getCalendarData(),
        getStats(),
        getChartData(),
        getProfile(),
      ]);
      setCalendarData(calendar);
      setStats(statsData);
      setChartData(chart);
      setProfile(profileData);
    } catch (error) {
      console.error("加载数据失败:", error);
      message.error("连接后端服务失败，请确保后端服务已启动");
    }
  };

  const getWeekStartKey = (date: Date) => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    // 使用本地日期格式，避免时区问题
    const year = weekStart.getFullYear();
    const month = String(weekStart.getMonth() + 1).padStart(2, '0');
    const day = String(weekStart.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const updateWeekNavigation = () => {
    const currentWeekKey = getWeekStartKey(currentWeekDate);
    const currentIndex = availableWeeks.indexOf(currentWeekKey);
    
    console.log('周导航状态更新:', {
      currentWeekKey,
      currentIndex,
      availableWeeks,
      totalWeeks: availableWeeks.length
    });
    
    setCanGoPreviousWeek(currentIndex > 0);
    setCanGoNextWeek(currentIndex >= 0 && currentIndex < availableWeeks.length - 1);
  };

  const updateMonthNavigation = () => {
    const currentMonthKey = getMonthKey(currentMonthDate);
    const currentIndex = availableMonths.indexOf(currentMonthKey);
    
    setCanGoPreviousMonth(currentIndex > 0);
    setCanGoNextMonth(currentIndex >= 0 && currentIndex < availableMonths.length - 1);
  };

  const loadWeeklyReport = async () => {
    try {
      setReportsLoading(true);
      // 使用本地日期格式，避免时区问题
      const year = currentWeekDate.getFullYear();
      const month = String(currentWeekDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentWeekDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const weekly = await getWeeklyReport(dateStr);
      setWeeklyReport(weekly);
    } catch (error) {
      console.error("加载周报失败:", error);
      message.error("加载周报失败");
    } finally {
      setReportsLoading(false);
    }
  };

  const loadMonthlyReport = async () => {
    try {
      setReportsLoading(true);
      const year = currentMonthDate.getFullYear();
      const month = currentMonthDate.getMonth() + 1;
      const monthly = await getMonthlyReport(year, month);
      setMonthlyReport(monthly);
    } catch (error) {
      console.error("加载月报失败:", error);
      message.error("加载月报失败");
    } finally {
      setReportsLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    if (!canGoPreviousWeek) return;
    
    const currentWeekKey = getWeekStartKey(currentWeekDate);
    const currentIndex = availableWeeks.indexOf(currentWeekKey);
    
    console.log('点击上一周:', {
      currentWeekKey,
      currentIndex,
      canGoPreviousWeek
    });
    
    if (currentIndex > 0) {
      const prevWeekKey = availableWeeks[currentIndex - 1];
      console.log('切换到上一周:', prevWeekKey);
      // 手动解析日期，避免时区问题
      const [year, month, day] = prevWeekKey.split('-').map(Number);
      setCurrentWeekDate(new Date(year, month - 1, day));
    }
  };

  const handleNextWeek = () => {
    if (!canGoNextWeek) return;
    
    const currentWeekKey = getWeekStartKey(currentWeekDate);
    const currentIndex = availableWeeks.indexOf(currentWeekKey);
    
    console.log('点击下一周:', {
      currentWeekKey,
      currentIndex,
      canGoNextWeek
    });
    
    if (currentIndex < availableWeeks.length - 1) {
      const nextWeekKey = availableWeeks[currentIndex + 1];
      console.log('切换到下一周:', nextWeekKey);
      // 手动解析日期，避免时区问题
      const [year, month, day] = nextWeekKey.split('-').map(Number);
      setCurrentWeekDate(new Date(year, month - 1, day));
    }
  };

  const handlePreviousMonth = () => {
    if (!canGoPreviousMonth) return;
    
    const currentMonthKey = getMonthKey(currentMonthDate);
    const currentIndex = availableMonths.indexOf(currentMonthKey);
    
    if (currentIndex > 0) {
      const prevMonthKey = availableMonths[currentIndex - 1];
      const [year, month] = prevMonthKey.split('-');
      setCurrentMonthDate(new Date(parseInt(year), parseInt(month) - 1, 1));
    }
  };

  const handleNextMonth = () => {
    if (!canGoNextMonth) return;
    
    const currentMonthKey = getMonthKey(currentMonthDate);
    const currentIndex = availableMonths.indexOf(currentMonthKey);
    
    if (currentIndex < availableMonths.length - 1) {
      const nextMonthKey = availableMonths[currentIndex + 1];
      const [year, month] = nextMonthKey.split('-');
      setCurrentMonthDate(new Date(parseInt(year), parseInt(month) - 1, 1));
    }
  };

  const handleAddRecord = async () => {
    try {
      // 重新加载所有数据，因为后端会自动更新所有计算数据
      await Promise.all([loadData(), loadAvailableDates()]);
      message.success("体重记录添加成功");
    } catch (error) {
      message.error("添加记录失败");
    }
  };

  const handleExerciseChange = async () => {
    try {
      // 只重新加载数据，不显示成功提示
      await Promise.all([loadData(), loadAvailableDates()]);
    } catch (error) {
      console.error("重新加载数据失败:", error);
    }
  };

  const handleProfileChange = async (newProfile: UserProfile) => {
    try {
      await updateProfile(newProfile);
      // 重新加载所有数据，因为后端会自动更新所有计算数据
      await Promise.all([loadData(), loadAvailableDates()]);
      message.success("用户资料更新成功");
    } catch (error) {
      message.error("更新用户资料失败");
    }
  };

  return (
    <Layout className="app-container">
      <Header
        style={{
          background: "#fff",
          padding: "32px 0 16px 0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          minHeight: "unset",
          height: "auto",
          display: "block",
        }}
      >
        <div className="header">
          <Title
            level={2}
            style={{
              margin: 0,
              color: "#1890ff",
              wordBreak: "break-all",
              whiteSpace: "normal",
            }}
          >
            <DashboardOutlined style={{ marginRight: 12 }} />
            体重日记
          </Title>
          <Paragraph style={{ margin: 0, color: "#666", fontSize: 16 }}>
            记录您的健康旅程，陪伴您实现理想体重
          </Paragraph>
        </div>
      </Header>

      <Content style={{ padding: 0, background: "#f5f5f5" }}>
        <div className="main-content">
          {/* 体重输入 */}
          <WeightInput
            onAdd={handleAddRecord}
            onExerciseChange={handleExerciseChange}
            profile={profile}
            onProfileChange={handleProfileChange}
            calendarData={calendarData}
          />

          {/* 目标进度 - 使用最小的阶段目标作为最终目标 */}
          {stats.current > 0 && profile.milestones && profile.milestones.length > 0 && (
            <TargetProgress 
              stats={stats} 
              targetWeight={Math.min(...profile.milestones.map(m => m.targetWeight))}
              milestones={profile.milestones}
            />
          )}

          {/* 阶段目标 */}
          {stats.current > 0 && (
            <MilestonesCard
              currentWeight={stats.current}
              onMilestoneChange={async () => {
                await Promise.all([loadData(), loadAvailableDates()]);
              }}
            />
          )}

          {/* 统计卡片 */}
          {stats.current > 0 && (
            <StatsCard stats={stats} height={profile.height} />
          )}

          {/* 报告卡片 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 8,
            }}
          >
              {weeklyReport && (
                <ReportCard
                  report={weeklyReport}
                  loading={reportsLoading}
                  onPrevious={handlePreviousWeek}
                  onNext={handleNextWeek}
                  canGoPrevious={canGoPreviousWeek}
                  canGoNext={canGoNextWeek}
                />
              )}
              {monthlyReport && (
                <ReportCard
                  report={monthlyReport}
                  loading={reportsLoading}
                  onPrevious={handlePreviousMonth}
                  onNext={handleNextMonth}
                  canGoPrevious={canGoPreviousMonth}
                  canGoNext={canGoNextMonth}
                />
              )}
          </div>

          {/* 体重图表 */}
          <WeightChart chartData={chartData} height={profile.height} />

          {/* 数据备份 */}
          <DataBackup
            onDataChange={async () => {
              await Promise.all([loadData(), loadAvailableDates()]);
            }}
          />

          {/* 页脚 */}
          <div className="footer">
            <Paragraph
              style={{ textAlign: "center", color: "#666", marginTop: 32 }}
            >
              数据存储在本地 JSON 文件中，实时同步
            </Paragraph>
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default App;
