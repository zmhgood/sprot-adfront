import test from 'node:test'
import assert from 'node:assert/strict'
import { validateDashboard } from '../src/utils/dashboard.js'

function reply(days = 7) {
  const start = Date.parse('2032-02-01T00:00:00Z')
  const dates = Array.from({ length: days }, (_, i) => new Date(start + i * 86400000).toISOString().slice(0, 10))
  return { days, startDate: dates[0], endDate: dates.at(-1), timeZone: 'Asia/Shanghai', userCount: 3, exerciseCount: 12, commentCount: 0, todayRecordCount: 2,
    dailyActivity: dates.map((date, i) => ({ date, userCount: i === days - 1 ? 2 : 0 })), hotExercises: [{ exerciseId: 3, name: '测试动作', count: 2 }] }
}

test('both business windows retain zero dates and distinguish people from completion counts', () => {
  for (const days of [7, 30]) { const data = reply(days); assert.equal(validateDashboard(data, days), data); assert.equal(data.dailyActivity.length, days); assert.equal(data.dailyActivity[0].userCount, 0) }
})
test('empty ranking is a valid state when only partial work has been recorded', () => {
  const data = reply(); data.hotExercises = []; data.todayRecordCount = 0
  assert.equal(validateDashboard(data, 7).dailyActivity[6].userCount, 2)
})
for (const [name, mutate] of [
  ['missing response', () => null],
  ['wrong selected range', d => ({ ...d, days: 30 })],
  ['wrong timezone', d => ({ ...d, timeZone: 'UTC' })],
  ['missing day', d => ({ ...d, dailyActivity: d.dailyActivity.slice(1) })],
  ['out of order dates', d => ({ ...d, dailyActivity: d.dailyActivity.toReversed() })],
  ['duplicate date', d => ({ ...d, dailyActivity: d.dailyActivity.map(() => d.dailyActivity[0]) })],
  ['invalid calendar date', d => ({ ...d, startDate: '2032-02-30' })],
  ['different end date', d => ({ ...d, endDate: '2032-02-28' })],
  ['missing total must not become zero', d => ({ ...d, userCount: undefined })],
  ['negative user count', d => ({ ...d, dailyActivity: d.dailyActivity.map(x => ({ ...x, userCount: -1 })) })],
  ['fractional completion count', d => ({ ...d, todayRecordCount: 1.5 })],
  ['duplicate action', d => ({ ...d, hotExercises: [d.hotExercises[0], d.hotExercises[0]] })],
  ['invalid action id', d => ({ ...d, hotExercises: [{ ...d.hotExercises[0], exerciseId: 0 }] })],
  ['zero ranking count', d => ({ ...d, hotExercises: [{ ...d.hotExercises[0], count: 0 }] })],
  ['unsafe numeric count', d => ({ ...d, hotExercises: [{ ...d.hotExercises[0], count: Number.MAX_SAFE_INTEGER + 1 }] })],
  ['blank action name', d => ({ ...d, hotExercises: [{ ...d.hotExercises[0], name: '' }] })],
  ['more than ten ranks', d => ({ ...d, hotExercises: Array.from({ length: 11 }, (_, i) => ({ exerciseId: i + 1, name: '动作', count: 1 })) })]
]) test('rejects malformed data without silently manufacturing zeros: ' + name, () => assert.throws(() => validateDashboard(mutate(reply()), 7)))
