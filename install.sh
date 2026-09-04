#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Antigravity CLI Statusline Installer (Linux / macOS)
# =============================================================================

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

info()    { printf "${BLUE}[info]${NC} %s\n" "$1"; }
success() { printf "${GREEN}[ok]${NC} %s\n" "$1"; }
warn()    { printf "${YELLOW}[warn]${NC} %s\n" "$1"; }

require_tool() {
  local tool_name="$1"
  if ! command -v "$tool_name" >/dev/null 2>&1; then
    warn "Required tool '$tool_name' is not installed or not in PATH."
    return 1
  fi
  return 0
}

main() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  if ! require_tool node; then
    warn "Node.js is required to install and run the Antigravity CLI statusline."
    exit 1
  fi

  info "Running statusline installer..."
  node "$script_dir/install.js"
  success "Installation complete!"
}

main "$@"
