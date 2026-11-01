import type { PluginOptions } from 'claude-code'

export type Config = {
  userName: string
  buddyName: string
  utcOffsetMs: number
  showSpinner: boolean
  showHud: boolean
  showTips: boolean
  showToolRows: boolean
}

const text = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : fallback)
// values set from the command line may arrive as strings
const flag = (v: unknown) => v !== false && v !== 'false'
const hours = (v: unknown) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) && Math.abs(n) <= 14 ? n : 7
}

// The manifest's userConfig values, defaults filled in for anything unset or
// of the wrong type.
export const readConfig = (options: PluginOptions): Config => {
  const offset = hours(options.utc_offset)

  return {
    userName: text(options.user_name, 'bạn'),
    buddyName: text(options.buddy_name, 'Đệ'),
    utcOffsetMs: offset * 3_600_000,
    showSpinner: flag(options.show_spinner),
    showHud: flag(options.show_hud),
    showTips: flag(options.show_tips),
    showToolRows: flag(options.show_tool_rows),
  }
}
