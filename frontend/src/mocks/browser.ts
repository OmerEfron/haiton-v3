import { setupWorker } from 'msw/browser'
import { MOCK_AI, MOCK_CORE } from '../config'
import { accountHandlers } from './handlers/account'
import { aiHandlers } from './handlers/ai'
import { articleHandlers } from './handlers/articles'
import { peopleHandlers } from './handlers/people'
import { socialHandlers } from './handlers/social'

export const coreHandlers = [...accountHandlers, ...articleHandlers, ...peopleHandlers, ...socialHandlers]

export const worker = setupWorker(
  ...(MOCK_CORE ? coreHandlers : []),
  ...(MOCK_AI ? aiHandlers : []),
)
