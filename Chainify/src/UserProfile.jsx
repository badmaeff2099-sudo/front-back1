import {
  Card,
  Avatar,
  Typography,
  Space,
  Tag,
  Button,
  Progress,
  Divider,
  Row,
  Col,
  Tooltip,
} from "antd";

import {
  ArrowLeftOutlined,
  UserOutlined,
  TrophyOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  FireOutlined,
} from "@ant-design/icons";

import {
  getRank,
  RANKS,
} from "./utils/ranks";

const { Title, Text } = Typography;

const DAYS_TO_SHOW = 30;

export default function UserProfile({
  user,
  onBack,
}) {

  /*
    Нормализуем даты
  */

  const completedDates = Array.from(
    new Set(
      (user?.completed_dates || [])
        .filter(Boolean)
        .map((date) => {

          const d = new Date(date);

          d.setHours(0, 0, 0, 0);

          return d
            .toLocaleDateString("sv-SE");
        })
    )
  ).sort();

  /*
    Сегодня
  */

  const todayDate =
    new Date();

  todayDate.setHours(
    0,
    0,
    0,
    0
  );

  const today =
    todayDate
      .toLocaleDateString("sv-SE");

  /*
    Дата регистрации
  */

  const createdAt =
    user.created_at
      ? new Date(
          user.created_at +
            "T00:00:00"
        )
      : new Date();

  createdAt.setHours(
    0,
    0,
    0,
    0
  );

  /*
    Всего отмеченных
  */

  const completedDays =
    completedDates.length;

  /*
    Отметил ли сегодня
  */

  const todayCompleted =
    completedDates.includes(
      today
    );

  /*
    Прошло дней
    с регистрации
  */

  const passedDays =
    Math.floor(
      (todayDate - createdAt) /
        (1000 * 60 * 60 * 24)
    );

  /*
    Пропущенные дни

    Сегодня НЕ считается
    пропущенным
  */

  const missedDays =
    Math.max(
      0,
      passedDays -
        completedDays +
        (todayCompleted ? 1 : 0)
    );

  /*
    Прогресс цикла

    Выполненные +
    пропущенные дни
  */

  const totalCycleDays =
    completedDays +
    missedDays;

  /*
    Текущий цикл
  */

  const currentCycleDays =
    totalCycleDays === 0
      ? 0
      : totalCycleDays %
          DAYS_TO_SHOW ||
        DAYS_TO_SHOW;

  /*
    Прогресс %
  */

  const progressPercent =
    (currentCycleDays /
      DAYS_TO_SHOW) *
    100;

  /*
    Текущая серия
  */

  function calculateCurrentStreak(
    dates = []
  ) {

    if (!dates.length) {
      return 0;
    }

    let streak = 0;

    const checkDate =
      new Date(todayDate);

    while (true) {

      const checkStr =
        checkDate
          .toLocaleDateString(
            "sv-SE"
          );

      if (
        dates.includes(checkStr)
      ) {

        streak++;

        checkDate.setDate(
          checkDate.getDate() -
            1
        );

      } else {

        break;
      }
    }

    return streak;
  }

  /*
    Рекордная серия
  */

  function getLongestStreak(
    dates = []
  ) {

    if (!dates.length) {
      return 0;
    }

    const sorted =
      [...dates].sort();

    let longest = 1;
    let current = 1;

    for (
      let i = 1;
      i < sorted.length;
      i++
    ) {

      const prev =
        new Date(
          sorted[i - 1]
        );

      const curr =
        new Date(
          sorted[i]
        );

      const diff =
        (curr - prev) /
        (1000 * 60 * 60 * 24);

      if (diff === 1) {

        current++;

        longest = Math.max(
          longest,
          current
        );

      } else {

        current = 1;
      }
    }

    return longest;
  }

  const currentStreak =
    calculateCurrentStreak(
      completedDates
    );

  const longestStreak =
    getLongestStreak(
      completedDates
    );

  const rank =
    getRank(completedDays);
  /*
  Следующий ранг
*/
/*
  Все ранги
*/

const ranks = [
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

/*
  Прогресс ранга
*/

const maxRankDays = 365;

const rankPercent = Math.min(
  (completedDays / maxRankDays) * 100,
  100
);

const currentRankIndex =
  RANKS.findIndex(
    (r) =>
      r.title === rank.title
  );

const nextRank =
  RANKS[
    currentRankIndex + 1
  ] || RANKS[
    currentRankIndex
  ];

const currentRankMin =
  RANKS[
    currentRankIndex
  ]?.days || 0;

const nextRankDays =
  nextRank.days;

const rankProgress =
  nextRankDays === currentRankMin
    ? 100
    : (
        (
          completedDays -
          currentRankMin
        ) /
        (
          nextRankDays -
          currentRankMin
        )
      ) * 100;

const daysLeftToRank =
  Math.max(
    0,
    nextRankDays -
      completedDays
  );

  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "24px",
      }}
    >

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >

        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{
            marginBottom: 20,
            borderRadius: 10,
          }}
        >
          Назад
        </Button>

<Card
  style={{
    marginBottom: 24,
    borderRadius: 24,
    boxShadow:
      "0 4px 20px rgba(0,0,0,0.06)",
  }}
>

  <Space
    direction="vertical"
    size="large"
    style={{
      width: "100%",
    }}
  >

    <div>

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: 10,
          gap: 12,
          flexWrap: "wrap",
        }}
      >

        <div>

          <Title
            level={3}
            style={{
              margin: 0,
            }}
          >
            Ранг пользователя
          </Title>

          <Text type="secondary">
            Продвижение от Пыли
            до Абсолюта
          </Text>

        </div>

        <Tag
          color={rank.color}
          style={{
            fontSize: 16,
            padding: "8px 16px",
            borderRadius: 999,
            fontWeight: 700,
          }}
        >
          {rank.icon}
          {" "}
          {rank.title}
        </Tag>

      </div>

      <Progress
        percent={Math.round(
          rankPercent
        )}
        strokeColor={rank.color}
        showInfo={false}
      />

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          marginTop: 8,
        }}
      >

        <Text strong>
          {completedDays}
          {" / 365 дней"}
        </Text>

        <Text type="secondary">
          {Math.round(rankPercent)}
          %
        </Text>

      </div>

    </div>

    <div
      style={{
        overflowX: "auto",
        paddingBottom: 6,
      }}
    >

      <div
        style={{
          display: "flex",
          gap: 10,
          minWidth: 1100,
        }}
      >

        {ranks.map((item) => {

          const unlocked =
            completedDays >=
            item.days;

          return (

            <div
              key={item.title}
              style={{
                minWidth: 90,
                textAlign: "center",
                opacity:
                  unlocked
                    ? 1
                    : 0.45,
                transition:
                  "all .2s ease",
              }}
            >

              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background:
                    unlocked
                      ? item.color
                      : "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  margin:
                    "0 auto 8px",
                  fontSize: 24,
                  border:
                    rank.title ===
                    item.title
                      ? "3px solid #000"
                      : "none",
                }}
              >
                {item.icon}
              </div>

              <Text
                strong
                style={{
                  display: "block",
                  fontSize: 12,
                }}
              >
                {item.title}
              </Text>

              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                }}
              >
                {item.days} д.
              </Text>

            </div>
          );
        })}

      </div>

    </div>

  </Space>

</Card>
        <Row gutter={[24, 24]}>

          <Col xs={24} lg={8}>

            <Card
              style={{
                borderRadius: 20,
                boxShadow:
                  "0 4px 20px rgba(0,0,0,0.06)",
              }}
            >

              <Space
                direction="vertical"
                align="center"
                size="large"
                style={{
                  width: "100%",
                }}
              >

                <Avatar
                  size={140}
                  icon={<UserOutlined />}
                  style={{
                    background:
                      "linear-gradient(135deg,#8f6ed5,#6f86ff)",
                    fontSize: 70,
                  }}
                />

                <div
                  style={{
                    textAlign: "center",
                  }}
                >

                  <Title
                    level={2}
                    style={{
                      marginBottom: 6,
                      textTransform:
                        "capitalize",
                    }}
                  >
                    {user.username}
                  </Title>

                  <Tag
                    color={rank.color}
                    style={{
                      fontSize: 14,
                      padding:
                        "4px 12px",
                      borderRadius: 999,
                      fontWeight: 600,
                    }}
                  >
                    {rank.icon}
                    {" "}
                    {rank.title}
                  </Tag>

                </div>

                {user.goal && (

                  <Card
                    size="small"
                    style={{
                      width: "100%",
                      borderRadius: 14,
                      background:
                        "#fafafa",
                    }}
                  >

                    <Space direction="vertical">

                      <Text type="secondary">
                        Цель
                      </Text>

                      <Text strong>
                        {user.goal}
                      </Text>

                    </Space>

                  </Card>
                )}

                {user.location && (

                  <Tag
                    icon={
                      <EnvironmentOutlined />
                    }
                    style={{
                      borderRadius: 999,
                      padding:
                        "6px 12px",
                    }}
                  >
                    {user.location}
                  </Tag>
                )}

              </Space>

            </Card>

          </Col>

          <Col xs={24} lg={16}>

            <Space
              direction="vertical"
              size="large"
              style={{
                width: "100%",
              }}
            >
              <Card
  style={{
    borderRadius: 20,
    boxShadow:
      "0 4px 20px rgba(0,0,0,0.06)",
  }}
>

  <Space
    direction="vertical"
    style={{
      width: "100%",
    }}
    size="middle"
  >

    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        alignItems: "center",
      }}
    >

      <div>

        <Text
          type="secondary"
        >
          Ранг
        </Text>

        <br />

        <Text
          strong
          style={{
            fontSize: 22,
            color: rank.color,
          }}
        >
          {rank.icon}
          {" "}
          {rank.title}
        </Text>

      </div>

      <div
        style={{
          textAlign: "right",
        }}
      >

        <Text
          type="secondary"
        >
          Следующий ранг
        </Text>

        <br />

        <Text strong>
          {nextRank.icon}
          {" "}
          {nextRank.title}
        </Text>

      </div>

    </div>

    <Progress
      percent={Math.round(
        rankProgress
      )}
      strokeColor={
        rank.color
      }
    />

    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
      }}
    >

      <Text strong>
        {completedDays}
        {" "}
        дней
      </Text>

      <Text type="secondary">
        Осталось
        {" "}
        {daysLeftToRank}
        {" "}
        дней
      </Text>

    </div>

  </Space>

</Card>

              <Card
                style={{
                  borderRadius: 20,
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.06)",
                }}
              >

                <Space
                  direction="vertical"
                  size="large"
                  style={{
                    width: "100%",
                  }}
                >

                  <div>

                    <Title level={4}>
                      Прогресс текущего цикла
                    </Title>

                    <Text
                      type="secondary"
                      style={{
                        display: "block",
                        marginBottom: 10,
                      }}
                    >
                      Учитываются
                      выполненные
                      и пропущенные дни
                    </Text>

                    <Progress
                      percent={Math.round(
                        progressPercent
                      )}
                      strokeColor="#1DB954"
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        marginTop: 8,
                      }}
                    >

                      <Text strong>
                        {currentCycleDays}
                        {" / "}
                        {DAYS_TO_SHOW}
                        {" дней"}
                      </Text>

                      <Text type="secondary">
                        {Math.round(
                          progressPercent
                        )}
                        %
                      </Text>

                    </div>

                  </div>

                  <Divider />

                  <Row gutter={[16, 16]}>

                    <Col xs={24} sm={12}>

                      <StatCard
                        icon={
                          <CalendarOutlined />
                        }
                        title="Всего отмечено"
                        value={completedDays}
                      />

                    </Col>

                    <Col xs={24} sm={12}>

                      <StatCard
                        icon={
                          <FireOutlined />
                        }
                        title="Пропущено дней"
                        value={missedDays}
                      />
                     

                    </Col>

                    <Col xs={24} sm={12}>

                      <StatCard
                        icon={
                          <TrophyOutlined />
                        }
                        title="Рекордная серия"
                        value={`${longestStreak} дней`}
                      />

                    </Col>

                    <Col xs={24} sm={12}>

                       <StatCard
                        icon={
                          <FireOutlined />
                        }
                        title="Текущая серия"
                        value={`${currentStreak} дней`}
                      />

                    </Col>

                  </Row>

                </Space>

              </Card>

              <Card
                title="История активности"
                style={{
                  borderRadius: 20,
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.06)",
                }}
              >

                <Text
                  type="secondary"
                  style={{
                    display: "block",
                    marginBottom: 18,
                  }}
                >
                  Зеленые клетки —
                  выполненные дни.
                  Красные —
                  пропущенные.
                </Text>

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >

                  {[...Array(
                    DAYS_TO_SHOW
                  )].map((_, index) => {

                    const cellDate =
                      new Date(
                        createdAt
                      );

                    cellDate.setDate(
                      createdAt.getDate() +
                        index
                    );

                    cellDate.setHours(
                      0,
                      0,
                      0,
                      0
                    );

                    const dateStr =
                      cellDate
                        .toLocaleDateString(
                          "sv-SE"
                        );

                    const isToday =
                      dateStr === today;

                    const isCompleted =
                      completedDates.includes(
                        dateStr
                      );

                    let color =
                      "#f5f5f5";

                    /*
                      Будущие дни
                    */

                    if (
                      cellDate > todayDate
                    ) {

                      color =
                        "#f5f5f5";
                    }

                    /*
                      Выполнено
                    */

                    else if (
                      isCompleted
                    ) {

                      color =
                        "#1DB954";
                    }

                    /*
                      Пропущено
                    */

                    else if (
                      cellDate < todayDate
                    ) {

                      color =
                        "#ff4d4f";
                    }

                    /*
                      Сегодня
                    */

                    else {

                      color =
                        "#e8e8e8";
                    }

                    return (

                      <Tooltip
                        key={index}
                        title={dateStr}
                      >

                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 5,
                            backgroundColor:
                              color,

                            border:
                              isToday
                                ? "2px solid #faad14"
                                : "none",

                            transition:
                              "all .2s ease",
                          }}
                        />

                      </Tooltip>
                    );
                  })}

                </div>

              </Card>

              <Card
                title="Достижения"
                style={{
                  borderRadius: 20,
                  boxShadow:
                    "0 4px 20px rgba(0,0,0,0.06)",
                }}
              >

                <Space wrap>

                  <Achievement
                    done={
                      completedDays >= 1
                    }
                    text="Первый шаг"
                  />

                  <Achievement
                    done={
                      completedDays >= 7
                    }
                    text="7 дней"
                  />

                  <Achievement
                    done={
                      completedDays >= 30
                    }
                    text="30 дней"
                  />

                  <Achievement
                    done={
                      completedDays >= 100
                    }
                    text="100 дней"
                  />

                  <Achievement
                    done={
                      completedDays >= 365
                    }
                    text="Год дисциплины"
                  />

                </Space>

              </Card>

            </Space>

          </Col>

        </Row>

      </div>

    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
}) {

  return (

    <Card
      size="small"
      style={{
        borderRadius: 14,
        background: "#fafafa",
      }}
    >

      <Space>

        <div
          style={{
            fontSize: 22,
          }}
        >
          {icon}
        </div>

        <div>

          <Text type="secondary">
            {title}
          </Text>

          <br />

          <Text
            strong
            style={{
              fontSize: 18,
            }}
          >
            {value}
          </Text>

        </div>

      </Space>

    </Card>
  );
}

function Achievement({
  done,
  text,
}) {

  return (

    <Tag
      color={
        done
          ? "green"
          : "default"
      }
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        fontSize: 13,
      }}
    >
      {done ? "🏆" : "🔒"}
      {" "}
      {text}
    </Tag>
  );
}