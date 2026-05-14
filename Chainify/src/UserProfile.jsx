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

import { getRank } from "./utils/ranks";

const { Title, Text } = Typography;

const DAYS_TO_SHOW = 30;

export default function UserProfile({
  user,
  onBack,
}) {
  const completedDays =
    user?.completed_dates?.length || 0;

  const rank = getRank(completedDays);

  const progressPercent =
    ((completedDays % DAYS_TO_SHOW) /
      DAYS_TO_SHOW) *
    100;

  const today = new Date()
    .toLocaleDateString("sv-SE");

  const todayDone =
    user.completed_dates?.includes(today);

  const cyclePosition =
    completedDays % DAYS_TO_SHOW === 0 &&
    completedDays > 0
      ? DAYS_TO_SHOW
      : completedDays % DAYS_TO_SHOW;

  const currentIndex =
    cyclePosition === 0
      ? 0
      : todayDone
      ? cyclePosition - 1
      : cyclePosition;

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
                style={{ width: "100%" }}
              >
                <BadgeStatus rank={rank} />

                <Avatar
                  size={140}
                  icon={<UserOutlined />}
                  style={{
                    background:
                      "linear-gradient(135deg,#8f6ed5,#6f86ff)",
                    fontSize: 70,
                  }}
                />

                <div style={{ textAlign: "center" }}>
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
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontWeight: 600,
                    }}
                  >
                    {rank.icon} {rank.title}
                  </Tag>
                </div>

                {user.goal && (
                  <Card
                    size="small"
                    style={{
                      width: "100%",
                      borderRadius: 14,
                      background: "#fafafa",
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
              style={{ width: "100%" }}
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
                  size="large"
                  style={{ width: "100%" }}
                >
                  <div>
                    <Title level={4}>
                      Прогресс цикла
                    </Title>

                    <Progress
                      percent={Math.round(
                        progressPercent
                      )}
                      strokeColor="#1DB954"
                    />

                    <Text type="secondary">
                      {completedDays} / ∞ дней
                    </Text>
                  </div>

                  <Divider />

                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <StatCard
                        icon={
                          <CalendarOutlined />
                        }
                        title="Всего дней"
                        value={completedDays}
                      />
                    </Col>

                    <Col xs={24} sm={12}>
                      <StatCard
                        icon={<FireOutlined />}
                        title="Текущий статус"
                        value={rank.title}
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
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {[...Array(DAYS_TO_SHOW)].map(
                    (_, index) => {
                      let color = "#e8e8e8";

                      if (
                        index <
                          cyclePosition ||
                        (todayDone &&
                          index ===
                            cyclePosition -
                              1)
                      ) {
                        color = "#1DB954";
                      }

                      const currentCell =
                        index === currentIndex;

                      const cellDate =
                        new Date();

                      if (todayDone) {
                        cellDate.setDate(
                          cellDate.getDate() -
                            (cyclePosition -
                              1 -
                              index)
                        );
                      } else {
                        cellDate.setDate(
                          cellDate.getDate() -
                            (cyclePosition -
                              index)
                        );
                      }

                      return (
                        <Tooltip
                          key={index}
                          title={cellDate.toLocaleDateString(
                            "sv-SE"
                          )}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 5,
                              backgroundColor:
                                color,
                              border:
                                currentCell
                                  ? "2px solid #faad14"
                                  : "none",
                              transition:
                                "all .2s ease",
                            }}
                          />
                        </Tooltip>
                      );
                    }
                  )}
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
                    done={completedDays >= 1}
                    text="Первый шаг"
                  />

                  <Achievement
                    done={completedDays >= 7}
                    text="7 дней"
                  />

                  <Achievement
                    done={completedDays >= 30}
                    text="30 дней"
                  />

                  <Achievement
                    done={completedDays >= 100}
                    text="100 дней"
                  />

                  <Achievement
                    done={completedDays >= 365}
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

function BadgeStatus({ rank }) {
  return (
    <Tag
      color={rank.color}
      style={{
        borderRadius: 999,
        padding: "8px 18px",
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      <TrophyOutlined /> {rank.icon}{" "}
      {rank.title}
    </Tag>
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
      color={done ? "green" : "default"}
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        fontSize: 13,
      }}
    >
      {done ? "🏆" : "🔒"} {text}
    </Tag>
  );
}