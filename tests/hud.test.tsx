import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'pixel-buddy',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

// 02:05 UTC, which is 09:05 at the default offset of 7 hours.
const MORNING_UTC = Date.UTC(2026, 0, 1, 2, 5)

// Answers the session reads the HUD makes, standing for the engine.
const session = (on: On, cwd: string) => {
  on('clock.now', () => ({ value: MORNING_UTC }))
  on('session.cwd', () => ({ value: cwd }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('session.turns', () => ({ value: 3 }))
}

// The engine's own band with nothing in it, under the plugin.
const emptyBand = (on: On) =>
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)

    return <Box />
  })

test('the HUD greets the configured name and shortens a worktree', { options: { user_name: 'Nam' } }, async ($, on) => {
  session(on, '/home/dev/shop-api/.claude/worktrees/fix-login-3f2a1c')
  emptyBand(on)

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })

  expect((await ui.find({ type: 'Text', text: /Chào buổi sáng, Nam/ }))?.text).toBe('Chào buổi sáng, Nam ☀️')
  expect((await ui.find({ type: 'Text', text: /📁/ }))?.text).toBe('📁 shop-api...')
  expect((await ui.find({ type: 'Text', text: /🕒/ }))?.text).toBe('🕒 09:05')
  expect((await ui.find({ type: 'Text', text: /🤖/ }))?.text).toBe('🤖 Opus 5.5')
  await ui.unmount()
})

test('the HUD uses the buddy name while working and the time zone given', {
  options: { buddy_name: 'Bé', utc_offset: -5 },
}, async ($, on) => {
  session(on, '/home/dev/shop-api')
  emptyBand(on)

  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, isWorking: true }, surface: 'desktop' })

  expect((await ui.find({ type: 'Text', text: /đang cày/ }))?.text).toBe('Bé đang cày…')
  expect((await ui.find({ type: 'Text', text: /🕒/ }))?.text).toBe('🕒 21:05')
  expect((await ui.find({ type: 'Text', text: /📁/ }))?.text).toBe('📁 shop-api')
  await ui.unmount()
})

test('what another plugin draws in the band stays, under the HUD', async ($, on) => {
  // stands for a plugin beneath, such as a scenery band
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>scenery</Text>
  })
  session(on, '/home/dev/shop-api')

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })

  expect((await ui.find({ type: 'Text', text: /Chào buổi sáng/ }))?.text).toBe('Chào buổi sáng, bạn ☀️')
  expect((await ui.find({ type: 'Text', text: /scenery/ }))?.text).toBe('scenery')
  await ui.unmount()
})

test('the terminal, and a HUD switched off, keep the engine band', { options: { show_hud: false } }, async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })
  session(on, '/home/dev/shop-api')

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
    await ui.unmount()
  }
})
