import type { On } from 'claude-code'

import type { Config } from './config'

const TIPS = [
  '💡 Ctrl+O để xem chi tiết từng tool',
  '💡 Kéo thả ảnh hoặc file log vào khung chat để Claude đọc',
  '💡 Gõ / để xem các lệnh và skill đang có',
  '💡 /code-review để review diff hiện tại',
  '💡 Esc để dừng Claude giữa chừng',
  '💡 Viết CLAUDE.md để Claude nhớ quy ước của dự án',
  '💡 Dán ảnh chụp màn hình lỗi để Claude xem trực tiếp',
]

export const registerHint = (on: On, config: Config) => {
  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    if (e.props.isDraft) return next(e)
    if (e.props.isWorking) {
      return next({ ...e, props: { ...e.props, hint: `⏹ Esc để dừng · ${config.buddyName.toLowerCase()} đang cày…` } })
    }
    // a new tip every two minutes
    const tip = TIPS[Math.floor((await $.clock.now()) / 120_000) % TIPS.length]!

    return next({ ...e, props: { ...e.props, hint: tip } })
  })
}
