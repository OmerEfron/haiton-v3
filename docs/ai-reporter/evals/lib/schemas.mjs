import { str, arr, obj, enm } from './openai.mjs'

export const TYPES = ['feature', 'profile', 'interview', 'column', 'sports_report', 'quirky']

export const SCHEMA = {
  // key order matters: the model writes the reasoning fields before the reply
  reporter: { known: str, angle: str, target: str, articleType: enm(...TYPES), reply: { type: ['string', 'null'] }, canDraft: { type: 'boolean' } },
  sim: { text: str },
  draft: {
    headline: str, sub: str, summary: str, body: arr(str), flash: str, push: str,
    usedFacts: arr(str), newFacts: arr(obj({ k: str, v: str })),
  },
  judge: {
    israeli_feel: { type: 'integer' }, human_feel: { type: 'integer' }, hebrew_correctness: { type: 'integer' }, gender_agreement: { type: 'integer' },
    type_fit: { type: 'integer' }, interview_quality: { type: 'integer' },
    story_fidelity: { type: 'boolean' }, question_presumes: { type: 'boolean' }, buried_fact_surfaced: { type: 'boolean' },
    problems: arr(str),
  },
}
