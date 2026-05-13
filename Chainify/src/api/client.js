const API_BASE = "http://localhost:8000";

async function request(url, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  } catch (err) {
    console.error("API ERROR:", err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

/* USERS */
export const updateProfile = (userId, data) =>
  request("/api/users/update.php", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      ...data,
    }),
  });

export const getUsers = (location) =>
  request(`/api/users/list.php?location=${location || ""}`);

/* PROGRESS */
export const markDay = (userId, date) =>
  request("/api/progress/mark.php", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      day_date: date,
    }),
  });

export const getProgress = (userId) =>
  request(`/api/progress/get.php?user_id=${userId}`);

/* CHAT */
export const getMessages = (channel) =>
  request(`/api/chat/get.php?channel=${channel}`);