import assert from 'node:assert/strict'
import { fill, prompts, reviseBlock, reviseSystem } from './prompts.ts'

const user = { name: 'מאיה', gender: 'female' as const, facts: [{ k: 'עיר', v: 'חיפה' }], previous: '' }
const reporter = fill(prompts.reporter, user)
assert.ok(reporter.includes('מאיה'))
assert.ok(reporter.includes('female (נקבה)'))
assert.ok(reporter.includes('עיר: חיפה'))
assert.ok(!reporter.includes('{{name}}'))

const editor = fill(prompts.editor, user, { articleType: 'quirky', angle: 'three screws' })
assert.ok(editor.includes('ARTICLE TYPE: quirky'))
assert.ok(editor.includes('ANGLE: three screws'))
assert.ok(editor.includes('PREVIOUS STORY'))
assert.ok(editor.includes('(none)'))

const sys = reviseSystem(editor)
assert.ok(sys.startsWith('You are revising'))
assert.ok(!sys.includes('## EXAMPLES'))
assert.equal(reviseBlock('headline').startsWith('headline\n'), true)
assert.throws(() => reviseBlock('nope'), /unknown revision/)

console.log('prompts ok')
