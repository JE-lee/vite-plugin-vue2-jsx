# GitHub Actions Setup

This repository includes automated CI/CD workflows using GitHub Actions for building, testing, and publishing the package to NPM.

## Workflows Overview

### 1. Test GitHub Actions Setup (`test-setup.yml`)

**Triggers:**
- Manual dispatch (workflow_dispatch)
- Push to `copilot/setup-github-actions-release` branch (for testing)

**Purpose:** Safely verify that GitHub Actions is configured correctly without publishing anything.

**What it does:**
- ✅ Tests basic GitHub Actions functionality
- ✅ Verifies Node.js and pnpm setup
- ✅ Tests dependency installation
- ✅ Tests build process
- ✅ Provides detailed verification summary

### 2. CI Verification (`verify.yml`)

**Triggers:**
- Push to `main` or `release` branches
- Pull requests targeting `main` or `release` branches

**Purpose:** Continuous integration checks to ensure code changes don't break the build.

**What it does:**
- Installs dependencies
- Builds the project
- Verifies build artifacts (dist/index.cjs, dist/index.mjs, dist/index.d.ts)
- Displays package information

### 3. Publish to NPM (`publish-npm.yml`)

**Triggers:**
- Push to `release` branch only

**Purpose:** Automated publishing to NPM and creating GitHub releases.

**Workflow stages:**

1. **Test Stage:**
   - Checkout code
   - Setup Node.js and pnpm
   - Install dependencies
   - Build project
   - Verify build artifacts

2. **Publish Stage** (runs after test passes):
   - Build project
   - Publish to NPM
   - Create GitHub Release with version tag

## Setup Instructions

### Required: NPM Token Configuration

To enable NPM publishing, you need to configure an NPM authentication token:

1. **Generate NPM Token:**
   - Log in to [npmjs.com](https://www.npmjs.com/)
   - Go to Account Settings → Access Tokens
   - Click "Generate New Token"
   - Select "Automation" type
   - Copy the generated token

2. **Add Token to GitHub:**
   - Go to your repository Settings
   - Navigate to Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your NPM token
   - Click "Add secret"

**Note:** `GITHUB_TOKEN` is automatically provided by GitHub Actions.

## Publishing a New Version

Follow these steps to publish a new version:

1. **Update version:**
   ```bash
   npm version patch  # or minor, or major
   ```

2. **Push to release branch:**
   ```bash
   git push origin release
   ```

3. **Automatic process:**
   - GitHub Actions triggers automatically
   - Runs tests and builds
   - Publishes to NPM
   - Creates GitHub Release

## Verifying the Setup

### Method 1: Manual Test (Recommended)

1. Go to the "Actions" tab in your GitHub repository
2. Select "Test GitHub Actions Setup" workflow
3. Click "Run workflow" button
4. Select the branch and click "Run workflow"
5. Wait for completion and verify all steps pass ✅

### Method 2: Pull Request Test

1. Create a Pull Request to `main` or `release` branch
2. The CI Verification workflow will automatically run
3. Check the Actions tab to see the results

## Build Artifacts

The following files must be present after a successful build:

- `dist/index.cjs` - CommonJS module
- `dist/index.mjs` - ES module
- `dist/index.d.ts` - TypeScript definitions

All workflows verify these artifacts exist before proceeding.

## Troubleshooting

### Build Failures

- Verify the code builds successfully locally: `pnpm run build`
- Check for TypeScript or linting errors
- Ensure all dependencies are properly installed

### Publish Failures

1. **Authentication Error:**
   - Verify `NPM_TOKEN` is correctly set in repository secrets
   - Ensure the token has not expired
   - Confirm the token has publish permissions

2. **Version Conflict:**
   - Check if the version already exists on NPM
   - Ensure `package.json` version was updated

3. **Permission Denied:**
   - Verify your NPM account has publish rights for the package
   - Check if the package name is available (for first publish)

### Release Creation Failures

- Check if a release with the same tag already exists
- Verify `GITHUB_TOKEN` has proper permissions (usually automatic)

## Workflow Files Location

All workflow files are located in `.github/workflows/`:

- `test-setup.yml` - Setup verification workflow
- `verify.yml` - CI verification workflow
- `publish-npm.yml` - NPM publish workflow

## Additional Notes

- The publish workflow uses `--no-git-checks` flag to allow publishing without git tags
- GitHub Releases are automatically created using the version from `package.json`
- All builds use pnpm with caching for faster execution
- Node.js version 18 is used for all workflows
