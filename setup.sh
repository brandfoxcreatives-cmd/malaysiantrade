#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# malaysiantrade — one-shot setup script
# Initializes git, commits everything, and pushes to your GitHub repo.
#
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
# ─────────────────────────────────────────────────────────────────────

set -e

REPO_URL="https://github.com/brandfoxcreatives-cmd/malaysiantrade.git"
BRANCH="main"

echo "▶ Initializing malaysiantrade repository..."
echo

# Initialize git if not already a repo
if [ ! -d ".git" ]; then
  git init
  git branch -M "$BRANCH"
  echo "  ✓ git initialized on branch '$BRANCH'"
else
  echo "  ✓ already a git repo"
fi

# Configure remote
if git remote | grep -q "^origin$"; then
  git remote set-url origin "$REPO_URL"
  echo "  ✓ remote 'origin' updated"
else
  git remote add origin "$REPO_URL"
  echo "  ✓ remote 'origin' added → $REPO_URL"
fi

# Stage everything
git add -A
echo "  ✓ files staged"

# Commit (only if there are changes)
if ! git diff --cached --quiet; then
  git commit -m "Initial commit: Malaysian Strategy live dashboard"
  echo "  ✓ committed"
else
  echo "  ✓ nothing to commit (already up to date)"
fi

# Push
echo
echo "▶ Pushing to $REPO_URL ..."
echo "  (you may be prompted for your GitHub username + personal access token)"
echo

git push -u origin "$BRANCH"

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✓ Done."
echo ""
echo " Next steps:"
echo "   1. Go to https://github.com/brandfoxcreatives-cmd/malaysiantrade/settings/pages"
echo "   2. Under 'Source', select 'GitHub Actions'"
echo "   3. Wait ~30 seconds for the workflow to run"
echo "   4. Visit: https://brandfoxcreatives-cmd.github.io/malaysiantrade/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
