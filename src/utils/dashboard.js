// Reject incomplete responses instead of turning a failed statistic into zero.
export function validateDashboard(data, days) {
  const count = value => Number.isSafeInteger(value) && value >= 0
  if (!data || ![7, 30].includes(days) || data.days !== days || data.timeZone !== 'Asia/Shanghai' ||
      !['userCount', 'exerciseCount', 'commentCount', 'todayRecordCount'].every(key => count(data[key])) ||
      !Array.isArray(data.dailyActivity) || data.dailyActivity.length !== days || !Array.isArray(data.hotExercises) || data.hotExercises.length > 10 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(data.endDate)) throw Error('统计数据格式异常，请重试')
  const start = Date.parse(data.startDate + 'T00:00:00Z')
  if (!Number.isFinite(start) || new Date(start).toISOString().slice(0, 10) !== data.startDate || data.dailyActivity.some((day, i) => !day || !count(day.userCount) || day.date !== new Date(start + i * 86400000).toISOString().slice(0, 10)) ||
      data.dailyActivity.at(-1).date !== data.endDate) throw Error('统计日期异常，请重试')
  const ids = new Set()
  for (const item of data.hotExercises) {
    if (!item || !count(item.exerciseId) || item.exerciseId === 0 || ids.has(item.exerciseId) || !count(item.count) || item.count === 0 || typeof item.name !== 'string' || !item.name.trim()) throw Error('动作排行数据异常，请重试')
    ids.add(item.exerciseId)
  }
  return data
}
