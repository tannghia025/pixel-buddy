import type { On } from 'claude-code'

// How long each call took, by tool_use_id, for the rows to show.
const durations = new Map<string, number>()
let toolCount = 0

export const toolsRun = () => toolCount

const ICONS: Record<string, string> = {
  Bash: '⚡',
  PowerShell: '⚡',
  Read: '📖',
  Write: '📝',
  Edit: '✏️',
  NotebookEdit: '✏️',
  Grep: '🔍',
  Glob: '🗂',
  WebSearch: '🌐',
  WebFetch: '🌐',
  Agent: '🤖',
  Skill: '🎯',
  ToolSearch: '🧰',
  AskUserQuestion: '💬',
}

export const iconOf = (tool: string) => ICONS[tool] ?? (tool.startsWith('mcp__') ? '🧩' : '🔧')

// mcp__github__github_create_issue -> github · create_issue
export const nameOf = (tool: string) => {
  const m = /^mcp__(.+?)__(.+)$/.exec(tool)
  if (!m) return tool
  const server = m[1]!.length > 20 ? 'mcp' : m[1]!
  const action = m[2]!.startsWith(`${server}_`) ? m[2]!.slice(server.length + 1) : m[2]!

  return `${server} · ${action}`
}

const clip = (s: string, n: number) => {
  const one = s.replace(/\s+/g, ' ').trim()
  return one.length > n ? one.slice(0, n - 1) + '…' : one
}

// A short label for what the call works on, from the fields most tools carry.
export const summaryOf = (input: unknown) => {
  if (typeof input !== 'object' || input === null) return ''
  const o = input as Record<string, unknown>
  const s = (k: string) => (typeof o[k] === 'string' ? (o[k] as string) : '')
  const path = s('file_path') || s('notebook_path') || s('path')
  const text =
    s('description') ||
    s('command') ||
    (path ? (path.split(/[\\/]/).pop() ?? path) : '') ||
    (s('pattern') && `"${s('pattern')}"`) ||
    s('query') ||
    s('url') ||
    s('skill') ||
    s('prompt')

  return clip(text, 70)
}

export const formatMs = (ms: number) =>
  ms < 1000
    ? `${ms}ms`
    : ms < 60_000
      ? `${(ms / 1000).toFixed(1)}s`
      : `${Math.floor(ms / 60_000)}m${Math.round((ms % 60_000) / 1000)}s`

type CallState = { isRunning: boolean; isErrored: boolean; isInterrupted: boolean }

const statusOf = (c: CallState) =>
  c.isRunning
    ? ({ mark: '◐', color: 'warning' } as const)
    : c.isInterrupted
      ? ({ mark: '⏹', color: 'subtle' } as const)
      : c.isErrored
        ? ({ mark: '✗', color: 'error' } as const)
        : ({ mark: '✓', color: 'success' } as const)

// Times each call, for the rows, and counts them, for the HUD.
export const registerToolTimer = (on: On) => {
  on('tool.call', async ($, e, next) => {
    const startedAt = await $.clock.now()
    toolCount += 1
    const ran = await next(e)
    durations.set(e.tool_use_id, (await $.clock.now()) - startedAt)
    if (durations.size > 500) {
      const oldest = durations.keys().next().value
      if (oldest !== undefined) durations.delete(oldest)
    }
    $.ui.invalidate('ui.render')

    return ran
  }).catch(($, e, next) => next(e)) // never block a tool because the counter failed
}

export const registerToolRows = (on: On) => {
  // One call's row: icon, name, what it worked on, status and time. The full
  // row (ctrl+o, --verbose) stays the engine's.
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.props.isExpanded === true) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const p = e.props
    const st = statusOf(p)
    const ms = durations.get(p.tool_use_id)

    return (
      <Box flexDirection="row" gap={1}>
        <Text>{iconOf(p.tool)}</Text>
        <Text bold color={p.isErrored ? 'error' : 'claude'}>
          {nameOf(p.tool)}
        </Text>
        <Text dimColor>{summaryOf(p.input)}</Text>
        <Text color={st.color}>{st.mark}</Text>
        {ms !== undefined && <Text color="subtle">{formatMs(ms)}</Text>}
      </Box>
    )
  })

  // A folded run of calls: one line of icons with counts, and the call that is
  // running now beneath it while the group is live.
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    if (e.props.isExpanded || e.props.isCallsOnly !== true) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const calls = e.props.calls
    const counts = new Map<string, number>()
    for (const c of calls) counts.set(c.tool, (counts.get(c.tool) ?? 0) + 1)
    const running = calls.find(c => c.isRunning)
    const total = calls.reduce((sum, c) => sum + (c.tool_use_id ? (durations.get(c.tool_use_id) ?? 0) : 0), 0)

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={2} flexWrap="wrap">
          {[...counts].map(([tool, n]) => (
            <Text>
              {iconOf(tool)} <Text color="claude">{nameOf(tool)}</Text>
              {n > 1 && <Text dimColor> ×{n}</Text>}
            </Text>
          ))}
          {!running && total > 0 && <Text color="subtle">⏱ {formatMs(total)}</Text>}
        </Box>
        {running && (
          <Text color="warning">
            ◐ <Text dimColor>{summaryOf(running.input) || nameOf(running.tool)}</Text>
          </Text>
        )}
      </Box>
    )
  })
}
