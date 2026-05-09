const REMINDER_HOUR = 20; // 20:00

export function requestPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function checkAndNotify() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();

  if (now.getHours() < REMINDER_HOUR) return;

  const alreadyNotified = localStorage.getItem("chainify-notified-date");
  if (alreadyNotified === today) return;

  try {
    const userData = JSON.parse(localStorage.getItem("chainify-user-data") || "{}");
    if (!userData.id) return;

    // Check if today is already marked in progress (cached participants)
    // We notify only if not already done — the app will re-check on load
    new Notification("Chainify", {
      body: "Не забудь отметить свой день! Один шаг — и цепочка продолжается. 🔥",
      icon: "/favicon.ico",
    });
    localStorage.setItem("chainify-notified-date", today);
  } catch {
    // ignore
  }
}
