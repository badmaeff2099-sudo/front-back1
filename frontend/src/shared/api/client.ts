const BASE_URL = 'http://localhost:8000/api'

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  return data
}

export async function register(payload: object) {
  return request('/auth/register.php', { method: 'POST', body: JSON.stringify(payload) })
}

export async function login(payload: object) {
  return request('/auth/login.php', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getUsers(location = '') {
  const qs = location ? `?location=${encodeURIComponent(location)}` : ''
  return request(`/users/list.php${qs}`)
}

export async function markDay(userId: number, date: string, status?: string) {
  return request('/progress/mark.php', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, day_date: date, status }),
  })
}

export async function getProgress(userId: number) {
  return request(`/progress/get.php?user_id=${userId}`)
}

export async function getProgressYear(userId: number, year: number) {
  return request(`/progress/year.php?user_id=${userId}&year=${year}`)
}

export async function addReaction(fromUserId: number, toUserId: number, emoji: string) {
  return request('/reactions/add.php', {
    method: 'POST',
    body: JSON.stringify({ from_user_id: fromUserId, to_user_id: toUserId, emoji }),
  })
}

export async function getReactions(userId: number) {
  return request(`/reactions/get.php?user_id=${userId}`)
}

export async function sendMessage(userId: number, channel: string, message: string) {
  return request('/chat/send.php', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, channel, message }),
  })
}

export async function getMessages(channel = 'general', limit = 50) {
  return request(`/chat/get.php?channel=${encodeURIComponent(channel)}&limit=${limit}`)
}

export async function updateProfile(userId: number, data: object) {
  const res = await fetch('http://localhost:8000/api/users/update.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, ...data }),
  })
  return res.json()
}

export async function getLeaderboard(location = '') {
  const qs = location ? `?location=${encodeURIComponent(location)}` : ''
  return request(`/rating.php${qs}`)
}


export async function uploadAvatar(userId: number, file: File): Promise<{ success: boolean; avatar_url?: string; error?: string }> {
  const form = new FormData()
  form.append('user_id', String(userId))
  form.append('avatar', file)
  const res = await fetch('http://localhost:8000/api/users/avatar.php', { method: 'POST', body: form })
  return res.json()
}

export async function sendFriendRequest(fromUserId: number, toUserId: number) {
  return request('/friends/send.php', { method: 'POST', body: JSON.stringify({ from_user_id: fromUserId, to_user_id: toUserId }) })
}

export async function respondFriendRequest(friendshipId: number, action: 'accept' | 'decline') {
  return request('/friends/respond.php', { method: 'POST', body: JSON.stringify({ friendship_id: friendshipId, action }) })
}

export async function getFriends(userId: number) {
  return request(`/friends/list.php?user_id=${userId}`)
}

export async function deleteFriend(friendshipId: number, userId: number) {
  return request('/friends/delete.php', { method: 'POST', body: JSON.stringify({ friendship_id: friendshipId, user_id: userId }) })
}

export async function getFriendStatus(userId: number, targetId: number) {
  return request(`/friends/status.php?user_id=${userId}&target_id=${targetId}`)
}

export async function deleteAccount(userId: number) {
  return request('/users/delete.php', { method: 'POST', body: JSON.stringify({ user_id: userId }) })
}

export async function blockAccount(userId: number) {
  return request('/users/block.php', { method: 'POST', body: JSON.stringify({ user_id: userId }) })
}

export async function getGoals500(userId: number) {
  return request(`/goals500/list.php?user_id=${userId}`)
}

export async function saveGoals500(userId: number, goals: { text: string; done: boolean }[]) {
  return request('/goals500/save.php', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, goals }),
  })
}

export async function getPlanner(userId: number) {
  return request(`/planner/get.php?user_id=${userId}`)
}

export async function savePlanner(
  userId: number,
  today: { text: string }[],
  tomorrow: { text: string }[],
) {
  return request('/planner/save.php', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, today, tomorrow }),
  })
}
