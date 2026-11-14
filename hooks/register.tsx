import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Usage } from '../types'

const usage = atom({ plugin: 'usage-footer', key: 'usage' } as const, {
  ctx: null,
  five: null,
  week: null,
  fiveReset: null,
  weekReset: null,
  model: null,
  effort: null,
} as Usage)

const used = (used: number | undefined) =>
  used === undefined ? null : Math.min(100, Math.max(0, Math.round(used)))

const prettyModel = (id: string) => {
  const m = id.match(/(opus|sonnet|haiku|fable)[-\s]*(\d+)[-.](\d+)/i)
  if (m) {
    const name = (m[1] ?? '').toLowerCase()
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${m[2]}.${m[3]}`
  }
  return id.replace(/^claude-/, '')
}

const refresh = async ($: any) => {
  const s = await $.session.usage()
  const model: string = await $.session.model()
  const find = (k: string) => s.rateLimits.find((r: any) => r.kind === k)?.percentUsed
  const resets = (k: string) => {
    const t = s.rateLimits.find((r: any) => r.kind === k)?.resetsAt
    const ms = t ? Date.parse(t) : NaN
    return Number.isNaN(ms) ? null : ms
  }
  await update($, usage, (prev: Usage) => ({
    ...prev,
    ctx: s.context.percent ?? null,
    five: used(find('five_hour')),
    week: used(find('seven_day')),
    fiveReset: resets('five_hour'),
    weekReset: resets('seven_day'),
    model: prettyModel(model),
  }))
}

const bar = (pct: number | null, width = 4) => {
  if (pct === null) return '░'.repeat(width)
  const n = Math.round((Math.min(100, Math.max(0, pct)) / 100) * width)
  return '█'.repeat(n) + '░'.repeat(width - n)
}

export const clock = (ms: number) => {
  const d = new Date(ms)
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h >= 12 ? 'PM' : 'AM'} ${h % 12 === 0 ? 12 : h % 12}:${m}`
}

const remain = (ms: number) => {
  const mins = Math.max(0, Math.floor(ms / 60000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  return d > 0 ? `${d}d${h}h` : `${h}h${String(m).padStart(2, '0')}m`
}

const fmt = (label: string, v: number | null, reset: number | null, now: number) => {
  const base = `${label} ${bar(v)} ${v === null ? '–' : v + '%'}`
  if (reset === null || reset <= now) return base
  return `${base} ${remain(reset - now)}`
}

const EFFORT: Record<string, { letter: string; color: string }> = {
  low: { letter: 'L', color: 'cyan' },
  medium: { letter: 'M', color: 'green' },
  high: { letter: 'H', color: 'yellow' },
  xhigh: { letter: 'X', color: 'magenta' },
  max: { letter: 'Mx', color: 'red' },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await refresh($)
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await refresh($)
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) {
      const model = prettyModel(e.model)
      const effort = e.effort === undefined ? 'effort 없음' : String(e.effort)
      await update($, usage, (prev: Usage) =>
        prev.model === model && prev.effort === effort ? prev : { ...prev, model, effort },
      )
    }
    return yield* next(e)
  })

  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const u = await read($, usage)
    const now = await $.clock.now()
    const { Text } = $.ui.resolve(e)
    const rest = [
      fmt('ctx', u.ctx, null, now),
      fmt('5h', u.five, u.fiveReset, now),
      fmt('7d', u.week, u.weekReset, now),
    ].join(' · ')
    const eff = u.effort ? EFFORT[u.effort] : undefined
    const others = e.props.modes.length > 0 ? `${e.props.modes.join(' & ')} & ` : ''

    return (
      <Text dimColor>
        {others}
        {u.model ?? ''}
        {eff ? (
          <Text color={eff.color} bold>
            {' '}
            {eff.letter}
          </Text>
        ) : null}
        {u.model ? ' · ' : ''}
        {rest}
      </Text>
    )
  })
}
