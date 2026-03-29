#!/bin/bash
# ===========================================
# Training Grounds App — GitHub Setup Script
# ===========================================
# Run this script from the training-grounds-app/ folder to:
# 1. Create a GitHub repo
# 2. Initialize git
# 3. Push all files
#
# Prerequisites:
#   - GitHub CLI installed: brew install gh
#   - Authenticated: gh auth login
#
# Usage:
#   cd training-grounds-app
#   chmod +x scripts/setup-repo.sh
#   ./scripts/setup-repo.sh
# ===========================================

set -e

REPO_NAME="training-grounds-app"
DESCRIPTION="Training Grounds - MMA Gym Retention App (React Native + NestJS)"

echo "🥋 Setting up Training Grounds repository..."

# Create the GitHub repo
echo "📦 Creating GitHub repository..."
gh repo create "$REPO_NAME" --public --description "$DESCRIPTION" --confirm 2>/dev/null || echo "Repo may already exist, continuing..."

# Initialize git if needed
if [ ! -d ".git" ]; then
  echo "🔧 Initializing git..."
  git init
  git branch -M main
fi

# Add remote
echo "🔗 Adding remote..."
GITHUB_USER=$(gh api user --jq '.login')
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git" 2>/dev/null || git remote set-url origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"

# Stage and commit
echo "📝 Staging files..."
git add -A
git commit -m "feat: initial project scaffolding with Claude Code setup

- CLAUDE.md with full project context and architecture summary
- .claude/rules/ for backend, frontend, and database conventions
- .claude/skills/ for feature scaffolding, screen scaffolding, and test running
- docs/ with full architecture doc, interactive prototype, and system diagram
- packages/shared/ with TypeScript types and brand theme tokens
- Monorepo structure: backend (NestJS), frontend (React Native), shared
- .gitignore configured for Node.js, Expo, and IDE files"

# Push
echo "🚀 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Your repo is ready at: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo "Next steps:"
echo "  1. Open the project in your terminal: cd $REPO_NAME"
echo "  2. Start Claude Code: claude"
echo "  3. Ask Claude to scaffold Phase 1: auth, profiles, and attendance"
