import type { On } from 'claude-code'

import type { Config } from './config'
import { miniCrabSvg } from './crab'
import { toolsRun } from './tools'

const greetingAt = (hour: number, name: string) =>
  hour < 5
    ? `Khuya rồi, ${name} 🌙`
    : hour < 11
      ? `Chào buổi sáng, ${name} ☀️`
      : hour < 13
        ? `Trưa rồi, ${name} 🍜`
        : hour < 18
          ? `Chào buổi chiều, ${name} ☕`
          : `Chào buổi tối, ${name} 🌆`

// claude-opus-5-5[1m] -> Opus 5.5
const prettyModel = (id: string) => {
  const m = /claude-([a-z]+)-(\d+)-(\d+)/.exec(id)
  return m ? `${m[1]!.charAt(0).toUpperCase()}${m[1]!.slice(1)} ${m[2]}.${m[3]}` : id
}

// In a worktree (<repo>/.claude/worktrees/<name>) show the repo's name and
// "..." for the worktree, whose long name breaks the band onto two lines.
export const folderLabel = (cwd: string) => {
  const parts = cwd.split(/[\\/]/).filter(Boolean)
  const at = parts.lastIndexOf('worktrees')
  const isWorktree = at > 1 && parts[at - 1] === '.claude'
  const name = (isWorktree ? parts[at - 2] : parts.at(-1)) ?? cwd

  return isWorktree ? `${name}...` : name.length > 20 ? `${name.slice(0, 20)}...` : name
}

let timer: { cancel: () => void } | undefined

export const registerHud = (on: On, config: Config) => {
  on('session.start', async ($, e, next) => {
    // the clock and greeting move on their own: redraw twice a minute
    timer?.cancel()
    timer = $.clock.every(30_000, () => $.ui.invalidate('ui.render'))

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.surface === 'terminal' || e.surface === 'mobile') return next(e)
    const { Box, Text, Svg } = $.ui.resolve(e)
    const [now, cwd, model, turns] = await Promise.all([
      $.clock.now(),
      $.session.cwd(),
      $.session.model(),
      $.session.turns(),
    ])
    const local = new Date(now + config.utcOffsetMs)
    const hh = String(local.getUTCHours()).padStart(2, '0')
    const mm = String(local.getUTCMinutes()).padStart(2, '0')
    const isWorking = e.props.isWorking
    // Whatever other plugins draw in the band goes under the HUD, not away.
    const others = await next(e)

    return (
      <Box flexDirection="column">
        <Box
          flexDirection="row"
          alignItems="center"
          gap={2}
          paddingX={1}
          borderStyle="round"
          borderColor={isWorking ? 'claude' : 'subtle'}
          flexWrap="wrap"
        >
          <Svg
            source={miniCrabSvg(isWorking)}
            alt={isWorking ? 'Claude đang làm' : 'Claude đang ngủ'}
            width={40}
            height={28}
            isInteractive
          />
          <Text bold color="claude">
            {isWorking ? `${config.buddyName} đang cày…` : greetingAt(local.getUTCHours(), config.userName)}
          </Text>
          <Text dimColor>📁 {folderLabel(cwd)}</Text>
          <Text dimColor>🤖 {prettyModel(model)}</Text>
          <Text dimColor>
            🕒 {hh}:{mm}
          </Text>
          <Text dimColor>💬 {turns} lượt</Text>
          <Text dimColor>⚡ {toolsRun()} tool</Text>
        </Box>
        {others}
      </Box>
    )
  })
}
