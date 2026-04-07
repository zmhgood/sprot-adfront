import request from '@/utils/request'

// 管理员登录
export function login(data) {
  return request.post('/admin/login', data)
}

// 获取用户信息
export function getUserInfo() {
  return request.get('/admin/info')
}

// 更新用户信息
export function updateUserInfo(data) {
  return request.put('/user/info', data)
}

// ============ 锻炼动作 ============

// 获取锻炼动作列表
export function getExercises(params) {
  return request.get('/exercises', { params })
}

// 获取锻炼动作详情
export function getExerciseDetail(id) {
  return request.get(`/exercises/${id}`)
}

// 创建锻炼动作
export function createExercise(data) {
  return request.post('/admin/exercises', data)
}

// 更新锻炼动作
export function updateExercise(id, data) {
  return request.put(`/admin/exercises/${id}`, data)
}

// 删除锻炼动作
export function deleteExercise(id) {
  return request.delete(`/admin/exercises/${id}`)
}

// 获取肌肉群组
export function getMuscleGroups() {
  return request.get('/muscle-groups')
}

// ============ 用户管理 ============

// 获取用户列表
export function getUsers(params) {
  return request.get('/admin/users', { params })
}

// 获取用户详情
export function getUserDetail(id) {
  return request.get(`/admin/users/${id}`)
}

// 禁用/启用用户
export function toggleUserStatus(id, status) {
  return request.put(`/admin/users/${id}/status`, { status })
}

// 获取用户统计数据
export function getUserStatistics(id) {
  return request.get(`/admin/users/${id}/statistics`)
}

// ============ 评论管理 ============

// 获取评论列表
export function getComments(params) {
  return request.get('/admin/comments', { params })
}

// 审核评论
export function auditComment(id, status) {
  return request.put(`/admin/comments/${id}/status`, { status })
}

// 删除评论
export function deleteComment(id) {
  return request.delete(`/admin/comments/${id}`)
}

// ============ 数据统计 ============

// 获取概览统计
export function getDashboardStats() {
  return request.get('/admin/stats/dashboard')
}

// 获取趋势数据
export function getTrendData(params) {
  return request.get('/admin/stats/trend', { params })
}

// ============ 家庭管理 ============

// 获取家庭列表
export function getFamilies(params) {
  return request.get('/admin/families', { params })
}

// 获取家庭详情
export function getFamilyDetail(id) {
  return request.get(`/admin/families/${id}`)
}

// ============ 系统配置 ============

// 获取系统配置
export function getConfigs() {
  return request.get('/admin/configs')
}

// 更新系统配置
export function updateConfigs(data) {
  return request.post('/admin/configs', data)
}
