import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import pino from 'pino'
import { pinoHttp } from 'pino-http'

const level = process.env.LOG_LEVEL ?? (process.env.VITEST ? 'silent' : 'info')

export const logger = pino({ level })

type WithCookies = IncomingMessage & { signedCookies?: Record<string, unknown> }

export const httpLog = pinoHttp({
  logger,
  genReqId: (_req, res) => {
    const id = randomUUID()
    res.setHeader('x-request-id', id)
    return id
  },
  customProps: (req) => {
    const id = (req as WithCookies).signedCookies?.sid
    return typeof id === 'string' && id ? { userId: id } : {}
  },
  // Log the request line only. Bodies and cookies stay out; chat text and facts are personal.
  wrapSerializers: false,
  serializers: {
    req(req: IncomingMessage) {
      return { method: req.method, url: req.url }
    },
    res(res: ServerResponse) {
      return { statusCode: res.statusCode }
    },
  },
  redact: ['req.headers.cookie', 'req.headers.authorization'],
})
