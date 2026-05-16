export const RANKS = [

  {
    title: "Пыль",
    icon: "🪨",
    days: 0,
    color: "#8c8c8c",
  },

  {
    title: "Росток",
    icon: "🌱",
    days: 11,
    color: "#73d13d",
  },

  {
    title: "Бревно",
    icon: "🪵",
    days: 23,
    color: "#ff4d4f",
  },

  {
    title: "Рабочий режим",
    icon: "🛠",
    days: 35,
    color: "#1890ff",
  },

  {
    title: "Стабильный",
    icon: "🛡",
    days: 51,
    color: "#52c41a",
  },

  {
    title: "Воин",
    icon: "⚔️",
    days: 69,
    color: "#fa8c16",
  },

  {
    title: "Дисциплина",
    icon: "💎",
    days: 87,
    color: "#13c2c2",
  },

  {
    title: "Фундамент",
    icon: "🧱",
    days: 100,
    color: "#722ed1",
  },

  {
    title: "Закаленный",
    icon: "🔥",
    days: 150,
    color: "#fadb14",
  },

  {
    title: "Монолит",
    icon: "🗿",
    days: 181,
    color: "#fadb14",
  },

  {
    title: "Железная воля",
    icon: "🦍",
    days: 200,
    color: "#fadb14",
  },

  {
    title: "Мастер",
    icon: "👑",
    days: 231,
    color: "#fadb14",
  },

  {
    title: "Наблюдатель",
    icon: "👁",
    days: 271,
    color: "#fadb14",
  },

  {
    title: "Гигант",
    icon: "🗻",
    days: 300,
    color: "#fadb14",
  },

  {
    title: "Легенда",
    icon: "🏆",
    days: 331,
    color: "#fadb14",
  },

  {
    title: "Абсолют",
    icon: "✨",
    days: 365,
    color: "#fadb14",
  },
];

export function getRank(totalDays) {

  if (totalDays >= 365) {
    return {
      title: "Абсолют",
      icon: "✨",
      color: "#fadb14",
    };
  }

  if (totalDays >= 331) {
    return {
      title: "Легенда",
      icon: "🏆",
      color: "#fadb14",
    };
  }

  if (totalDays >= 300) {
    return {
      title: "Гигант",
      icon: "🗻",
      color: "#fadb14",
    };
  }

  if (totalDays >= 271) {
    return {
      title: "Наблюдатель",
      icon: "👁",
      color: "#fadb14",
    };
  }

  if (totalDays >= 231) {
    return {
      title: "Мастер",
      icon: "👑",
      color: "#fadb14",
    };
  }

  if (totalDays >= 200) {
    return {
      title: "Железная воля",
      icon: "🦍",
      color: "#fadb14",
    };
  }

  if (totalDays >= 181) {
    return {
      title: "Монолит",
      icon: "🗿",
      color: "#fadb14",
    };
  }

  if (totalDays >= 150) {
    return {
      title: "Закаленный",
      icon: "🔥",
      color: "#fadb14",
    };
  }

  if (totalDays >= 100) {
    return {
      title: "Фундамент",
      icon: "🧱",
      color: "#722ed1",
    };
  }

  if (totalDays >= 87) {
    return {
      title: "Дисциплина",
      icon: "💎",
      color: "#13c2c2",
    };
  }

  if (totalDays >= 69) {
    return {
      title: "Воин",
      icon: "⚔️",
      color: "#fa8c16",
    };
  }

  if (totalDays >= 51) {
    return {
      title: "Стабильный",
      icon: "🛡",
      color: "#52c41a",
    };
  }

  if (totalDays >= 35) {
    return {
      title: "Рабочий режим",
      icon: "🛠",
      color: "#1890ff",
    };
  }

  if (totalDays >= 23) {
    return {
      title: "Бревно",
      icon: "🪵",
      color: "#ff4d4f",
    };
  }

  if (totalDays >= 11) {
    return {
      title: "Росток",
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