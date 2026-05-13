export function getRank(totalDays) {

  if (totalDays >= 365) {
    return {
      title: "Абсолют",
      icon: "☀️",
      color: "#fadb14",
    };
  }

  if (totalDays >= 241) {
    return {
      title: "Легенда",
      icon: "🚀",
      color: "#722ed1",
    };
  }

  if (totalDays >= 121) {
    return {
      title: "Элита",
      icon: "💎",
      color: "#13c2c2",
    };
  }

  if (totalDays >= 61) {
    return {
      title: "Воин",
      icon: "👑",
      color: "#fa8c16",
    };
  }

  if (totalDays >= 31) {
    return {
      title: "Стабильный",
      icon: "🛡",
      color: "#52c41a",
    };
  }

  if (totalDays >= 15) {
    return {
      title: "Дисциплина",
      icon: "⚔️",
      color: "#1890ff",
    };
  }

  if (totalDays >= 8) {
    return {
      title: "Разогрев",
      icon: "🔥",
      color: "#ff4d4f",
    };
  }

  if (totalDays >= 4) {
    return {
      title: "Новичок",
      icon: "🌱",
      color: "#73d13d",
    };
  }

  return {
    title: "Пыль",
    icon: "🪨",
    color: "#8c8c8c",
  };
}