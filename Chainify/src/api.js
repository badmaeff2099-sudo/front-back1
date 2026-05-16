const BASE_URL = 'http://localhost:8000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  return data;
}

export async function register(payload) {
  return request('/auth/register.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(payload) {
  return request('/auth/login.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getUsers(location = '') {
  const qs = location ? `?location=${encodeURIComponent(location)}` : '';
  return request(`/users/list.php${qs}`);
}


export async function markDay(userId, date, status) {
  return request('/progress/mark.php', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      day_date: date,
      status,
    }),
  });
}

export async function getProgress(userId) {
  return request(`/progress/get.php?user_id=${userId}`);
}

export async function addReaction(fromUserId, toUserId, emoji) {
  return request('/reactions/add.php', {
    method: 'POST',
    body: JSON.stringify({ from_user_id: fromUserId, to_user_id: toUserId, emoji }),
  });
}

export async function getReactions(userId) {
  return request(`/reactions/get.php?user_id=${userId}`);
}

export async function sendMessage(userId, channel, message) {
  return request('/chat/send.php', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, channel, message }),
  });
}

export async function getMessages(channel = 'general', limit = 50) {
  return request(`/chat/get.php?channel=${encodeURIComponent(channel)}&limit=${limit}`);
}

export async function updateProfile(userId, data) {
  const res = await fetch(
    "http://localhost:8000/api/users/update.php",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        ...data,
      }),
    }
  );

  return res.json();
}


export async function getLeaderboard() {
  return request('/rating.php');
}