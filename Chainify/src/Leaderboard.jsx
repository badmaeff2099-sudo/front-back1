import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Typography,
  Tag,
  Avatar,
  Space,
  Progress,
  Row,
  Col,
  Statistic,
  Button,
} from "antd";

import {
  TrophyOutlined,
  FireOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

import { getLeaderboard } from "./api";
import "./Leaderboard.css";
import { getRank } from "./utils/ranks";

const { Title, Text } = Typography;

function calculateStreak(completedDates = []) {

  if (!completedDates.length) {
    return 0;
  }

  const sorted = [...completedDates]
    .sort(
      (a, b) =>
        new Date(b) - new Date(a)
    );

  let streak = 0;

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {

    const checkDate = new Date(today);

    checkDate.setDate(
      today.getDate() - i
    );

    const checkStr =
      checkDate
        .toLocaleDateString("sv-SE");

    if (sorted.includes(checkStr)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function Leaderboard({ currentUser, onBack }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const res = await getLeaderboard();

      if (res.success) {
        setUsers(res.users);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalUsers = users.length;

  const totalDays = users.reduce(
    (sum, user) => sum + user.total_days,
    0
  );

  const bestUser = users[0];

  const getPlace = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";

    return `#${index + 1}`;
  };

  const columns = [
    {
      title: "",
      key: "place",
      width: 80,
      render: (_, __, index) => (
        <div
          style={{
            fontSize: 24,
            fontWeight: "bold",
          }}
        >
          {getPlace(index)}
        </div>
      ),
    },

    {
      title: "Участник",
  dataIndex: "username",
  key: "username",

  render: (_, user) => {

    const rank = getRank(user.total_days);

    return (
        <Space size="middle">
          <Avatar
            size={48}
            icon={<UserOutlined />}
            style={{
              backgroundColor:
                currentUser?.username === user.username
                  ? "#52c41a"
                  : "#7b61ff",
            }}
          />

          <div>
            <Text
              strong
              style={{
                fontSize: 16,
              }}
            >
              {user.username}
            </Text>

            <br />
<div style={{ marginTop: 4, marginBottom: 4 }}>
  <Tag color={rank.color}>
    {rank.icon} {rank.title}
  </Tag>
</div>
            {user.goal ? (
              <Text type="secondary">
                {user.goal}
              </Text>
            ) : (
              <Text type="secondary">
                Нет цели
              </Text>
            )}
          </div>
            </Space>
    );
  },
},

    {
  title: "Цикл",

  key: "progress",

  render: (_, user) => {

    const cycle =
  user.total_days === 0
    ? 0
    : user.total_days % 30 || 30;

    return (
      <div
        style={{
          minWidth: 160,
        }}
      >
        <Text
          strong
          style={{
            fontSize: 13,
          }}
        >
          {cycle} / 30 дней
        </Text>

        <Progress
          percent={(cycle / 30) * 100}
          showInfo={false}
          strokeColor="#1DB954"
          size="small"
        />

        <Text
          type="secondary"
          style={{
            fontSize: 11,
          }}
        >
          До нового цикла:
          {" "}
          {30 - cycle}
        </Text>
      </div>
    );
  },
},

    {
      title: "Дней",
      dataIndex: "total_days",
      key: "total_days",

      sorter: (a, b) =>
        b.total_days - a.total_days,

      render: (value) => (
        <Tag
          color="green"
          style={{
            padding: "6px 12px",
            borderRadius: 12,
            fontSize: 14,
          }}
        >
          <CheckCircleOutlined /> {value}
        </Tag>
      ),
    },

    {
      title: "Серия",
      dataIndex: "streak",
      key: "streak",

      sorter: (a, b) =>
        b.streak - a.streak,

      render: (_, user) => {

  const streak =
    calculateStreak(
      user.completed_dates || []
    );

  return (
    <Tag
      color="orange"
      style={{
        padding: "6px 12px",
        borderRadius: 12,
        fontSize: 14,
      }}
    >
      <FireOutlined /> {streak}
    </Tag>
  );
},
},

    {
      title: "Пропущено",
      dataIndex: "missed_days",
      key: "missed_days",

      sorter: (a, b) =>
        b.missed_days - a.missed_days,

      render: (value) => (
        <Tag
          color="red"
          style={{
            padding: "6px 12px",
            borderRadius: 12,
            fontSize: 14,
          }}
        >
          <CloseCircleOutlined /> {value}
        </Tag>
      ),
    },
  ];

  return (
  <div
    style={{
      padding: 24,
    }}
  >

    <div style={{ marginBottom: 20 }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
      >
        Назад
      </Button>
    </div>
      <Space
        direction="vertical"
        size="large"
        style={{ width: "100%" }}
      >
        <div>
          <Title level={2}>
            🏆 Рейтинг участников
          </Title>

          <Text type="secondary">
            Самые дисциплинированные участники Chainify
          </Text>
        </div>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Card bordered={false}>
              <Statistic
                title="Участников"
                value={totalUsers}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card bordered={false}>
              <Statistic
                title="Всего выполнено"
                value={totalDays}
              />
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card bordered={false}>
              <Statistic
                title="Лидер"
                value={bestUser?.username || "-"}
              />
            </Card>
          </Col>
        </Row>

        <Card
          bordered={false}
          style={{
            borderRadius: 20,
          }}
        >
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            pagination={false}

            rowClassName={(record) =>
              currentUser?.username === record.username
                ? "current-user-row"
                : ""
            }
          />
        </Card>
      </Space>
    </div>
  );
}

export default Leaderboard;