import React, { useRef, useState } from "react";
import { Button, message, Modal, Space, Typography } from "antd";
import {
  DownloadOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { exportData, importData } from "../utils/api";

const { Text } = Typography;

interface DataBackupProps {
  onDataChange: () => void;
}

export const DataBackup: React.FC<DataBackupProps> = ({ onDataChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportData();
      message.success("数据导出成功！");
    } catch (error) {
      message.error("数据导出失败，请重试");
      console.error("导出失败:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      // 验证文件类型
      if (!file.name.endsWith(".json")) {
        message.error("请选择 JSON 格式的文件");
        return;
      }

      // 设置选中的文件和显示Modal
      setSelectedFile(file);
      setShowImportModal(true);
    } catch (error) {
      message.error("文件读取失败，请检查文件格式");
      console.error("文件读取失败:", error);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    try {
      setImporting(true);
      setShowImportModal(false);
      const result = await importData(selectedFile);
      message.success(`数据导入成功！导入了 ${result.importedRecords} 条记录`);
      onDataChange(); // 重新加载数据
    } catch (error) {
      message.error(
        `数据导入失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    } finally {
      setImporting(false);
      setSelectedFile(null);
    }
  };

  const handleCancelImport = () => {
    setShowImportModal(false);
    setSelectedFile(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
    // 清空 input 值，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      style={{
        background: "white",
        padding: 16,
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        marginBottom: 8,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: 16 }}>
          数据备份
        </Text>
        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
          备份和恢复您的体重记录数据
        </Text>
      </div>

      <Space size="middle">
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={exporting}
        >
          导出数据
        </Button>

        <Button
          icon={<UploadOutlined />}
          onClick={() => fileInputRef.current?.click()}
          loading={importing}
        >
          导入数据
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
      </Space>

      <div style={{ marginTop: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          导出：下载包含所有记录和设置的 JSON 文件
        </Text>
        <br />
        <Text type="secondary" style={{ fontSize: 12 }}>
          导入：从备份文件恢复数据（会覆盖当前数据）
        </Text>
      </div>

      {/* 导入确认Modal */}
      <Modal
        title="确认导入数据"
        open={showImportModal}
        onOk={handleConfirmImport}
        onCancel={handleCancelImport}
        okText="确定导入"
        cancelText="取消"
        okType="danger"
        confirmLoading={importing}
        centered
        maskClosable={false}
      >
        <div>
          <p style={{ marginBottom: 8 }}>
            <ExclamationCircleOutlined
              style={{ color: "#faad14", marginRight: 8 }}
            />
            导入新数据将覆盖当前所有数据。
          </p>
          <p style={{ marginBottom: 8 }}>
            系统会自动备份当前数据，但建议您先手动导出备份。
          </p>
          <p style={{ color: "#ff4d4f", fontWeight: "bold" }}>确定要继续吗？</p>
          {selectedFile && (
            <p style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
              选择的文件：{selectedFile.name}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};
