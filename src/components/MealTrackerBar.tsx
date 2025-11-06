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
  Alert,
  Typography,
} from 'antd';
import {
  FireOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  CameraOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';
import { createMeal, getMeals, deleteMeal, reanalyzeMeal, getDailyCalories, updateMeal, predictMealCalories } from '../utils/api';
import type { MealRecord, DailyCalories } from '../types';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Paragraph } = Typography;

interface MealTrackerBarProps {
  refresh?: number;
  onSuccess?: () => void;
  selectedDate?: Date; // 选中的日期，用于添加记录
}

const MealTrackerBar: React.FC<MealTrackerBarProps> = ({ refresh, onSuccess, selectedDate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealRecord | null>(null);
  const [listDrawerVisible, setListDrawerVisible] = useState(false);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [dailyCalories, setDailyCalories] = useState<DailyCalories | null>(null);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [aiPredicting, setAiPredicting] = useState(false);
  const [predictedCalories, setPredictedCalories] = useState<number | null>(null);
  const [isAIPredicted, setIsAIPredicted] = useState(false); // 标记是否是AI预测且未修改

  const loadMeals = useCallback(async () => {
    try {
      // 使用选中的日期，如果没有则使用今天
      const targetDate = selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
      
      const result = await getMeals({ date: targetDate });
      if (result.success) {
        setMeals(result.meals || []);
      }

      const caloriesResult = await getDailyCalories(targetDate);
      if (caloriesResult.success) {
        setDailyCalories(caloriesResult);
      }
    } catch (error: any) {
      console.error('加载饮食记录失败:', error);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals, refresh]);

  const handleAIPredict = async () => {
    try {
      setAiPredicting(true);
      
      const values = form.getFieldsValue();
      const description = values.description || '';
      const mealType = values.mealType || 'other';
      
      if (!description && fileList.length === 0) {
        message.warning('请先输入食物描述或上传图片');
        setAiPredicting(false);
        return;
      }
      
      // 创建FormData进行预测
      const formData = new FormData();
      formData.append('description', description);
      formData.append('mealType', mealType);
      
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });
      
      // 调用预测API
      const result = await predictMealCalories(formData);
      
      if (result.success && result.calories !== null) {
        setPredictedCalories(result.calories);
        setIsAIPredicted(true); // 标记为AI预测
        form.setFieldsValue({ calories: result.calories });
        message.success(`AI预测：${result.calories}千卡`);
      } else {
        message.error(result.error || 'AI预测失败，请稍后重试');
      }
    } catch (error: any) {
      console.error('AI预测失败:', error);
      message.error('AI预测失败，请稍后重试');
    } finally {
      setAiPredicting(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // 使用选中的日期，如果没有则使用当前日期
      const targetDate = selectedDate || new Date();
      
      const formData = new FormData();
      formData.append('description', values.description || '');
      formData.append('mealType', values.mealType || 'other');
      formData.append('date', targetDate.toISOString());
      
      // 如果用户输入了热量
      if (values.calories && !isNaN(Number(values.calories))) {
        formData.append('manualCalories', values.calories.toString());
        // 如果是AI预测且未修改，标记为AI预测；否则标记为手动输入
        if (isAIPredicted) {
          formData.append('aiPredicted', 'true'); // 标记为AI预测
        } else {
          formData.append('skipAI', 'true'); // 手动输入，跳过AI
        }
      }

      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });

      const result = await createMeal(formData);

      if (result.success) {
        const msg = values.calories ? '饮食记录已创建' : '饮食记录已创建，AI正在分析中...';
        message.success(msg);
        form.resetFields();
        setFileList([]);
        setPredictedCalories(null);
        setIsAIPredicted(false); // 重置AI预测标志
        setAddModalVisible(false);
        // 延迟加载，确保后端已写入数据
        setTimeout(() => {
          loadMeals();
          if (onSuccess) {
            onSuccess();
          }
        }, 300);
      } else {
        message.error(result.error || '创建失败');
      }
    } catch (error: any) {
      console.error('创建饮食记录失败:', error);
      message.error(error.message || '创建失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteMeal(id);
      if (result.success) {
        message.success('已删除');
        loadMeals();
      }
    } catch (error: any) {
      message.error('删除失败');
    }
  };

  const handleReanalyze = async (id: string) => {
    try {
      setAnalyzingIds((prev) => new Set(prev).add(id));
      const result = await reanalyzeMeal(id);
      if (result.success) {
        message.success('重新分析完成');
        loadMeals();
      } else {
        message.error(result.error || '分析失败');
      }
    } catch (error: any) {
      message.error('分析失败');
    } finally {
      setAnalyzingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleEdit = (meal: MealRecord) => {
    setEditingMeal(meal);
    form.setFieldsValue({
      description: meal.description,
      mealType: meal.mealType,
      calories: meal.estimatedCalories,
    });
    setPredictedCalories(meal.estimatedCalories);
    // 如果是AI预测的记录，保持AI预测标志
    setIsAIPredicted(meal.aiAnalysis === 'AI预测');
    // 不设置 fileList，让用户重新选择图片
    setFileList([]);
    setEditModalVisible(true);
  };

  const handleUpdate = async (values: any) => {
    if (!editingMeal) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('description', values.description || '');
      formData.append('mealType', values.mealType || 'other');
      formData.append('keepExistingImages', 'true'); // 保留现有图片
      
      // 如果用户输入了热量
      if (values.calories && !isNaN(Number(values.calories))) {
        formData.append('manualCalories', values.calories.toString());
        // 如果是AI预测且未修改，标记为AI预测；否则标记为手动输入
        if (isAIPredicted) {
          formData.append('aiPredicted', 'true');
        } else {
          formData.append('skipAI', 'true');
        }
      }

      // 添加新上传的图片
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });

      const result = await updateMeal(editingMeal.id, formData);

      if (result.success) {
        message.success('饮食记录已更新');
        form.resetFields();
        setFileList([]);
        setPredictedCalories(null);
        setIsAIPredicted(false); // 重置AI预测标志
        setEditModalVisible(false);
        setEditingMeal(null);
        setTimeout(() => {
          loadMeals();
          if (onSuccess) {
            onSuccess();
          }
        }, 300);
      } else {
        message.error(result.error || '更新失败');
      }
    } catch (error: any) {
      console.error('更新饮食记录失败:', error);
      message.error(error.message || '更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleBeforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB！');
      return false;
    }

    return false;
  };

  const handleChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);
  };

  const mealTypeLabels: Record<string, { label: string; color: string }> = {
    breakfast: { label: '早餐', color: 'orange' },
    lunch: { label: '午餐', color: 'green' },
    dinner: { label: '晚餐', color: 'blue' },
    snack: { label: '零食', color: 'purple' },
    other: { label: '其他', color: 'default' },
  };

  const confidenceLabels: Record<string, { label: string; color: string }> = {
    high: { label: '高', color: 'success' },
    medium: { label: '中', color: 'warning' },
    low: { label: '低', color: 'error' },
  };

  return (
    <>
      <Card 
        style={{ marginBottom: 12 }}
        bodyStyle={{ padding: '16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* 左侧统计信息 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#999' }}>
                {selectedDate ? dayjs(selectedDate).format('M月D日') : '今日'}热量
              </div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#cf1322' }}>
                <FireOutlined /> {dailyCalories?.totalCalories || 0}
              </div>
            </div>
            <div style={{ height: 40, width: 1, background: '#f0f0f0' }} />
          </div>

          {/* 中间饮食记录列表 */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            {meals.length === 0 ? (
              <div style={{ color: '#999', fontSize: 14 }}>
                {selectedDate ? 
                  `${dayjs(selectedDate).format('M月D日')}还没有饮食记录，点击右侧按钮开始记录` :
                  '今天还没有饮食记录，点击右侧按钮开始记录'
                }
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {meals.map((meal) => {
                  const mealTypeInfo = mealTypeLabels[meal.mealType] || mealTypeLabels.other;
                  const hasAnalysis = meal.estimatedCalories !== null;
                  
                  return (
                    <div
                      key={meal.id}
                      onClick={() => setListDrawerVisible(true)}
                      style={{
                        padding: '8px 10px',
                        background: '#fafafa',
                        borderRadius: 6,
                        border: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                        display: 'flex',
                        gap: 10,
                        minWidth: 140,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f0f0f0';
                        e.currentTarget.style.borderColor = '#d9d9d9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fafafa';
                        e.currentTarget.style.borderColor = '#f0f0f0';
                      }}
                    >
                      {/* 左侧：竖着显示餐次标签 */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minWidth: 16,
                          color: mealTypeInfo.color || '#1890ff',
                          fontWeight: 'bold',
                          fontSize: 13,
                          lineHeight: '16px',
                          letterSpacing: 2,
                        }}
                      >
                        {mealTypeInfo.label.split('').map((char, idx) => (
                          <div key={idx}>{char}</div>
                        ))}
                      </div>

                      {/* 中间：竖线分隔 */}
                      <div
                        style={{
                          width: 1,
                          background: '#e0e0e0',
                          flexShrink: 0,
                        }}
                      />

                      {/* 右侧：内容区 */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 40 }}>
                        {/* 右上角：描述 */}
                        <div
                          style={{
                            fontSize: 12,
                            color: '#666',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 100,
                          }}
                        >
                          {meal.description || '（无描述）'}
                          {meal.images && meal.images.length > 0 && (
                            <span style={{ marginLeft: 4, color: '#999' }}>📷{meal.images.length}</span>
                          )}
                        </div>

                        {/* 右下角：热量 */}
                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {hasAnalysis ? (
                            <>
                              <span style={{ fontSize: 13, fontWeight: 'bold', color: '#cf1322' }}>
                                {meal.estimatedCalories}千卡
                              </span>
                              {meal.aiAnalysis === 'AI预测' && (
                                <span style={{ 
                                  fontSize: 9, 
                                  color: '#1890ff', 
                                  background: '#e6f7ff', 
                                  padding: '1px 4px', 
                                  borderRadius: 2,
                                  lineHeight: '14px',
                                  border: '1px solid #91d5ff'
                                }}>
                                  AI
                                </span>
                              )}
                            </>
                          ) : (
                            <span style={{ fontSize: 11, color: '#999' }}>
                              <LoadingOutlined /> 分析中
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 右侧操作按钮 */}
          <div style={{ flexShrink: 0 }}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddModalVisible(true)}
              >
                记录
              </Button>
              {meals.length > 0 && (
                <Button
                  icon={<UnorderedListOutlined />}
                  onClick={() => setListDrawerVisible(true)}
                >
                  详情
                </Button>
              )}
            </Space>
          </div>
        </div>
      </Card>

      {/* 添加饮食记录的弹窗 */}
      <Modal
        title={
          <Space>
            <CameraOutlined />
            <span>
              记录饮食
              {selectedDate && ` - ${dayjs(selectedDate).format('YYYY年M月D日')}`}
            </span>
          </Space>
        }
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          form.resetFields();
          setFileList([]);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ mealType: 'other' }}
        >
          <Form.Item label="餐次" name="mealType">
            <Select>
              <Option value="breakfast">🌅 早餐</Option>
              <Option value="lunch">🌞 午餐</Option>
              <Option value="dinner">🌙 晚餐</Option>
              <Option value="snack">🍪 零食</Option>
              <Option value="other">🍽️ 其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="食物描述"
            name="description"
            rules={[
              {
                validator: (_, value) => {
                  if (!value && fileList.length === 0) {
                    return Promise.reject('请输入食物描述或上传图片');
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="描述你吃了什么，比如：一碗米饭、半份青菜、100克鸡胸肉"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item label="热量（千卡）">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="calories" noStyle>
                <Input
                  type="number"
                  placeholder="可手动输入热量，或点击AI预测"
                  min={0}
                  max={5000}
                  onChange={() => {
                    // 用户手动修改了数字，清除AI预测标志
                    setIsAIPredicted(false);
                  }}
                />
              </Form.Item>
              <Button
                type="primary"
                icon={<FireOutlined />}
                onClick={handleAIPredict}
                loading={aiPredicting}
                disabled={aiPredicting}
              >
                AI预测
              </Button>
            </Space.Compact>
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              {predictedCalories !== null 
                ? `AI预测：${predictedCalories}千卡（可直接使用或修改）` 
                : '不填写则自动使用AI预测，或手动输入后AI将不再预测'
              }
            </div>
          </Form.Item>

          <Form.Item label="上传图片（可选）">
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={handleBeforeUpload}
              onChange={handleChange}
              onRemove={(file) => {
                const index = fileList.indexOf(file);
                const newFileList = fileList.slice();
                newFileList.splice(index, 1);
                setFileList(newFileList);
              }}
              maxCount={5}
            >
              {fileList.length < 5 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
              支持 JPG、PNG、WebP 格式，最多5张，单张不超过5MB
            </div>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setAddModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
                添加记录
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑饮食记录的弹窗 */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>编辑饮食记录</span>
          </Space>
        }
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingMeal(null);
          form.resetFields();
          setFileList([]);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item label="餐次" name="mealType">
            <Select>
              <Option value="breakfast">🌅 早餐</Option>
              <Option value="lunch">🌞 午餐</Option>
              <Option value="dinner">🌙 晚餐</Option>
              <Option value="snack">🍪 零食</Option>
              <Option value="other">🍽️ 其他</Option>
            </Select>
          </Form.Item>

          <Form.Item label="食物描述" name="description">
            <TextArea
              rows={3}
              placeholder="描述你吃了什么，比如：一碗米饭、半份青菜、100克鸡胸肉"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item label="热量（千卡）">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="calories" noStyle>
                <Input
                  type="number"
                  placeholder="可手动输入热量，或点击AI预测"
                  min={0}
                  max={5000}
                  onChange={() => {
                    // 用户手动修改了数字，清除AI预测标志
                    setIsAIPredicted(false);
                  }}
                />
              </Form.Item>
              <Button
                type="primary"
                icon={<FireOutlined />}
                onClick={handleAIPredict}
                loading={aiPredicting}
                disabled={aiPredicting}
              >
                AI预测
              </Button>
            </Space.Compact>
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              {predictedCalories !== null 
                ? `AI预测：${predictedCalories}千卡（可直接使用或修改）` 
                : '不填写则自动使用AI预测，或手动输入后AI将不再预测'
              }
            </div>
          </Form.Item>

          {editingMeal && editingMeal.images && editingMeal.images.length > 0 && (
            <Form.Item label="现有图片">
              <div style={{ marginBottom: 8 }}>
                <Image.PreviewGroup>
                  <Space>
                    {editingMeal.images.map((url, index) => (
                      <Image
                        key={index}
                        src={`http://localhost:3001${url}`}
                        alt={`existing-${index}`}
                        width={80}
                        height={80}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </div>
              <div style={{ color: '#999', fontSize: 12 }}>
                现有图片将保留，您可以继续添加新图片
              </div>
            </Form.Item>
          )}

          <Form.Item label="添加新图片（可选）">
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={handleBeforeUpload}
              onChange={handleChange}
              onRemove={(file) => {
                const index = fileList.indexOf(file);
                const newFileList = fileList.slice();
                newFileList.splice(index, 1);
                setFileList(newFileList);
              }}
              maxCount={5}
            >
              {fileList.length < 5 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
            <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
              支持 JPG、PNG、WebP 格式，最多5张，单张不超过5MB
            </div>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  setEditingMeal(null);
                  form.resetFields();
                  setFileList([]);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading} icon={<EditOutlined />}>
                保存修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 饮食记录列表的抽屉 */}
      <Drawer
        title={
          <Space>
            <FireOutlined />
            <span>
              {selectedDate ? 
                `${dayjs(selectedDate).format('M月D日')}饮食详情` :
                '今日饮食详情'
              }
            </span>
          </Space>
        }
        placement="right"
        width={500}
        open={listDrawerVisible}
        onClose={() => setListDrawerVisible(false)}
      >
        {meals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            {selectedDate ? 
              `${dayjs(selectedDate).format('M月D日')}还没有饮食记录` :
              '今天还没有饮食记录'
            }
          </div>
        ) : (
          <List
            dataSource={meals}
            renderItem={(meal) => {
              const mealTypeInfo = mealTypeLabels[meal.mealType] || mealTypeLabels.other;
              const isAnalyzing = analyzingIds.has(meal.id);
              const hasAnalysis = meal.estimatedCalories !== null;
              const confidenceInfo = meal.details?.confidence
                ? confidenceLabels[meal.details.confidence]
                : null;

              return (
                <List.Item
                  key={meal.id}
                  style={{
                    padding: '16px',
                    background: '#fafafa',
                    marginBottom: 12,
                    borderRadius: 8,
                  }}
                  actions={[
                    <Button
                      icon={<EditOutlined />}
                      size="small"
                      onClick={() => {
                        handleEdit(meal);
                        setListDrawerVisible(false);
                      }}
                      title="编辑"
                    />,
                    <Button
                      icon={<ReloadOutlined />}
                      size="small"
                      onClick={() => handleReanalyze(meal.id)}
                      loading={isAnalyzing}
                      disabled={isAnalyzing}
                      title="重新分析"
                    />,
                    <Popconfirm
                      title="确定要删除这条记录吗？"
                      onConfirm={() => handleDelete(meal.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button icon={<DeleteOutlined />} size="small" danger />
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={mealTypeInfo.color}>{mealTypeInfo.label}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <ClockCircleOutlined /> {dayjs(meal.date).format('HH:mm')}
                        </Text>
                        {hasAnalysis ? (
                          <>
                            <Tag icon={<FireOutlined />} color="red">
                              {meal.estimatedCalories} 千卡
                            </Tag>
                            {meal.aiAnalysis === 'AI预测' ? (
                              <Tag color="blue" style={{ fontSize: 10, padding: '0 4px', lineHeight: '18px' }}>
                                AI预测
                              </Tag>
                            ) : (
                              confidenceInfo && (
                                <Tag color={confidenceInfo.color} style={{ fontSize: 11 }}>
                                  {confidenceInfo.label}
                                </Tag>
                              )
                            )}
                          </>
                        ) : (
                          <Tag icon={<LoadingOutlined />} color="processing">
                            分析中...
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        {meal.description && (
                          <Paragraph
                            style={{ marginBottom: 8, marginTop: 8 }}
                            ellipsis={{ rows: 2, expandable: true }}
                          >
                            {meal.description}
                          </Paragraph>
                        )}

                        {meal.images && meal.images.length > 0 && (
                          <Image.PreviewGroup>
                            <Space style={{ marginBottom: 8 }}>
                              {meal.images.map((url, index) => (
                                <Image
                                  key={index}
                                  src={`http://localhost:3001${url}`}
                                  alt={`meal-${index}`}
                                  width={60}
                                  height={60}
                                  style={{ objectFit: 'cover', borderRadius: 4 }}
                                />
                              ))}
                            </Space>
                          </Image.PreviewGroup>
                        )}

                        {meal.aiAnalysis && meal.aiAnalysis !== 'AI预测' && (
                          <Alert
                            message={meal.aiAnalysis}
                            type="info"
                            showIcon
                            icon={<InfoCircleOutlined />}
                            style={{ marginTop: 8, fontSize: 12 }}
                          />
                        )}

                        {meal.details?.breakdown && meal.details.breakdown.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              食物：
                            </Text>
                            <div style={{ marginTop: 4 }}>
                              {meal.details.breakdown.map((item, index) => (
                                <Tag key={index} style={{ marginBottom: 4 }}>
                                  {item.food} ({item.amount}): {item.calories}千卡
                                </Tag>
                              ))}
                            </div>
                          </div>
                        )}

                        {meal.details?.nutrients && (
                          <div style={{ marginTop: 8 }}>
                            <Space size="small">
                              <Tag color="blue">蛋白 {meal.details.nutrients.protein}g</Tag>
                              <Tag color="orange">碳水 {meal.details.nutrients.carbs}g</Tag>
                              <Tag color="red">脂肪 {meal.details.nutrients.fat}g</Tag>
                            </Space>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Drawer>
    </>
  );
};

export default MealTrackerBar;

