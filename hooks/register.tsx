import type { Register } from 'claude-code'

import { readConfig } from './config'
import { crabSvg } from './crab'
import { registerHint } from './hint'
import { registerHud } from './hud'
import { registerToolRows, registerToolTimer } from './tools'

export const register: Register = (on, options) => {
  const config = readConfig(options)

  // The working row: pixel Claude at its laptop in place of the dots, where
  // the surface draws SVG; the terminal keeps the engine's own line.
  if (config.showSpinner) {
    on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
      if (e.surface === 'terminal' || e.surface === 'mobile') return next(e)
      const { Box, Text, Svg } = $.ui.resolve(e)
      const isThinking = e.props.mode === 'thinking' || e.props.mode === 'requesting'

      return (
        <Box flexDirection="row" alignItems="center" gap={1}>
          <Svg
            source={crabSvg(isThinking)}
            alt={`${config.buddyName} đang làm việc`}
            width={108}
            height={54}
            isInteractive
          />
          <Text dimColor>{e.props.message ?? e.props.word}…</Text>
        </Box>
      )
    })
  }

  // The HUD counts tool calls and the rows show their times, so the timer
  // runs whenever either is on.
  if (config.showHud || config.showToolRows) registerToolTimer(on)
  if (config.showHud) registerHud(on, config)
  if (config.showTips) registerHint(on, config)
  if (config.showToolRows) registerToolRows(on)
}
