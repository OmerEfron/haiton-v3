const COLORS = ['#d7261e', '#1f5fbf', '#2f8a4c', '#c47a12', '#7a3fb0', '#0f7b80', '#b0306a']

/** Stable per-author avatar color. */
export const colorOf = (id: string) => COLORS[[...id].reduce((h, c) => h + c.charCodeAt(0), 0) % COLORS.length]

export const firstName = (name: string) => name.split(' ')[0]
