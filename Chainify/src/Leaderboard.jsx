import { useEffect, useState } from "react";
import { Card, Table, Typography, Tag } from "antd";
import { TrophyOutlined, FireOutlined } from "@ant-design/icons";
import { getLeaderboard } from "./api";

const { Title } = Typography;

function Leaderboard() {
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

  const columns = [
    {
      title: "#",
      key: "place",
      render: (_, __, index) => {
        if (index === 0) {
          return <TrophyOutlined style={{ color: "#faad14", fontSize: 18 }} />;
        }

        if (index === 1) {
          return "🥈";
        }

        if (index === 2) {
          return "🥉";
        }

        return index + 1;
      },
    },
    {
      title: "Имя",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Всего дней",
      dataIndex: "total_days",
      key: "total_days",
      sorter: (a, b) => b.total_days - a.total_days,
      render: (value) => (
        <Tag color="green">{value}</Tag>
      ),
    },
    {
      title: "Серия",
      dataIndex: "streak",
      key: "streak",
      sorter: (a, b) => b.streak - a.streak,
      render: (value) => (
        <Tag color="orange">
          <FireOutlined /> {value}
        </Tag>
      ),
    },
    {
      title: "Пропущено",
      dataIndex: "missed_days",
      key: "missed_days",
      sorter: (a, b) => b.missed_days - a.missed_days,
      render: (value) => (
        <Tag color="red">{value}</Tag>
      ),
    },
  ];

  return (
    <Card style={{ marginTop: 20 }}>
      <Title level={3}>Рейтинг участников</Title>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        pagination={false}
      />
    </Card>
  );
}

export default Leaderboard;