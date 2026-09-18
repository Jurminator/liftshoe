#!/bin/bash
# Deterministic risk classification of a change. Decides whether agent approval is enough (low)
# or a human must look (high). Deliberately NOT an LLM: an agent cannot argue its way past this.
#   pr-risk.sh [base-ref]      default base: origin/HEAD, else origin/main, else main
# Output: "risk=low|high" plus one "reason=" line per trigger. Exit code is always 0.
# Per-repo additions: .claude/escalate-paths (one extended regex per line, # comments allowed).
MAX_LINES="${RISK_MAX_LINES:-400}"; MAX_FILES="${RISK_MAX_FILES:-15}"

base="${1:-}"
if [[ -z "$base" ]]; then
  for c in origin/HEAD origin/main origin/master origin/develop main; do git rev-parse -q --verify "$c" >/dev/null && { base="$c"; break; }; done
fi
mb=$(git merge-base "$base" HEAD 2>/dev/null) || { echo "risk=high"; echo "reason=cannot determine base ($base)"; exit 0; }

reasons=()
files=$(git diff --name-only "$mb" HEAD)
noise='(^|/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|uv\.lock|poetry\.lock|Cargo\.lock)$|\.snap$|^docs/|\.md$'
lines=$(git diff --numstat "$mb" HEAD | grep -vE "$noise" | awk '{a+=$1+$2} END{print a+0}')
nfiles=$(grep -vcE "$noise" <<< "$files")
(( lines  > MAX_LINES )) && reasons+=("large change: $lines lines (max $MAX_LINES)")
(( nfiles > MAX_FILES )) && reasons+=("wide change: $nfiles files (max $MAX_FILES)")

sensitive='(^|/)(auth|login|session|permission|rbac|acl|oauth|sso|payment|billing|invoice|checkout|stripe|mollie|secret|crypto|migrations?|infra|terraform|deploy|k8s|helm)(/|[._-]|$)|schema\.(prisma|sql|graphql)$|(^|/)Dockerfile|docker-compose|^\.github/|^\.claude/|(^|/)CLAUDE\.md$|\.env\.example$|(^|/)middleware\.[jt]s$'
patterns=("$sensitive")
[[ -f .claude/escalate-paths ]] && while read -r l; do [[ -z "$l" || "$l" == \#* ]] || patterns+=("$l"); done < .claude/escalate-paths
for p in "${patterns[@]}"; do
  hit=$(grep -iE "$p" <<< "$files" | head -3 | tr '\n' ' ')
  [[ -n "$hit" ]] && reasons+=("sensitive path: $hit")
done

# dependency changes (new code from the internet) — manifest edits that touch dependency blocks
if git diff "$mb" HEAD -- '*package.json' 'pyproject.toml' 'requirements*.txt' 'Gemfile' 'go.mod' | grep -qE '^[+-]\s*"?[@a-zA-Z0-9_./-]+"?\s*[:=~^<>]'; then
  reasons+=("dependency manifest changed")
fi
# tests removed or weakened
deleted_tests=$(git diff --diff-filter=D --name-only "$mb" HEAD | grep -ciE '(test|spec)')
(( deleted_tests > 0 )) && reasons+=("$deleted_tests test file(s) deleted")
skip_added=$(git diff "$mb" HEAD | grep -cE '^\+.*\b(it|test|describe)\.(skip|only)\b|^\+.*@pytest\.mark\.skip|^\+.*\bxit\(')
(( skip_added > 0 )) && reasons+=("tests skipped/focused in this change")

if (( ${#reasons[@]} )); then echo "risk=high"; printf 'reason=%s\n' "${reasons[@]}"; else echo "risk=low"; echo "reason=small change, no sensitive paths, no dependency or test-removal signals"; fi
