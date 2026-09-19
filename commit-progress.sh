#!/usr/bin/env bash
# Commits the current working tree as a series of small, task-based commits,
# in the order the work was built, using the message format:
#
#   (action): short lowercase name
#
# Usage:
#   ./commit-progress.sh --dry-run   show the plan, change nothing
#   ./commit-progress.sh             create the commits
#
# Notes:
# - Grouping is per file. A few shared files (style.css, router/index.ts,
#   vite.config.ts) contain changes from several tasks; each one lands in the
#   commit that owns most of its changes.
# - Only the paths listed below are staged, so stray files (.env, dist/,
#   screenshots, notes) are never committed by accident.
# - Nothing is pushed.

set -euo pipefail

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then DRY_RUN=1; fi

cd "$(git rev-parse --show-toplevel)"

if ! git diff --cached --quiet; then
  echo "Staged changes already exist. Commit or unstage them first (git reset)." >&2
  exit 1
fi

if [[ -e .env ]] && ! git check-ignore -q .env; then
  echo "warning: .env holds secrets and is NOT gitignored. This script won't stage it," >&2
  echo "         but add '.env' to .gitignore so a later 'git add .' can't leak it." >&2
fi

# commit_group "(action): name" path...
commit_group() {
  local message="$1"
  shift

  if [[ $DRY_RUN -eq 1 ]]; then
    echo "$message"
    for path in "$@"; do
      status="$(git status --short -- "$path" | head -n 1 | cut -c1-2)"
      if [[ -n "$status" ]]; then echo "    $status $path"; fi
    done
    return
  fi

  for path in "$@"; do
    git add -A -- "$path" 2>/dev/null || true
  done
  if git diff --cached --quiet; then
    echo "skip   $message (no changes)"
    return
  fi
  git commit --quiet -m "$message"
  echo "commit $message"
}

commit_group "(add): auth and account pages" \
  src/composables/useAuth.ts \
  src/composables/useSiteSettings.ts \
  src/composables/useTeamMembers.ts \
  src/components/ui/Input.vue \
  src/components/ui/TeamCard.vue \
  src/views/LoginView.vue \
  src/views/SignupView.vue \
  src/views/AccountView.vue \
  src/views/AdminView.vue \
  src/views/EventsAttendedStubView.vue \
  src/views/GalleryView.vue \
  src/views/PressView.vue \
  src/views/TeamView.vue \
  src/data/announcement.ts \
  src/data/team.ts

commit_group "(add): page seo tags" \
  index.html \
  src/composables/useRouteSeo.ts

commit_group "(add): blog api and storage" \
  shared \
  api \
  tsconfig.api.json \
  tsconfig.json \
  tsconfig.app.json \
  vercel.json \
  vite.config.ts \
  .env.example \
  package.json \
  package-lock.json

commit_group "(add): blog pages and editor" \
  src/components/blog \
  src/composables/useBlog.ts \
  src/composables/useCodeRunner.ts \
  src/views/BlogView.vue \
  src/views/BlogPostView.vue \
  src/views/BlogEditorView.vue \
  src/views/BlogDashboardView.vue \
  src/router/index.ts

commit_group "(add): leaderboard and blog stats" \
  src/views/LeaderboardView.vue \
  src/composables/useLeaderboard.ts \
  supabase

commit_group "(update): sharper ui and navbar" \
  src/style.css \
  src/components/ui/Badge.vue \
  src/components/ui/ThemeToggle.vue \
  src/components/layout/TheNavbar.vue \
  src/composables/useCursorGlow.ts

commit_group "(update): hero and focus areas" \
  src/views/HomeView.vue \
  src/data/domains.ts \
  src/composables/useScrollReveal.ts

if [[ $DRY_RUN -eq 0 ]]; then
  echo
  git status --short
  echo "Done. Review with: git log --oneline -10"
fi
