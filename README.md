# 数字叠叠乐：求和挑战 (SumStack)

一款基于 React + Vite + Tailwind CSS 开发的数学消除类益智游戏。

## 核心玩法
- **目标**：点击方块使数字之和等于顶部的“目标数字”。
- **消除**：成功求和后方块消失。
- **失败条件**：方块堆积到屏幕顶部。
- **模式**：
  - **经典模式**：每次成功消除后新增一行。
  - **计时模式**：每 10 秒强制新增一行。

## 本地开发

1. 安装依赖：
   ```bash
   npm install
   ```
2. 启动开发服务器：
   ```bash
   npm run dev
   ```

## 部署到 Vercel 指南

### 第一步：同步到 GitHub
1. 在 GitHub 上创建一个新的仓库（例如 `sumstack-game`）。
2. 在本地项目目录运行：
   ```bash
   git init
   ```
3. 添加并提交代码：
   ```bash
   git add .
   git commit -m "Initial commit"
   ```
4. 关联远程仓库并推送：
   ```bash
   git remote add origin https://github.com/您的用户名/sumstack-game.git
   git branch -M main
   git push -u origin main
   ```

### 第二步：在 Vercel 上部署
1. 登录 [Vercel 官网](https://vercel.com/)。
2. 点击 **"Add New"** -> **"Project"**。
3. 导入您刚才创建的 GitHub 仓库。
4. **关键配置：环境变量 (Environment Variables)**
   - 在部署设置中，找到 **Environment Variables** 部分。
   - 添加 `GEMINI_API_KEY`：填入您的 Google AI SDK 密钥（如果游戏中使用了 AI 功能）。
5. 点击 **"Deploy"**。

## 技术栈
- **框架**: React 19
- **构建工具**: Vite
- **样式**: Tailwind CSS 4
- **动画**: Motion (Framer Motion)
- **图标**: Lucide React
