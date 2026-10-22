import test from 'node:test'
import assert from 'node:assert/strict'
import { validateDashboard } from '../src/utils/dashboard.js'

function reply(days = 7) {
  const start = Date.parse('2032-02-01T00:00:00Z')
  const dates = Array.from({ length: days }, (_, i) => new Date(start + i * 86400000).toISOString().slice(0, 10))
  const endDate = dates.at(-1)
  const endMs = Date.parse(endDate + 'T00:00:00Z')
  const endWeekMonday = endMs - ((new Date(endMs).getUTCDay() + 6) % 7) * 86400000
  const latestWeekMonday = endWeekMonday - 7 * 86400000
  const weekCount = days === 7 ? 1 : 4
  const weekStarts = Array.from({ length: weekCount }, (_, i) => new Date(latestWeekMonday - (weekCount - i - 1) * 7 * 86400000).toISOString().slice(0, 10))
  const weeklyExerciseDays = weekStarts.map((startDate, i) => {
    const monday = Date.parse(startDate + 'T00:00:00Z')
    return { startDate, endDate: new Date(monday + 6 * 86400000).toISOString().slice(0, 10), activeUsers: 3 + i, oneToTwoDays: 1, threeToFourDays: 1 + i, fiveToSevenDays: 1 }
  })
  const weeklyRetention = weeklyExerciseDays.map((week, i) => ({
    startDate: new Date(Date.parse(week.startDate + 'T00:00:00Z') - 7 * 86400000).toISOString().slice(0, 10),
    endDate: new Date(Date.parse(week.endDate + 'T00:00:00Z') - 7 * 86400000).toISOString().slice(0, 10),
    returnStartDate: week.startDate, returnEndDate: week.endDate, cohortUsers: 5 + i, returnedUsers: 2 + i, rate: (2 + i) / (5 + i)
  }))
  return { days, startDate: dates[0], endDate: dates.at(-1), timeZone: 'Asia/Shanghai', userCount: 3, exerciseCount: 12, commentCount: 0, todayRecordCount: 2,
    dailyActivity: dates.map((date, i) => ({ date, userCount: i === days - 1 ? 2 : 0 })), hotExercises: [{ exerciseId: 3, name: '测试动作', count: 2 }],
    engagement: {
      activation: { startDate: new Date(start - 7 * 86400000).toISOString().slice(0, 10), endDate: new Date(start + (days - 8) * 86400000).toISOString().slice(0, 10), eligibleUsers: 10, completedUsers: 4, rate: 0.4 },
      weeklyExerciseDays, weeklyRetention,
      families: { activeCount: 2, daily: dates.map((date, i) => ({ date, familyCount: i === 0 ? 1 : i === days - 1 ? 2 : 0 })) }
    } }
}

test('both business windows retain zero dates and distinguish people from completion counts', () => {
  for (const days of [7, 30]) { const data = reply(days); assert.equal(validateDashboard(data, days), data); assert.equal(data.dailyActivity.length, days); assert.equal(data.dailyActivity[0].userCount, 0) }
})
test('empty ranking is a valid state when only partial work has been recorded', () => {
  const data = reply(); data.hotExercises = []; data.todayRecordCount = 0
  assert.equal(validateDashboard(data, 7).dailyActivity[6].userCount, 2)
})
test('zero-cohort activation and retention rates stay null', () => {
  const data = reply()
  data.engagement.activation.eligibleUsers = 0; data.engagement.activation.completedUsers = 0; data.engagement.activation.rate = null
  data.engagement.weeklyRetention[0].cohortUsers = 0; data.engagement.weeklyRetention[0].returnedUsers = 0; data.engagement.weeklyRetention[0].rate = null
  assert.equal(validateDashboard(data, 7), data)
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

for (const [name, mutate] of [
  ['missing engagement block', d => { delete d.engagement }],
  ['activation count exceeds denominator', d => { d.engagement.activation.completedUsers = 11 }],
  ['activation fraction disagrees with counts', d => { d.engagement.activation.rate = 0.5 }],
  ['null activation with a sample', d => { d.engagement.activation.rate = null }],
  ['weekly bins do not sum to active users', d => { d.engagement.weeklyExerciseDays[0].activeUsers++ }],
  ['weekly date is not Monday to Sunday', d => { d.engagement.weeklyExerciseDays[0].endDate = '2032-02-08' }],
  ['weekly weeks are not contiguous', d => { d.engagement.weeklyExerciseDays[1].startDate = '2032-01-27' }],
  ['weekly series is not anchored to the latest complete week', d => { const w = d.engagement.weeklyExerciseDays.at(-1); w.startDate = '2032-01-19'; w.endDate = '2032-01-25'; const r = d.engagement.weeklyRetention.at(-1); r.startDate = '2032-01-12'; r.endDate = '2032-01-18'; r.returnStartDate = '2032-01-19'; r.returnEndDate = '2032-01-25' }],
  ['retention dates reverse baseline and return week', d => { d.engagement.weeklyRetention[0].startDate = d.engagement.weeklyRetention[0].returnStartDate }],
  ['returned users exceed cohort', d => { d.engagement.weeklyRetention[0].returnedUsers = d.engagement.weeklyRetention[0].cohortUsers + 1 }],
  ['returned users exceed return-week active users', d => { d.engagement.weeklyRetention[0].returnedUsers = d.engagement.weeklyExerciseDays[0].activeUsers + 1 }],
  ['retention fraction disagrees with counts', d => { d.engagement.weeklyRetention[0].rate = 0.9 }],
  ['family series omits a date', d => { d.engagement.families.daily.pop() }],
  ['period unique family count is below one daily count', d => { d.engagement.families.activeCount = 1 }]
]) test('rejects semantically inconsistent engagement data: ' + name, () => assert.throws(() => validateDashboard(mutate(reply()), 7)))
