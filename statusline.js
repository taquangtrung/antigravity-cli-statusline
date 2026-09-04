#!/usr/bin/env node

// Antigravity CLI status line. Reads the status-line JSON payload on stdin and
// prints, e.g.:
//
//   Gemini 3.5 Flash (High) | 5% 01:50 | 74% Tue 04:00 | 17% ctx (1M) | ? help
//   ⏵⏵ interactive mode on (shift+tab to cycle) | ~/Workspace/project
//
// Primary row:   model | <5h quota> | <weekly quota> | <context>% ctx | ? help
// Secondary row: ⏵⏵ <mode> (shift+tab to cycle) | <cwd>
//
// Quota buckets show used_percentage and reset time: 5-hour quota (HH:MM reset
// when within a day) and weekly quota ("Ddd HH:MM" reset).
// Cycle modes: auto mode on (accept-edits), plan mode on (plan), or interactive mode on.
// CWD is shortened with ~ when under the user's home directory.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const COLOR = '\x1b[38;2;155;155;155m';
const RESET = '\x1b[0m';
const COLOR_AUTO = '\x1b[38;2;230;126;34m';
const COLOR_PLAN = '\x1b[38;2;0;188;212m';
const COLOR_INTERACTIVE = '\x1b[38;2;198;120;221m';

// Render a quota reset time. Accepts an epoch or any date-parsable string and
// falls back to the raw value when it cannot be parsed.
function formatReset(raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  const secs = /^\d+$/.test(String(raw)) ? Number(raw) : Math.round(new Date(raw).getTime() / 1000);
  if (Number.isNaN(secs)) return String(raw);

  const diff = secs - Math.round(Date.now() / 1000);
  const date = new Date(secs * 1000);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  if (diff < 86400) return `${hh}:${mm}`;

  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  return `${weekday} ${hh}:${mm}`;
}

// Compact a token count, e.g. 23456 -> 23k, 1048576 -> 1M.
function humanTokens(n) {
  if (n >= 1000000) return `${Math.round(n / 1000000)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

function buildQuotaSegments(quota) {
  return Object.entries(quota)
    .filter(([key]) => key.toLowerCase().includes('gemini'))
    .map(([, value]) => {
      const pct = Math.round((1 - (value.remaining_fraction ?? 1)) * 100);
      const reset = formatReset(value.reset_time ?? '');
      return reset ? `${pct}% ${reset}` : `${pct}%`;
    });
}

function buildRow1(data) {
  const model = data.model?.display_name ?? '';
  const contextWindow = data.context_window ?? {};
  const ctxPct = Math.round(contextWindow.used_percentage ?? 0);
  const ctxSize = contextWindow.context_window_size ?? 0;

  const segments = [];
  if (model) segments.push(model);
  segments.push(...buildQuotaSegments(data.quota ?? {}));
  segments.push(ctxSize > 0 ? `${ctxPct}% ctx (${humanTokens(ctxSize)})` : `${ctxPct}% ctx`);
  segments.push('? help');

  return `${COLOR}${segments.join(' | ')}${RESET}`;
}

function buildRow2(data) {
  const cycleMode = data.cycle_mode ?? '';
  const modeColor =
    cycleMode === 'accept-edits' ? COLOR_AUTO : cycleMode === 'plan' ? COLOR_PLAN : COLOR_INTERACTIVE;
  const modeLabel =
    cycleMode === 'accept-edits'
      ? 'auto mode on'
      : cycleMode === 'plan'
        ? 'plan mode on'
        : 'interactive mode on';

  let row2 = `${modeColor}⏵⏵ ${modeLabel}${COLOR} (shift+tab to cycle)${RESET}`;

  const cwd = data.cwd ?? data.workspace?.current_dir ?? '';
  if (cwd) {
    const home = os.homedir();
    const shortCwd = home && cwd.startsWith(home) ? `~${cwd.slice(home.length)}` : cwd;
    row2 += ` ${COLOR}| ${shortCwd}${RESET}`;
  }

  return row2;
}

function main() {
  const payload = fs.readFileSync(0, 'utf8');

  // Always keep the most recent raw payload for inspection/tuning.
  try {
    fs.writeFileSync(path.join(__dirname, '.statusline-last.json'), payload);
  } catch {
    // best-effort; missing write access should not break the status line
  }

  let data;
  try {
    data = JSON.parse(payload);
  } catch {
    data = {};
  }

  process.stdout.write(`${buildRow1(data)}\n`);
  process.stdout.write(`${buildRow2(data)}\n`);
}

main();
