import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Drawer,
  List,
  Tag,
  Image,
  Popconfirm,
  Tabs,
  InputNumber,
} from 'antd';
import {
  FireOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  CameraOutlined,
  DeleteOutlined,
  EditOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { 
  createMeal, 
  getMeals, 
  deleteMeal, 
  updateMeal, 
  predictMealCalories,
  createExerciseWithImages,
  updateExerciseWithImages,
  getExercises,
  deleteExerciseRecord,
  predictExercise,
  markAsComplete,
  unmarkAsComplete,
  checkIsComplete,
} from '../utils/api';
import type { MealRecord, ExerciseRecord } from '../types';

const { TextArea } = Input;
const { Option } = Select;

interface DailyRecordsBarProps {
  refresh?: number;
  onSuccess?: () => void;
  selectedDate?: Dayjs;
  bmr?: number;
}

const DailyRecordsBar: React.FC<DailyRecordsBarProps> = ({ refresh, onSuccess, selectedDate, bmr = 0 }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [recordType, setRecordType] = useState<'meal' | 'exercise'>('meal');
  const [aiPredicting, setAiPredicting] = useState(false);
  const [isAIPredicted, setIsAIPredicted] = useState(false);
  const [activeTab, setActiveTab] = useState<'meal' | 'exercise'>('meal');
  
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [totalCaloriesIn, setTotalCaloriesIn] = useState(0);
  const [totalCaloriesOut, setTotalCaloriesOut] = useState(0);
  const [editingRecord, setEditingRecord] = useState<MealRecord | ExerciseRecord | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);

  const currentDate = selectedDate || dayjs();
  const dateStr = currentDate.format('YYYY-MM-DD');

  // 加载记录
  const loadRecords = useCallback(async () => {
    try {
      const [mealsRes, exercisesRes, completeRes] = await Promise.all([
        getMeals({ date: dateStr }),
        getExercises({ date: dateStr }),
        checkIsComplete(currentDate.toISOString()),
      ]);

      if (mealsRes.success) {
        setMeals(mealsRes.meals || []);
        const totalIn = (mealsRes.meals || []).reduce(
          (sum: number, meal: MealRecord) => sum + (meal.estimatedCalories || 0),
          0
        );
        setTotalCaloriesIn(totalIn);
      }

      if (exercisesRes.success) {
        setExercises(exercisesRes.exercises || []);
        const totalOut = (exercisesRes.exercises || []).reduce(
          (sum: number, exercise: ExerciseRecord) => sum + (exercise.estimatedCalories || 0),
          0
        );
        setTotalCaloriesOut(totalOut);
      }

      if (completeRes.success) {
        setIsComplete(completeRes.isComplete);
      }
    } catch (error) {
      console.error('加载记录失败:', error);
    }
  }, [dateStr, currentDate]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords, refresh]);

  // 打开添加Modal
  const handleOpenModal = (type: 'meal' | 'exercise') => {
    setRecordType(type);
    setEditingRecord(null);
    form.resetFields();
    setFileList([]);
    setIsAIPredicted(false);
    setModalVisible(true);
  };

  // 打开编辑Modal
  const handleEdit = (record: MealRecord | ExerciseRecord, type: 'meal' | 'exercise') => {
    setRecordType(type);
    setEditingRecord(record);
    
    if (type === 'meal') {
      const meal = record as MealRecord;
      form.setFieldsValue({
        mealType: meal.mealType,
        description: meal.description,
        calories: meal.estimatedCalories,
      });
    } else {
      const exercise = record as ExerciseRecord;
      form.setFieldsValue({
        duration: exercise.duration,
        description: exercise.description,
        calories: exercise.estimatedCalories,
      });
    }

    // 修复图片URL - 如果是相对路径，添加后端地址前缀
    const existingFiles = record.images?.map((url, index) => ({
      uid: `existing-${index}`,
      name: `image-${index}`,
      status: 'done' as const,
      url: url.startsWith('http') ? url : `http://localhost:3001${url}`,
    })) || [];
    setFileList(existingFiles);
    setModalVisible(true);
  };

  // AI预测
  const handleAIPredict = async () => {
    try {
      setAiPredicting(true);
      const values = form.getFieldsValue();
      
      if (!values.description && fileList.length === 0) {
        message.warning('请先输入描述或上传图片');
        setAiPredicting(false);
        return;
      }

      const formData = new FormData();
      formData.append('description', values.description || '');
      
      if (recordType === 'exercise') {
        if (!values.duration || values.duration <= 0) {
          message.warning('请先输入运动时长');
          setAiPredicting(false);
          return;
        }
        formData.append('duration', values.duration.toString());
      }
      
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });

      const result = recordType === 'meal' 
        ? await predictMealCalories(formData)
        : await predictExercise(formData);

      if (result.success && result.calories !== null) {
        setIsAIPredicted(true);
        form.setFieldsValue({ calories: result.calories });
        message.success(`AI预测：${result.calories}千卡`);
      } else {
        message.error(result.error || 'AI预测失败');
      }
    } catch (error: any) {
      console.error('AI预测失败:', error);
      message.error('AI预测失败，请稍后重试');
    } finally {
      setAiPredicting(false);
    }
  };

  // 提交记录
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const formData = new FormData();
      formData.append('date', currentDate.toISOString());
      formData.append('description', values.description || '');

      if (values.calories && !isNaN(Number(values.calories))) {
        formData.append(recordType === 'meal' ? 'manualCalories' : 'manualCalories', values.calories.toString());
        if (isAIPredicted) {
          formData.append('aiPredicted', 'true');
        } else {
          formData.append('skipAI', 'true');
        }
      }

      if (recordType === 'meal') {
        formData.append('mealType', values.mealType || 'other');
      } else {
        if (values.duration) {
          formData.append('manualDuration', values.duration.toString());
        }
      }

      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });

      let result;
      if (editingRecord) {
        // 更新记录
        formData.append('keepExistingImages', 'true');
        if (recordType === 'meal') {
          result = await updateMeal(editingRecord.id, formData);
        } else {
          result = await updateExerciseWithImages(editingRecord.id, formData);
        }
      } else {
        // 创建新记录
        result = recordType === 'meal'
          ? await createMeal(formData)
          : await createExerciseWithImages(formData);
      }

      if (result.success) {
        message.success(editingRecord ? '更新成功' : '添加成功');
        setModalVisible(false);
        form.resetFields();
        setFileList([]);
        setIsAIPredicted(false);
        await loadRecords();
        if (onSuccess) onSuccess();
      } else {
        message.error(result.error || '操作失败');
      }
    } catch (error: any) {
      console.error('提交失败:', error);
      message.error('操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除记录
  const handleDelete = async (id: string, type: 'meal' | 'exercise') => {
    try {
      const result = type === 'meal' 
        ? await deleteMeal(id)
        : await deleteExerciseRecord(id);
        
      if (result.success) {
        message.success('删除成功');
        await loadRecords();
        if (onSuccess) onSuccess();
      } else {
        message.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败，请稍后重试');
    }
  };

  // 图片上传处理
  const handleBeforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB！');
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const handleChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList);
  };

  // 切换完整记录标记
  const handleToggleComplete = async () => {
    try {
      setMarkingComplete(true);
      if (isComplete) {
        const result = await unmarkAsComplete(currentDate.toISOString());
        if (result.success) {
          message.success('已取消完整记录标记');
          setIsComplete(false);
          if (onSuccess) onSuccess();
        }
      } else {
        const result = await markAsComplete(currentDate.toISOString());
        if (result.success) {
          message.success('已标记为完整记录');
          setIsComplete(true);
          if (onSuccess) onSuccess();
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败，请稍后重试');
    } finally {
      setMarkingComplete(false);
    }
  };

  // 获取餐次名称
  const getMealTypeName = (type: string) => {
    const names: Record<string, string> = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '零食',
      other: '其他',
    };
    return names[type] || '其他';
  };

  const getMealTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      breakfast: '#ffd666',  // 明黄色 - 早餐
      lunch: '#ff9c6e',      // 橙色 - 午餐
      dinner: '#ffc069',     // 金橙色 - 晚餐
      snack: '#95de64',      // 明绿色 - 零食
      other: '#91d5ff',      // 浅蓝色 - 其他
    };
    return colors[type] || '#91d5ff';
  };

  // 净摄入热量（包含基础代谢）
  const netCalories = totalCaloriesIn - Math.round(bmr) - totalCaloriesOut;

  // 排序饮食记录：早餐、午餐、晚餐、其他、零食
  const sortedMeals = [...meals].sort((a, b) => {
    const order: Record<string, number> = {
      breakfast: 1,
      lunch: 2,
      dinner: 3,
      other: 4,
      snack: 5,
    };
    return (order[a.mealType] || 999) - (order[b.mealType] || 999);
  });

  return (
    <>
      <Card
        style={{
          borderRadius: 8,
          marginBottom: 12,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          border: 'none',
        }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* 左侧：大数字 */}
          <div style={{ marginRight: 16, flexShrink: 0 }}>
            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 3 }}>今日净热量</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <div style={{ 
                fontSize: 38, 
                fontWeight: 700,
                color: netCalories > 0 ? '#ffd666' : '#95de64',
                lineHeight: 1
              }}>
                {netCalories > 0 ? '+' : ''}{netCalories}
              </div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>千卡</div>
            </div>
          </div>

          {/* 中间：卡片横向滚动 */}
          <div style={{ 
            flex: 1,
            display: 'flex', 
            gap: 10,
            overflowX: 'auto',
            marginRight: 16,
            paddingRight: 10,
          }}>
            {sortedMeals.map(meal => (
                <div
                  key={meal.id}
                  onClick={() => handleEdit(meal, 'meal')}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    padding: '12px 10px',
                    minWidth: 160,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid rgba(255,255,255,0.2)',
                    flexShrink: 0,
                    display: 'flex',
                    gap: 8,
                    height: 70,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  }}
                >
                  {/* 左侧：竖向标签 */}
                  <div style={{
                    writingMode: 'vertical-rl',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: getMealTypeColor(meal.mealType),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 16,
                  }}>
                    {getMealTypeName(meal.mealType)}
                  </div>
                  
                  {/* 竖线分割 */}
                  <div style={{
                    width: 1,
                    background: 'rgba(255,255,255,0.3)',
                    flexShrink: 0,
                  }} />
                  
                  {/* 右侧：内容和热量 */}
                  <div style={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minWidth: 0,
                  }}>
                    {/* 右上角：食物描述 */}
                    <div style={{
                      fontSize: 12,
                      opacity: 0.9,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {meal.description || '未填写'}
                      {meal.images && meal.images.length > 0 && (
                        <CameraOutlined style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }} />
                      )}
                    </div>
                    
                    {/* 右下角：热量 */}
                    <div style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#fff566',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 4,
                    }}>
                      <span>+{meal.estimatedCalories || 0}</span>
                      <span style={{ fontSize: 11, opacity: 0.8 }}>千卡</span>
                      {meal.isAiPredicted && (
                        <span style={{ 
                          fontSize: 10, 
                          color: '#1890ff', 
                          background: 'rgba(24, 144, 255, 0.1)',
                          padding: '1px 4px',
                          borderRadius: 2,
                          fontWeight: 500,
                        }}>AI</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {exercises.map(exercise => (
                <div
                  key={exercise.id}
                  onClick={() => handleEdit(exercise, 'exercise')}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    padding: '12px 10px',
                    minWidth: 160,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid rgba(255,255,255,0.2)',
                    flexShrink: 0,
                    display: 'flex',
                    gap: 8,
                    height: 70,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  }}
                >
                  {/* 左侧：竖向标签 */}
                  <div style={{
                    writingMode: 'vertical-rl',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: '#73d13d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 16,
                  }}>
                    运动
                  </div>
                  
                  {/* 竖线分割 */}
                  <div style={{
                    width: 1,
                    background: 'rgba(255,255,255,0.3)',
                    flexShrink: 0,
                  }} />
                  
                  {/* 右侧：内容和热量 */}
                  <div style={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minWidth: 0,
                  }}>
                    {/* 右上角：运动描述 */}
                    <div style={{
                      fontSize: 12,
                      opacity: 0.9,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {exercise.description || `${exercise.duration}分钟`}
                      {exercise.images && exercise.images.length > 0 && (
                        <CameraOutlined style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }} />
                      )}
                    </div>
                    
                    {/* 右下角：热量 */}
                    <div style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#73d13d',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 4,
                    }}>
                      <span>-{exercise.estimatedCalories || 0}</span>
                      <span style={{ fontSize: 11, opacity: 0.8 }}>千卡</span>
                      {exercise.isAiPredicted && (
                        <span style={{ 
                          fontSize: 10, 
                          color: '#1890ff', 
                          background: 'rgba(24, 144, 255, 0.1)',
                          padding: '1px 4px',
                          borderRadius: 2,
                          fontWeight: 500,
                        }}>AI</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            
            {/* 基础代谢卡片 - 最右边 */}
            <div
              style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 8,
                padding: '12px 10px',
                minWidth: 160,
                border: '1px solid rgba(255,255,255,0.3)',
                flexShrink: 0,
                display: 'flex',
                gap: 8,
                height: 70,
              }}
            >
              {/* 左侧：竖向标签 */}
              <div style={{
                writingMode: 'vertical-rl',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
                color: '#ff9c6e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 16,
              }}>
                基础
              </div>
              
              {/* 竖线分割 */}
              <div style={{
                width: 1,
                background: 'rgba(255,255,255,0.3)',
                flexShrink: 0,
              }} />
              
              {/* 右侧：内容和热量 */}
              <div style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minWidth: 0,
              }}>
                {/* 右上角：说明 */}
                <div style={{
                  fontSize: 12,
                  opacity: 0.9,
                }}>
                  基础代谢
                </div>
                
                {/* 右下角：热量 */}
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#ff9c6e',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                }}>
                  <span>-{Math.round(bmr)}</span>
                  <span style={{ fontSize: 11, opacity: 0.8 }}>千卡</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：所有按钮（竖向） */}
          <Space direction="vertical" size={5} style={{ flexShrink: 0 }}>
            <Button
              size="small"
              icon={<CameraOutlined style={{ fontSize: 13 }} />}
              onClick={() => handleOpenModal('meal')}
              style={{ 
                background: 'rgba(255,255,255,0.2)', 
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                width: 78,
                height: 30,
                fontSize: 12,
                padding: '0 10px'
              }}
            >
              饮食
            </Button>
            <Button
              size="small"
              icon={<ThunderboltOutlined style={{ fontSize: 13 }} />}
              onClick={() => handleOpenModal('exercise')}
              style={{ 
                background: 'rgba(255,255,255,0.2)', 
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                width: 78,
                height: 30,
                fontSize: 12,
                padding: '0 10px'
              }}
            >
              运动
            </Button>
            <Button
              size="small"
              icon={<UnorderedListOutlined style={{ fontSize: 13 }} />}
              onClick={() => {
                // 智能选择tab：优先显示有记录的那一项
                if (meals.length > 0 && exercises.length === 0) {
                  setActiveTab('meal');
                } else if (exercises.length > 0 && meals.length === 0) {
                  setActiveTab('exercise');
                }
                // 如果两者都有或都没有，保持当前tab
                setDrawerVisible(true);
              }}
              style={{ 
                background: 'rgba(255,255,255,0.3)', 
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                width: 78,
                height: 30,
                fontSize: 12,
                padding: '0 10px'
              }}
            >
              详情({meals.length + exercises.length})
            </Button>
            <Button
              size="small"
              onClick={handleToggleComplete}
              loading={markingComplete}
              style={{ 
                background: isComplete ? 'rgba(82, 196, 26, 0.3)' : 'rgba(255,255,255,0.2)', 
                border: isComplete ? '1px solid rgba(82, 196, 26, 0.6)' : 'none',
                color: '#fff',
                fontWeight: 600,
                width: 78,
                height: 30,
                fontSize: 12,
                padding: '0 10px'
              }}
            >
              {isComplete ? '✓ 完整' : '标记'}
            </Button>
          </Space>
        </div>
      </Card>

      {/* 添加/编辑 Modal */}
      <Modal
        title={
          <Space>
            {recordType === 'meal' ? <CameraOutlined /> : <ThunderboltOutlined />}
            <span>
              {editingRecord ? '编辑' : '添加'}
              {recordType === 'meal' ? '饮食' : '运动'}记录 - {currentDate.format('M月D日')}
            </span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setFileList([]);
          setIsAIPredicted(false);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical">
          {recordType === 'meal' ? (
            <Form.Item
              label="餐次类型"
              name="mealType"
              initialValue="breakfast"
              rules={[{ required: true, message: '请选择餐次类型' }]}
            >
              <Select>
                <Option value="breakfast">🌅 早餐</Option>
                <Option value="lunch">☀️ 午餐</Option>
                <Option value="dinner">🌙 晚餐</Option>
                <Option value="snack">🍪 零食</Option>
                <Option value="other">🍽️ 其他</Option>
              </Select>
            </Form.Item>
          ) : (
            <Form.Item
              label="运动时长（分钟）"
              name="duration"
              rules={[{ required: true, message: '请输入运动时长' }]}
            >
              <InputNumber
                placeholder="请输入时长"
                min={0}
                max={1440}
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}

          <Form.Item label="热量（千卡）">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="calories" noStyle>
                <Input
                  placeholder={recordType === 'meal' ? '不填写则AI预测' : '不填写则AI预测'}
                  onChange={() => setIsAIPredicted(false)}
                />
              </Form.Item>
              <Button
                type="primary"
                icon={<FireOutlined />}
                onClick={handleAIPredict}
                loading={aiPredicting}
              >
                AI预测
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item label="描述">
            <Form.Item name="description" noStyle>
              <TextArea
                rows={3}
                placeholder={
                  recordType === 'meal' 
                    ? '描述你吃了什么，比如：一碗米饭、半份青菜、100克鸡胸肉...'
                    : '描述你的运动，比如：跑步5公里、游泳30分钟、瑜伽1小时...'
                }
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Form.Item>

          <Form.Item label="上传图片（可选）">
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={handleBeforeUpload}
              onChange={handleChange}
              maxCount={5}
            >
              {fileList.length >= 5 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setFileList([]);
                  setIsAIPredicted(false);
                }}
              >
                取消
              </Button>
              <Button type="primary" onClick={handleSubmit} loading={loading}>
                {editingRecord ? '保存' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情 Drawer */}
      <Drawer
        title={`${currentDate.format('M月D日')}的记录`}
        placement="right"
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'meal' | 'exercise')}
          items={[
            {
              key: 'meal',
              label: `饮食 (${meals.length})`,
              children: (
                <List
                  dataSource={meals}
                  renderItem={(meal) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleEdit(meal, 'meal')}
                        />,
                        <Popconfirm
                          title="确定删除这条记录吗？"
                          onConfirm={() => handleDelete(meal.id, 'meal')}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Tag color={getMealTypeColor(meal.mealType)}>
                            {getMealTypeName(meal.mealType)}
                          </Tag>
                        }
                        title={
                          <Space>
                            <span>{meal.estimatedCalories || 0} 千卡</span>
                            {meal.isAiPredicted && (
                              <Tag color="blue" style={{ fontSize: 10 }}>AI</Tag>
                            )}
                          </Space>
                        }
                        description={
                          <div>
                            <div>{meal.description || '无描述'}</div>
                            {meal.images && meal.images.length > 0 && (
                              <div style={{ marginTop: 8 }}>
                                <Image.PreviewGroup>
                                  {meal.images.map((img, idx) => (
                                    <Image
                                      key={idx}
                                      src={img.startsWith('http') ? img : `http://localhost:3001${img}`}
                                      width={60}
                                      height={60}
                                      style={{ objectFit: 'cover', borderRadius: 4, marginRight: 4 }}
                                    />
                                  ))}
                                </Image.PreviewGroup>
                              </div>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: '暂无饮食记录' }}
                />
              ),
            },
            {
              key: 'exercise',
              label: `运动 (${exercises.length})`,
              children: (
                <List
                  dataSource={exercises}
                  renderItem={(exercise) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="text" 
                          size="small" 
                          icon={<EditOutlined />}
                          onClick={() => {
                            setDrawerVisible(false);
                            handleEdit(exercise, 'exercise');
                          }}
                        />,
                        <Popconfirm
                          title="确定删除这条记录吗？"
                          onConfirm={() => handleDelete(exercise.id, 'exercise')}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<ThunderboltOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                        title={
                          <Space>
                            <span>{exercise.duration || 0} 分钟</span>
                            <span>· {exercise.estimatedCalories || 0} 千卡</span>
                            {exercise.isAiPredicted && (
                              <Tag color="blue" style={{ fontSize: 10 }}>AI</Tag>
                            )}
                          </Space>
                        }
                        description={
                          <div>
                            <div>{exercise.description || '无描述'}</div>
                            {exercise.images && exercise.images.length > 0 && (
                              <div style={{ marginTop: 8 }}>
                                <Image.PreviewGroup>
                                  {exercise.images.map((img, idx) => (
                                    <Image
                                      key={idx}
                                      src={img.startsWith('http') ? img : `http://localhost:3001${img}`}
                                      width={60}
                                      height={60}
                                      style={{ objectFit: 'cover', borderRadius: 4, marginRight: 4 }}
                                    />
                                  ))}
                                </Image.PreviewGroup>
                              </div>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: '暂无运动记录' }}
                />
              ),
            },
          ]}
        />
      </Drawer>
    </>
  );
};

export default DailyRecordsBar;

