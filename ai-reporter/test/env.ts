// Force the stub and a cap the suite can both stay under and actually hit.
process.env.OPENAI_BASE_URL = 'http://127.0.0.1:4099'
process.env.OPENAI_API_KEY ||= 'test'
process.env.AI_DAILY_CALLS = '8'
