import React, { useState, useEffect } from "react";
import { Layout, Typography, message, Tabs, Card, Skeleton } from "antd";
import { DashboardOutlined, BarChartOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import {
  UserProfile,
  WeightStats,
  CalendarData,
  Report,
} from "./types";
import {
  getCalendarData,
  getStats,
  getProfile,
  getWeeklyReport,
  getMonthlyReport,
  getAllTimeReport,
  getAvailableWeeks,
  getAvailableMonths,
} from "./utils/api";
import { WeightInput } from "./components/WeightInput";
import { TargetProgress } from "./components/TargetProgress";
import { UnifiedReportPanel } from "./components/UnifiedReportPanel";
import { DataBackup } from "./components/DataBackup";
import { MilestonesCard } from "./components/MilestonesCard";
import { ProfileSettingsCard } from "./components/ProfileSettingsCard";
import { PredictionCard } from "./components/PredictionCard";
import { ExerciseEffectivenessCard } from "./components/ExerciseEffectivenessCard";
import DailyRecordsBar from "./components/DailyRecordsBar";

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
  const [profile, setProfile] = useState<UserProfile>({
    height: 170,
    theme: "light",
  });
  const [allTimeReport, setAllTimeReport] = useState<Report | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<Report | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<Report | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(new Date());
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [canGoPreviousWeek, setCanGoPreviousWeek] = useState(false);
  const [canGoNextWeek, setCanGoNextWeek] = useState(false);
  const [canGoPreviousMonth, setCanGoPreviousMonth] = useState(false);
  const [canGoNextMonth, setCanGoNextMonth] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mealRefresh, setMealRefresh] = useState(0);
  const [selectedDateForMeal, setSelectedDateForMeal] = useState<Dayjs>(dayjs());

  useEffect(() => {
    const initializeApp = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          loadData(),
          loadAvailableDates(),
          loadAllTimeReport()
        ]);
      } finally {
        setInitialLoading(false);
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (availableMonths.length > 0) {
      loadMonthlyReport();
      updateMonthNavigation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonthDate, availableMonths]);

  useEffect(() => {
    if (availableWeeks.length > 0) {
      loadWeeklyReport();
      updateWeekNavigation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekDate, availableWeeks]);

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
      const [calendar, statsData, profileData] = await Promise.all([
        getCalendarData(),
        getStats(),
        getProfile(),
      ]);
      setCalendarData(calendar);
      setStats(statsData);
      setProfile(profileData);
    } catch (error) {
      console.error("加载数据失败:", error);
      message.error("连接后端服务失败，请确保后端服务已启动");
    }
  };

  const getWeekStartKey = (date: Date) => {
    const weekStart = new Date(date);
    // 计算到周一的天数（周一为一周的开始）
    const dayOfWeek = date.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(date.getDate() - daysToMonday);
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

  const loadAllTimeReport = async () => {
    try {
      setReportsLoading(true);
      const allTime = await getAllTimeReport();
      setAllTimeReport(allTime);
    } catch (error) {
      console.error("加载全时段报告失败:", error);
      message.error("加载全时段报告失败");
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

  const loadWeeklyReport = async () => {
    try {
      setReportsLoading(true);
      // 使用本地日期格式，避免时区问题
      const year = currentWeekDate.getFullYear();
      const month = String(currentWeekDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentWeekDate.getDate()).padStart(2, "0");
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
      await Promise.all([loadData(), loadAvailableDates(), loadAllTimeReport()]);
      message.success("体重记录添加成功");
    } catch (error) {
      message.error("添加记录失败");
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
          {initialLoading ? (
            // 加载骨架屏
            <>
              {/* 体重输入骨架屏 */}
              <Card style={{ marginBottom: 12, borderRadius: 12 }}>
                <div style={{ display: "flex", gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <Skeleton active paragraph={{ rows: 8 }} />
                  </div>
                  <div style={{ width: 260 }}>
                    <Skeleton active paragraph={{ rows: 6 }} />
                  </div>
                </div>
              </Card>

              {/* 目标进度骨架屏 */}
              <Card style={{ marginBottom: 12, borderRadius: 12 }}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>

              {/* 报告骨架屏 */}
              <Card style={{ marginBottom: 12, borderRadius: 12 }}>
                <Skeleton active paragraph={{ rows: 10 }} />
              </Card>
            </>
          ) : (
            <>
              {/* 上部区域 - 日历、个人资料和当天记录 */}
              <div className="top-section-layout" style={{ display: "flex", gap: 16, alignItems: "stretch", marginBottom: 12 }}>
                {/* 左侧：个人资料设置 */}
                <div className="profile-column" style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column" }}>
                  <ProfileSettingsCard
                    stats={stats}
                    onProfileChange={async () => {
                      await Promise.all([
                        loadData(),
                        loadAvailableDates(),
                        loadAllTimeReport(),
                      ]);
                    }}
                  />
                </div>

                {/* 中间和右侧：体重输入（日历+当天记录） */}
                <div style={{ flex: 1, minWidth: 0, display: "flex" }}>
                  <WeightInput
                    onAdd={handleAddRecord}
                    calendarData={calendarData}
                    onDateSelect={(date) => {
                      setSelectedDateForMeal(date);
                    }}
                  />
                </div>
              </div>

              {/* 饮食和运动记录横条 */}
              <DailyRecordsBar 
                refresh={mealRefresh}
                selectedDate={selectedDateForMeal}
                bmr={stats.currentBMR || 0}
                onSuccess={() => {
                  setMealRefresh(prev => prev + 1);
                  loadData(); // 刷新数据以更新运动记录
                }}
              />

              {/* 目标进度 - 使用最小的阶段目标作为最终目标 */}
              {stats.current > 0 && profile.milestones && profile.milestones.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <TargetProgress 
                    stats={stats} 
                    targetWeight={Math.min(...profile.milestones.map(m => m.targetWeight))}
                    milestones={profile.milestones}
                  />
                </div>
              )}

              {/* 主要内容区域 - 两栏布局 */}
              <div className="two-column-layout" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                {/* 左侧主要内容 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* 报告标签页 */}
                  <Card style={{ marginBottom: 12 }}>
                    <Tabs
                      defaultActiveKey="all-time"
                      tabBarExtraContent={{
                        left: (
                          <span style={{ marginRight: 16, fontSize: 16, fontWeight: 500 }}>
                            <BarChartOutlined /> 数据报告
                          </span>
                        ),
                      }}
                      items={[
                        {
                          key: "all-time",
                          label: "📊 全部历史",
                          children: allTimeReport && (
                            <UnifiedReportPanel
                              report={allTimeReport}
                              loading={reportsLoading}
                              height={profile.height}
                              targetPrediction={stats.targetPrediction}
                              targetWeight={profile.milestones && profile.milestones.length > 0 
                                ? Math.min(...profile.milestones.map(m => m.targetWeight))
                                : undefined}
                            />
                          ),
                        },
                        {
                          key: "monthly",
                          label: "📅 月报",
                          children: monthlyReport && (
                            <UnifiedReportPanel
                              report={monthlyReport}
                              loading={reportsLoading}
                              onPrevious={handlePreviousMonth}
                              onNext={handleNextMonth}
                              canGoPrevious={canGoPreviousMonth}
                              canGoNext={canGoNextMonth}
                              height={profile.height}
                            />
                          ),
                        },
                        {
                          key: "weekly",
                          label: "📆 周报",
                          children: weeklyReport && (
                            <UnifiedReportPanel
                              report={weeklyReport}
                              loading={reportsLoading}
                              onPrevious={handlePreviousWeek}
                              onNext={handleNextWeek}
                              canGoPrevious={canGoPreviousWeek}
                              canGoNext={canGoNextWeek}
                              height={profile.height}
                            />
                          ),
                        },
                      ]}
                    />
                  </Card>

                  {/* 运动效果评估 */}
                  {stats.current > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <ExerciseEffectivenessCard />
                    </div>
                  )}

                  {/* 数据备份 */}
                  <DataBackup
                    onDataChange={async () => {
                      await Promise.all([
                        loadData(),
                        loadAvailableDates(),
                        loadAllTimeReport(),
                      ]);
                    }}
                  />
                </div>

                {/* 右侧边栏 */}
                <div className="sidebar-column" style={{ width: 360, flexShrink: 0 }}>
                  {/* 阶段目标 */}
                  {stats.current > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <MilestonesCard
                        currentWeight={stats.current}
                        profile={profile}
                        onMilestoneChange={async () => {
                          await Promise.all([
                            loadData(),
                            loadAvailableDates(),
                            loadAllTimeReport(),
                          ]);
                        }}
                      />
                    </div>
                  )}
                  
                  {/* 趋势预测 */}
                  {stats.current > 0 && profile.milestones && profile.milestones.length > 0 && (
                    <PredictionCard
                      targetPrediction={stats.targetPrediction}
                      targetWeight={Math.min(...profile.milestones.map(m => m.targetWeight))}
                    />
                  )}
                </div>
              </div>

              {/* 页脚 */}
              <div className="footer">
                <Paragraph
                  style={{ textAlign: "center", color: "#666", marginTop: 32 }}
                >
                  数据存储在本地 JSON 文件中，实时同步
                </Paragraph>
              </div>
            </>
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default App;
