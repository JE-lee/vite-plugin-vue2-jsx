# GitHub Actions 工作流说明

本项目包含两个 GitHub Actions 工作流，用于自动化构建、测试和发布流程。

## 工作流文件

### 1. Test GitHub Actions Setup (`.github/workflows/test-setup.yml`)

**触发条件：**
- 手动触发（workflow_dispatch）
- 推送到 `copilot/setup-github-actions-release` 分支（用于测试）

**功能：**
- 测试 GitHub Actions 基本功能
- 验证 Node.js 和 pnpm 设置
- 测试依赖安装
- 测试构建过程
- 生成详细的验证摘要

**用途：** 用于验证 GitHub Actions 配置是否正常工作。这是一个测试工作流，可以安全地运行而不会发布任何内容。

### 2. CI Verification (`.github/workflows/verify.yml`)

**触发条件：**
- 推送到 `main` 或 `release` 分支
- 针对 `main` 或 `release` 分支的 Pull Request

**功能：**
- 安装依赖
- 构建项目
- 验证构建产物（dist/index.cjs, dist/index.mjs, dist/index.d.ts）
- 显示包信息

**用途：** 用于验证代码更改不会破坏构建过程，可以在任何分支上运行以确保代码质量。

### 3. Publish to NPM (`.github/workflows/publish-npm.yml`)

**触发条件：**
- 仅在推送到 `release` 分支时触发

**功能：**
1. **Test Job（测试阶段）：**
   - 检出代码
   - 设置 Node.js 和 pnpm
   - 安装依赖
   - 构建项目
   - 验证构建产物

2. **Publish Job（发布阶段）：**
   - 等待测试阶段成功完成
   - 构建项目
   - 发布到 NPM
   - 创建 GitHub Release

## 配置要求

### NPM Token
要使发布工作流正常工作，需要在 GitHub 仓库中配置 NPM Token：

1. 登录到 [npmjs.com](https://www.npmjs.com/)
2. 生成一个 Automation Token：
   - 进入 Account Settings → Access Tokens
   - 点击 "Generate New Token"
   - 选择 "Automation" 类型
   - 复制生成的 token

3. 在 GitHub 仓库中添加 Secret：
   - 进入仓库的 Settings → Secrets and variables → Actions
   - 点击 "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: 粘贴你的 NPM token
   - 点击 "Add secret"

### GitHub Token
`GITHUB_TOKEN` 是 GitHub Actions 自动提供的，无需额外配置。

## 发布流程

要发布新版本到 NPM：

1. **更新版本号**
   ```bash
   npm version patch  # 或 minor, major
   ```

2. **推送到 release 分支**
   ```bash
   git push origin release
   ```

3. **自动流程**
   - GitHub Actions 自动触发
   - 运行测试和构建
   - 发布到 NPM
   - 创建 GitHub Release

## 验证工作流

可以通过以下方式验证工作流配置是否正确：

### 方法 1: 使用测试工作流（推荐）

1. 进入 GitHub 仓库的 Actions 标签页
2. 选择 "Test GitHub Actions Setup" 工作流
3. 点击 "Run workflow" 按钮
4. 选择分支并点击 "Run workflow"
5. 查看运行结果，所有步骤应该显示绿色勾选标记

### 方法 2: 使用 Pull Request

1. 创建一个 Pull Request 到 `main` 或 `release` 分支
2. CI Verification 工作流会自动运行
3. 检查 GitHub Actions 标签页查看运行结果

## 注意事项

- 确保 `package.json` 中的版本号在每次发布前都已更新
- 发布工作流使用 `--no-git-checks` 标志，允许在没有 git tag 的情况下发布
- 创建的 GitHub Release 会自动使用 `package.json` 中的版本号
- 所有构建产物必须存在（index.cjs, index.mjs, index.d.ts）才能通过验证

## 故障排查

如果工作流失败：

1. **构建失败**：检查代码是否可以在本地成功构建
2. **发布失败**：
   - 验证 NPM_TOKEN 是否正确配置
   - 检查版本号是否已在 NPM 上存在
   - 确认 NPM 账户有发布权限
3. **Release 创建失败**：检查是否已存在相同标签的 Release
