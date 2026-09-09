# 🐙 STEP 2: Git & GitHub Setup Guide

This guide walks you through connecting any project to GitHub, saving your work safely, and solving common Git issues.

---

## 1. Preparing `.gitignore` (FIRST & MOST CRITICAL STEP)

Never upload `node_modules` (gigabytes of libraries) or your `.env` file (private keys) to GitHub.

Create a file named `.gitignore` in your project root:
```gitignore
# Dependencies
node_modules
.pnp
.pnp.js

# Production build outputs
dist
dist-ssr
*.local

# Environment variables & Secrets (CRITICAL)
.env
.env.local
.env.*.local

# Editor & OS files
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
Thumbs.db
```

---

## 2. Connecting Your Project to a New GitHub Repository

### Step A: Create a Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Enter a **Repository name** (e.g., `gym-membership-tracker`).
3. Set it to **Public** or **Private**.
4. **DO NOT** check "Add a README file" or "Add .gitignore" (your project already has code).
5. Click **Create repository**.
6. Copy the repository URL (e.g., `https://github.com/your-username/my-new-app.git`).

---

### Step B: Initialize & Link in Terminal
Open your project folder in your terminal and run these commands **one by one**:

```bash
# 1. Initialize Git tracking in your project
git init

# 2. Stage all project files
git add .

# 3. Create your first commit
git commit -m "Initial commit: project setup"

# 4. Set the default branch name to 'main'
git branch -M main

# 5. Connect your local project to your GitHub repo
# (Replace with YOUR copied repo URL)
git remote add origin https://github.com/your-username/my-new-app.git

# 6. Push your code to GitHub
git push -u origin main
```

---

## 3. The Daily 3-Command Workflow (Whenever You Make Changes)

Once your project is linked, every time you build a feature or fix a bug, save it with these 3 commands:

```bash
# Step 1: Stage all changed and new files
git add .

# Step 2: Write a clear message of what you changed
git commit -m "Add restock button and pause member feature"

# Step 3: Send changes up to GitHub
git push
```

---

## 4. Common Git Errors & Quick Fixes

### Error 1: `fatal: remote origin already exists`
* **Cause**: You previously linked a remote URL.
* **Fix**:
  ```bash
  git remote remove origin
  git remote add origin https://github.com/your-username/my-new-app.git
  git push -u origin main
  ```

### Error 2: `failed to push some refs to ... (rejected - non-fast-forward)`
* **Cause**: GitHub has commits (like a README created online) that your computer doesn't have yet.
* **Fix**:
  ```bash
  git pull origin main --rebase
  git push origin main
  ```

### Error 3: `fatal: .git/index: index file smaller than expected`
* **Cause**: The internal tracking index file became 0 bytes due to an interrupted process.
* **Fix**:
  ```powershell
  # In PowerShell:
  Remove-Item .git/index -Force
  git reset
  git status
  ```
