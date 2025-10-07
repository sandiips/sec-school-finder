# Git Push Guide for School Advisor SG

This guide provides step-by-step instructions for safely pushing changes to the main branch with proper backup and verification procedures.

## Prerequisites

- Ensure you're on the feature branch (currently `mobileUI`)
- All changes have been tested locally
- Production build has been verified (`npm run build`)
- Development server is working correctly (`npm run dev`)

## Step-by-Step Git Push Process

### 1. Pre-Push Verification

```bash
# Check current branch and status
git status
git branch

# Verify we're on the correct feature branch
# Current: mobileUI branch

# Check for uncommitted changes
git diff
```

### 2. Create Backup Branch (Safety First)

```bash
# Create a backup of current feature branch
git checkout -b mobileUI-backup

# Return to feature branch
git checkout mobileUI
```

### 3. Final Testing & Build Verification

```bash
# Run production build to ensure no issues
npm run build

# Run linting if available
npm run lint

# Test development server one more time
npm run dev
# Ctrl+C to stop when verified
```

### 4. Stage and Commit Changes

```bash
# Check what files have been modified
git status

# Add all changes (or specific files)
git add .

# Create a descriptive commit message
git commit -m "feat: improve mobile navigation with direct text links

- Replace hamburger menu with visible navigation links on mobile
- Add compact mobile navigation styling with touch-friendly targets
- Maintain active states and pink accent colors for consistency
- Optimize logo sizing for mobile viewport
- Shorten 'School Assistant' to 'Assistant' for mobile space efficiency
- Ensure 44px minimum touch targets for accessibility compliance

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 5. Sync with Remote Main Branch

```bash
# Fetch latest changes from remote
git fetch origin

# Check if main branch has new commits
git log --oneline origin/main ^HEAD

# If main has new commits, rebase feature branch onto main
git rebase origin/main

# If conflicts occur during rebase:
# 1. Resolve conflicts in files
# 2. git add <resolved-files>
# 3. git rebase --continue
```

### 6. Final Pre-Push Checks

```bash
# Verify commit history looks correct
git log --oneline -5

# Ensure all tests still pass after rebase
npm run build

# Check file differences one more time
git diff origin/main
```

### 7. Push Feature Branch to Remote

```bash
# Push feature branch to remote
git push origin mobileUI

# If this is the first push of this branch:
git push -u origin mobileUI
```

### 8. Merge to Main Branch

```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge feature branch into main
git merge mobileUI

# Push updated main branch
git push origin main
```

### 9. Cleanup (Optional)

```bash
# Delete feature branch locally (after successful merge)
git branch -d mobileUI

# Delete feature branch on remote
git push origin --delete mobileUI

# Keep backup branch for safety (delete later if needed)
# git branch -d mobileUI-backup
```

## Alternative: Pull Request Workflow

If you prefer using pull requests (recommended for team environments):

```bash
# After step 7 (pushing feature branch):
# 1. Go to GitHub/GitLab repository
# 2. Create Pull Request from mobileUI -> main
# 3. Review changes
# 4. Merge via web interface
# 5. Pull updated main locally: git checkout main && git pull origin main
```

## Emergency Rollback Procedures

### If something goes wrong after pushing to main:

```bash
# Find the commit hash before your changes
git log --oneline

# Create a revert commit (safer than force push)
git revert <commit-hash>
git push origin main

# Or reset to specific commit (use with caution)
git reset --hard <previous-commit-hash>
git push --force-with-lease origin main
```

### If you need to recover from backup:

```bash
# Switch to backup branch
git checkout mobileUI-backup

# Create new feature branch from backup
git checkout -b mobileUI-recovery

# Continue development from backup state
```

## Best Practices

### Commit Message Format
```
<type>: <short description>

<detailed description>

- Bullet point of key changes
- Another important change
- Third significant modification

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `style`: Formatting changes
- `docs`: Documentation updates
- `test`: Adding tests
- `chore`: Maintenance tasks

### Safety Checklist

Before pushing to main:
- [ ] Production build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] No ESLint errors (if configured)
- [ ] All critical functionality tested
- [ ] Mobile responsiveness verified
- [ ] Backup branch created
- [ ] Commit message is descriptive
- [ ] No sensitive data in commit
- [ ] Large files excluded from commit

## Quick Commands Reference

```bash
# Check current status
git status

# View commit history
git log --oneline -10

# View differences
git diff

# Create backup
git checkout -b backup-$(date +%Y%m%d)

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# View remote branches
git branch -r

# View all branches
git branch -a
```

## Troubleshooting

### Common Issues:

**Merge Conflicts:**
```bash
# Edit conflicted files manually
# Remove conflict markers (<<<<, ====, >>>>)
git add <resolved-files>
git commit
```

**Accidentally committed to wrong branch:**
```bash
# Move commit to correct branch
git checkout correct-branch
git cherry-pick <commit-hash>
git checkout wrong-branch
git reset --hard HEAD~1
```

**Need to modify last commit:**
```bash
# Add more changes to last commit
git add .
git commit --amend
```

Remember: Always create backups and test thoroughly before pushing to main!

---

## Recent Operations Log

### 2025-10-05: Sports Expansion and Android Font Fixes

#### ✅ Successful Operation: Oct5-update Branch Merge
**Branch:** `Oct5-update` → `main` (Commit: `ee52aa3`)

**Changes Applied:**
- Expanded sports options from 19 to 26 available sports
- Added new sports: Cross Country, Gymnastics, Sailing, Shooting, Taekwondo, Track and Field, Wushu
- Updated all component references and calculations
- Added PWA manifest.json file
- Created missing Footer component for layout compatibility
- Updated CLAUDE.md documentation

**Process Used:**
1. ✅ Created backup branch: `Oct5-update-backup-20251005`
2. ✅ Fixed missing Footer component issue during build
3. ✅ Production build verification passed
4. ✅ Synced with remote main branch (successful rebase)
5. ✅ Fast-forward merge to main
6. ✅ Successfully pushed to remote

#### ⚠️ Reverted Operation: Android Compare Font Fixes
**Branch:** `feat/android-compare-font-fixes` → `main` (Commit: `810e26c` - REVERTED)

**Changes Applied (Later Reverted):**
- Added Android-specific CSS for white school names in Compare page
- Added Android-specific CSS for black cut-off labels ("IP Cut-off", "Affiliated Cut-off", "Open PG3")
- Updated ComparisonSelector, ComparisonTable, and MobileComparisonView components
- Modified `src/styles/android-mobile.css` with new CSS classes

**Revert Process:**
```bash
# Identified problematic commit
git log --oneline -5

# Hard reset to previous good commit
git reset --hard ee52aa3

# Force push to remove changes from remote
git push --force-with-lease origin main
```

**Lessons Learned:**
- Always test Android-specific changes thoroughly before merging
- Consider using feature flags for experimental UI changes
- Keep feature branches available for future reference after revert

### Current State (as of 2025-10-05)
- **Main Branch:** `ee52aa3` - "feat: expand sports options from 19 to 26 and add Footer component"
- **Available Feature Branches:**
  - `feat/android-compare-font-fixes` (contains reverted changes)
  - Various backup branches from previous operations
- **Status:** Production build passing, repository clean

### Recommended Next Steps
1. If Android font fixes are needed again, create fresh feature branch
2. Consider more thorough testing procedures for Android-specific changes
3. Implement feature flag system for experimental UI modifications