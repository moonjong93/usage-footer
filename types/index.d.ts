export type Usage = {
  ctx: number | null
  five: number | null
  week: number | null
  fiveReset: number | null
  weekReset: number | null
  model: string | null
  effort: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'usage-footer': { usage: Usage }
  }
}
