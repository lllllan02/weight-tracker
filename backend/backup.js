const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 创建备份
function createBackup() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      console.log('❌ 数据文件不存在，无法创建备份');
      return false;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);
    
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    fs.writeFileSync(backupFile, data, 'utf-8');
    
    console.log(`✅ 备份创建成功: ${backupFile}`);
    return true;
  } catch (error) {
    console.error('❌ 创建备份失败:', error.message);
    return false;
  }
}

// 列出所有备份
function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);

    console.log('📋 可用备份列表:');
    if (backups.length === 0) {
      console.log('  暂无备份文件');
    } else {
      backups.forEach((backup, index) => {
        console.log(`  ${index + 1}. ${backup.filename}`);
        console.log(`     大小: ${backup.size} bytes`);
        console.log(`     创建时间: ${backup.created.toLocaleString()}`);
        console.log('');
      });
    }
    return backups;
  } catch (error) {
    console.error('❌ 列出备份失败:', error.message);
    return [];
  }
}

// 恢复备份
function restoreBackup(backupIndex) {
  try {
    const backups = listBackups();
    
    if (backups.length === 0) {
      console.log('❌ 没有可用的备份文件');
      return false;
    }

    if (backupIndex < 1 || backupIndex > backups.length) {
      console.log(`❌ 无效的备份索引，请输入 1-${backups.length}`);
      return false;
    }

    const selectedBackup = backups[backupIndex - 1];
    const backupFile = path.join(BACKUP_DIR, selectedBackup.filename);
    
    // 先创建当前数据的备份
    createBackup();
    
    // 恢复选中的备份
    const backupData = fs.readFileSync(backupFile, 'utf-8');
    fs.writeFileSync(DATA_FILE, backupData, 'utf-8');
    
    console.log(`✅ 备份恢复成功: ${selectedBackup.filename}`);
    return true;
  } catch (error) {
    console.error('❌ 恢复备份失败:', error.message);
    return false;
  }
}

// 清理旧备份
function cleanupBackups(keepCount = 10) {
  try {
    const backups = listBackups();
    
    if (backups.length <= keepCount) {
      console.log(`📋 当前备份数量 (${backups.length}) 不超过保留数量 (${keepCount})，无需清理`);
      return true;
    }

    const toDelete = backups.slice(keepCount);
    let deletedCount = 0;

    toDelete.forEach(backup => {
      try {
        const backupFile = path.join(BACKUP_DIR, backup.filename);
        fs.unlinkSync(backupFile);
        console.log(`🗑️  删除备份: ${backup.filename}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ 删除备份失败 ${backup.filename}:`, error.message);
      }
    });

    console.log(`✅ 清理完成，删除了 ${deletedCount} 个旧备份`);
    return true;
  } catch (error) {
    console.error('❌ 清理备份失败:', error.message);
    return false;
  }
}

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      createBackup();
      break;
    case 'list':
      listBackups();
      break;
    case 'restore':
      const index = parseInt(process.argv[3]);
      if (isNaN(index)) {
        console.log('❌ 请提供有效的备份索引');
        console.log('用法: node backup.js restore <index>');
      } else {
        restoreBackup(index);
      }
      break;
    case 'cleanup':
      const keepCount = parseInt(process.argv[3]) || 10;
      cleanupBackups(keepCount);
      break;
    default:
      console.log('📋 数据备份工具');
      console.log('');
      console.log('用法:');
      console.log('  node backup.js create     - 创建备份');
      console.log('  node backup.js list       - 列出所有备份');
      console.log('  node backup.js restore <index> - 恢复指定备份');
      console.log('  node backup.js cleanup [count] - 清理旧备份（保留指定数量）');
      console.log('');
      console.log('示例:');
      console.log('  node backup.js create');
      console.log('  node backup.js list');
      console.log('  node backup.js restore 1');
      console.log('  node backup.js cleanup 5');
  }
}

module.exports = {
  createBackup,
  listBackups,
  restoreBackup,
  cleanupBackups
}; 