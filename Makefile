.PHONY: help install install-backend install-frontend start dev start-backend start-frontend stop clean

# 默认目标
help:
	@echo "🎯 体重记录应用 - 可用命令："
	@echo ""
	@echo "  make install          - 安装所有依赖"
	@echo "  make install-backend  - 仅安装后端依赖"
	@echo "  make install-frontend - 仅安装前端依赖"
	@echo "  make dev              - 同时启动前后端服务"
	@echo "  make start            - 同时启动前后端服务（同 dev）"
	@echo "  make start-backend    - 仅启动后端服务"
	@echo "  make start-frontend   - 仅启动前端服务"
	@echo "  make stop             - 停止所有服务"
	@echo "  make clean            - 清理所有依赖"
	@echo ""

# 安装所有依赖
install: install-backend install-frontend
	@echo "✅ 所有依赖安装完成！"

# 安装后端依赖
install-backend:
	@echo "📦 安装后端依赖..."
	@cd backend && npm install

# 安装前端依赖
install-frontend:
	@echo "📦 安装前端依赖..."
	@npm install


# 开发模式：同时启动前后端
dev: stop
	@echo "🚀 启动体重记录应用..."
	@if [ ! -d "backend/node_modules" ]; then \
		echo "📦 安装后端依赖..."; \
		cd backend && npm install && cd ..; \
	fi
	@if [ ! -d "node_modules" ]; then \
		echo "📦 安装前端依赖..."; \
		npm install; \
	fi
	@echo "🔧 启动后端服务 (端口 3001)..."
	@cd backend && npm start &
	@sleep 3
	@echo "🌐 启动前端应用 (端口 3000)..."
	@npm start &
	@echo "✅ 应用启动完成！"
	@echo "📱 前端地址: http://localhost:3000"
	@echo "🔧 后端地址: http://localhost:3001"
	@echo ""
	@echo "运行 'make stop' 停止所有服务"
	@echo "或按 Ctrl+C 停止"

# 仅启动后端
start-backend:
	@echo "🔧 启动后端服务 (端口 3001)..."
	@if [ ! -d "backend/node_modules" ]; then \
		echo "📦 安装后端依赖..."; \
		cd backend && npm install && cd ..; \
	fi
	@cd backend && npm start

# 仅启动前端
start-frontend:
	@echo "🌐 启动前端应用 (端口 3000)..."
	@if [ ! -d "node_modules" ]; then \
		echo "📦 安装前端依赖..."; \
		npm install; \
	fi
	@npm start

# 停止所有服务
stop:
	@echo "🛑 正在停止服务..."
	@pkill -f "node.*backend.*server.js" 2>/dev/null || true
	@pkill -f "react-scripts start" 2>/dev/null || true
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@echo "✅ 服务已停止"

# 清理依赖
clean:
	@echo "🧹 清理依赖..."
	@rm -rf node_modules
	@rm -rf backend/node_modules
	@echo "✅ 清理完成"

