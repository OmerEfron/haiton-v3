import { setupWorker } from 'msw/browser'
import { accountHandlers } from './handlers/account'
import { aiHandlers } from './handlers/ai'
import { articleHandlers } from './handlers/articles'
import { peopleHandlers } from './handlers/people'
import { socialHandlers } from './handlers/social'

export const coreHandlers = [...accountHandlers, ...articleHandlers, ...peopleHandlers, ...socialHandlers]

export const worker = setupWorker(...coreHandlers, ...aiHandlers)
