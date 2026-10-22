// Reject incomplete responses instead of turning a failed statistic into zero.
export function validateDashboard(data, days) {
  const count = value => Number.isSafeInteger(value) && value >= 0
  const date = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
    const parsed = Date.parse(value + 'T00:00:00Z')
    return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value ? parsed : null
  }
  const dateString = value => new Date(value).toISOString().slice(0, 10)
  const rate = (value, numerator, denominator) => value === null
    ? denominator === 0
    : Number.isFinite(value) && value >= 0 && value <= 1 && denominator > 0 && Math.abs(value - numerator / denominator) < 1e-10
  if (!data || ![7, 30].includes(days) || data.days !== days || data.timeZone !== 'Asia/Shanghai' ||
      !['userCount', 'exerciseCount', 'commentCount', 'todayRecordCount'].every(key => count(data[key])) ||
      !Array.isArray(data.dailyActivity) || data.dailyActivity.length !== days || !Array.isArray(data.hotExercises) || data.hotExercises.length > 10 ||
      date(data.startDate) === null || date(data.endDate) === null) throw Error('统计数据格式异常，请重试')
  const start = date(data.startDate)
  if (data.dailyActivity.some((day, i) => !day || !count(day.userCount) || day.date !== dateString(start + i * 86400000)) ||
      data.dailyActivity.at(-1).date !== data.endDate) throw Error('统计日期异常，请重试')
  const ids = new Set()
  for (const item of data.hotExercises) {
    if (!item || !count(item.exerciseId) || item.exerciseId === 0 || ids.has(item.exerciseId) || !count(item.count) || item.count === 0 || typeof item.name !== 'string' || !item.name.trim()) throw Error('动作排行数据异常，请重试')
    ids.add(item.exerciseId)
  }
  const engagement = data.engagement
  const activation = engagement?.activation
  if (!activation || date(activation.startDate) === null || date(activation.endDate) === null ||
      activation.startDate !== dateString(start - 7 * 86400000) || activation.endDate !== dateString(date(data.endDate) - 7 * 86400000) ||
      !count(activation.eligibleUsers) || !count(activation.completedUsers) || activation.completedUsers > activation.eligibleUsers ||
      !rate(activation.rate, activation.completedUsers, activation.eligibleUsers)) throw Error('首次完成率数据异常，请重试')

  const expectedWeeks = days === 7 ? 1 : 4
  const exerciseWeeks = engagement.weeklyExerciseDays
  const retentionWeeks = engagement.weeklyRetention
  if (!Array.isArray(exerciseWeeks) || exerciseWeeks.length !== expectedWeeks || !Array.isArray(retentionWeeks) || retentionWeeks.length !== expectedWeeks) throw Error('周统计数据异常，请重试')
  const endDate = date(data.endDate)
  const endWeekMonday = endDate - ((new Date(endDate).getUTCDay() + 6) % 7) * 86400000
  const latestCompleteWeekMonday = endWeekMonday - 7 * 86400000
  for (let i = 0; i < expectedWeeks; i++) {
    const week = exerciseWeeks[i]
    const retention = retentionWeeks[i]
    const weekStart = date(week?.startDate), weekEnd = date(week?.endDate)
    if (weekStart === null || weekEnd === null || new Date(weekStart).getUTCDay() !== 1 || weekEnd !== weekStart + 6 * 86400000 ||
        (i && weekStart !== date(exerciseWeeks[i - 1].startDate) + 7 * 86400000) ||
        (i === expectedWeeks - 1 && weekStart !== latestCompleteWeekMonday) ||
        !['activeUsers', 'oneToTwoDays', 'threeToFourDays', 'fiveToSevenDays'].every(key => count(week[key])) ||
        week.activeUsers !== week.oneToTwoDays + week.threeToFourDays + week.fiveToSevenDays ||
        !retention || date(retention.startDate) !== weekStart - 7 * 86400000 || date(retention.endDate) !== weekEnd - 7 * 86400000 ||
        date(retention.returnStartDate) !== weekStart || date(retention.returnEndDate) !== weekEnd ||
        !count(retention.cohortUsers) || !count(retention.returnedUsers) || retention.returnedUsers > retention.cohortUsers || retention.returnedUsers > week.activeUsers ||
        !rate(retention.rate, retention.returnedUsers, retention.cohortUsers)) throw Error('周统计口径或日期异常，请重试')
  }

  const families = engagement.families
  if (!families || !count(families.activeCount) || !Array.isArray(families.daily) || families.daily.length !== days ||
      families.daily.some((item, i) => !item || !count(item.familyCount) || item.date !== dateString(start + i * 86400000)) ||
      families.activeCount < Math.max(...families.daily.map(item => item.familyCount)) ||
      families.activeCount > families.daily.reduce((sum, item) => sum + item.familyCount, 0)) throw Error('活跃家庭统计异常，请重试')
  return data
}
