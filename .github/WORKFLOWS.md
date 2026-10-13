# GitHub Workflows Guide

This repository uses a streamlined workflow system designed to prevent conflicts and ensure reliable releases.

## Workflow Overview

### 1. **🔄 Continuous Integration** (`ci.yml`)
- **Trigger**: Push to main, Pull requests
- **Purpose**: Automated testing and quality checks
- **Jobs**:
  - 🧪 **Quality Assurance & Testing**: Comprehensive testing, building, and validation
  - 🤖 **Auto-merge Dependabot PRs**: Automatically merges dependency updates if tests pass
- **Features**:
  - Runs tests and builds on every push/PR
  - Auto-merges Dependabot PRs if tests pass
  - Uploads build artifacts for main branch commits
  - Ignores documentation-only changes

### 2. **🚀 Release & Publish Package** (`release-and-publish.yml`)
- **Trigger**: Manual workflow dispatch only
- **Purpose**: Unified release creation and package publishing
- **Jobs**:
  - 🔍 **Pre-Release Validation & Testing**: Comprehensive validation before release
  - 🏷️ **Create GitHub Release**: Version bumping and GitHub release creation
  - 📦 **Publish Package to Registries**: Parallel publishing to NPM and GitHub Packages
  - 📣 **Send Release Completion Notifications**: Final status reporting
- **Features**:
  - Version bumping (patch/minor/major)
  - Automatic changelog generation
  - Publishes to both NPM and GitHub Packages
  - Dry run mode for testing
  - Emergency skip tests option
  - Comprehensive status reporting

### 3. **🔒 Dependency Security & Updates** (`dependencies.yml`)
- **Trigger**: Weekly schedule (Mondays 9 AM UTC) + Manual
- **Purpose**: Automated dependency updates and security auditing
- **Jobs**:
  - 🔒 **Security Vulnerability Audit**: Scans for high/critical vulnerabilities
  - 🔄 **Update Outdated Dependencies**: Updates dependencies and creates PR
- **Features**:
  - Security audit with high/critical vulnerability detection
  - Automated dependency updates via PR
  - Full test suite validation after updates
  - Auto-merge eligible for CI-passing dependency PRs

### 4. **🆘 Emergency Hotfix Publisher** (`emergency-publish.yml`)
- **Trigger**: Manual workflow dispatch with confirmation
- **Purpose**: Critical hotfix publishing
- **Jobs**:
  - 🚨 **Execute Emergency Hotfix Publication**: Rapid deployment with minimal testing
  - 🚫 **Block Invalid Emergency Publication Request**: Safety validation
- **Features**:
  - Requires "EMERGENCY" confirmation
  - Bypasses normal release process
  - Quick testing only
  - Publishes current version immediately
  - Requires follow-up proper release

## Usage Instructions

### Normal Release Process
1. **Go to Actions** → **🚀 Release & Publish Package**
2. **Click "Run workflow"**
3. **Select version type**: patch/minor/major
4. **Optional**: Enable dry run to preview
5. **Click "Run workflow"**

The workflow will:
- 🔍 **Pre-Release Validation**: Run comprehensive tests and validation
- 🏷️ **Create GitHub Release**: Bump version and create release with changelog
- 📦 **Publish to Registries**: Deploy to NPM and GitHub Packages in parallel
- 📣 **Send Notifications**: Provide comprehensive status reports

### Emergency Release
1. **Go to Actions** → **🆘 Emergency Hotfix Publisher**
2. **Type "EMERGENCY"** in confirmation field
3. **Provide reason** for emergency publish
4. **Click "Run workflow"**

⚠️ **Note**: Emergency publishes skip normal release process. Create proper release afterward.

### Testing Changes
1. **Create PR** against main branch
2. **🔄 CI workflow** runs automatically with 🧪 **Quality Assurance & Testing**
3. **Review test results** before merging
4. **Merge PR** when tests pass

### Dependency Updates
- **Automatic**: Runs every Monday with 🔒 **Security Audit** and 🔄 **Updates**
- **Manual**: Go to Actions → 🔒 **Dependency Security & Updates** → Run workflow

## Workflow Features

### Conflict Prevention
- **No circular triggers**: Release workflow only runs manually
- **Path ignoring**: CI skips documentation-only changes
- **Conditional execution**: Jobs run only when needed
- **Proper dependencies**: Jobs wait for prerequisites

### Error Handling
- **Graceful failures**: Jobs continue even if some steps fail
- **Comprehensive logging**: Detailed status in GitHub Step Summary
- **Emergency options**: Skip tests for critical fixes
- **Dry run mode**: Test releases without creating them

### Security
- **No stored npm token**: npm publishing uses trusted publishing (OIDC); GitHub Packages uses the built-in `GITHUB_TOKEN`
- **Access control**: Manual triggers only for releases
- **Audit integration**: Automatic security vulnerability detection
- **Confirmation required**: Emergency publishes need explicit confirmation

## Required Secrets

- **`GITHUB_TOKEN`**: Automatically provided by GitHub

No npm token is needed. See [npm Trusted Publishing](#npm-trusted-publishing).

## npm Trusted Publishing

Both publishing workflows publish to npm with
[trusted publishing](https://docs.npmjs.com/trusted-publishers): the job requests a GitHub
OIDC token (`id-token: write`) and npm exchanges it for a short-lived publish token. npm also
attaches a provenance attestation (`--provenance`) linking each version to the workflow run that built it.

### Workflow requirements
- `permissions: id-token: write` on the publishing job
- Node 22.14+ and npm 11.5.1+ (publishing jobs use Node 24; a step upgrades npm if needed)
- `repository.url` in `package.json` must match `https://github.com/setkernel/dotted-map-next`

### npm-side setting (package owner, once)
On npmjs.com, open **@setkernel/dotted-map-next → Settings → Trusted Publisher**, choose
**GitHub Actions**, and add one entry per workflow file:

| Field | Release | Emergency |
| --- | --- | --- |
| Organization or user | `setkernel` | `setkernel` |
| Repository | `dotted-map-next` | `dotted-map-next` |
| Workflow filename | `release-and-publish.yml` | `emergency-publish.yml` |
| Environment | _(leave empty)_ | _(leave empty)_ |

The workflow filename is only the file name, not the path. Renaming either workflow file
breaks publishing until the entry on npmjs.com is updated to match.

After one dispatched release publishes successfully, revoke the old npm token on npmjs.com and
delete the `NPM_TOKEN` repository secret. Optionally, under **Publishing access**, require
2FA and disallow tokens so only the trusted publisher can publish.

## Troubleshooting

### Release Not Publishing
1. Check the trusted publisher entry on npmjs.com matches the workflow filename (see [npm Trusted Publishing](#npm-trusted-publishing))
2. Verify you have publish permissions to @setkernel organization
3. Use Emergency Publish for immediate fixes
4. Check workflow logs for detailed error messages

### CI Failures
1. Review test output in workflow logs
2. Fix issues in new PR
3. Dependabot PRs auto-merge if tests pass

### Dependency Issues
1. Check weekly dependency management workflow
2. Review and merge dependency update PRs
3. Security vulnerabilities block dependency updates

## Best Practices

1. **Use Release & Publish** for all normal releases
2. **Enable dry run** when testing release process
3. **Review dependency PRs** before auto-merge
4. **Use Emergency Publish** only for critical hotfixes
5. **Follow semantic versioning** (patch/minor/major)
6. **Write clear commit messages** (used in changelog)

## Migration from Old Workflows

The new streamlined system replaces:
- ❌ `publish.yml` (had circular trigger issues)
- ❌ `release.yml` (caused version conflicts)
- ✅ `ci.yml` → **🔄 Continuous Integration** (clean CI/CD)
- ✅ `release-and-publish.yml` → **🚀 Release & Publish Package** (unified process)
- ✅ `dependencies.yml` → **🔒 Dependency Security & Updates** (enhanced)
- ✅ `emergency-publish.yml` → **🆘 Emergency Hotfix Publisher** (new safety feature)

## Workflow Architecture

For a complete visual representation of workflow dependencies and job flows, see:
- 📊 **[Workflow Architecture Diagram](.github/WORKFLOW_DIAGRAM.md)**

### Key Architecture Benefits:
- ✅ **No Circular Dependencies**: Each workflow is properly isolated
- ✅ **Clear Job Dependencies**: Sequential execution with proper `needs:` chains
- ✅ **Parallel Execution**: Publishing happens simultaneously to multiple registries
- ✅ **Fail-Safe Design**: Emergency workflows have confirmation requirements
- ✅ **Manual Release Control**: Prevents accidental version bumps