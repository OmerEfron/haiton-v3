export const API_URL: string = import.meta.env.VITE_API_URL ?? '/api'
export const AI_API_URL: string = import.meta.env.VITE_AI_API_URL ?? '/ai'
export const MOCK_CORE = import.meta.env.VITE_MOCK_CORE === 'true'
export const MOCK_AI = import.meta.env.VITE_MOCK_AI !== 'false'
