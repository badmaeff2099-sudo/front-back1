import { useState, useEffect } from "react";
import {
  Layout,
  Card,
  Button,
  Avatar,
  Typography,
  Space,
  Tag,
  Badge,
  message,
  ConfigProvider,
  Spin,
  Select,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  TrophyOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import Auth from "./Auth";
import Profile from "./Profile";
import Chat from "./Chat";
import Leaderboard from "./Leaderboard";
import { getRank } from "./utils/ranks";
import { getUsers, markDay } from "./api";
import UserProfile from "./UserProfile";
import { requestPermission, checkAndNotify } from "./notifications";
import "./styles.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const PARTICIPANTS_PER_PAGE = 8;
const DAYS_TO_SHOW = 30;

function getDayColor(dateStr, completedDates) {
  const today = new Date().toISOString().slice(0, 10);
  if (dateStr > today) return "future";
  if (completedDates.includes(dateStr)) return "done";
  return "missed";
}



function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("chainify-user-data");
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("chainify-user-data");
    return saved ? JSON.parse(saved) : null;
  });
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locations, setLocations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

 

  const loadParticipants = async (location) => {
    setLoading(true);
    try {
      const res = await getUsers(location);
      if (res.success) {
  setParticipants(res.users);

  const locs = [
    ...new Set(
      res.users
        .map((u) => u.location)
        .filter(Boolean)
    ),
  ];

  setLocations((prev) => {
    const same =
      JSON.stringify(prev) === JSON.stringify(locs);

    return same ? prev : locs;
  });
}
    } catch {
      message.error("Не удалось загрузить участников");
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  if (!isAuthenticated || !currentUser) return;

  const loc = currentUser.location || "";

  setSelectedLocation(loc);

  loadParticipants(loc);

  requestPermission();

  checkAndNotify();

}, [isAuthenticated, currentUser]);

 const handleLogin = (userData) => {

  localStorage.setItem(
    "chainify-user-data",
    JSON.stringify(userData)
  );

  setCurrentUser(userData);

  setIsAuthenticated(true);
};

  const handleLogout = () => {
    localStorage.removeItem("chainify-user-data");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowProfile(false);
    message.info("Вы вышли из системы");
  };

 const handleUpdateUser = (updatedUser) => {
  setCurrentUser((prev) => ({
    ...prev,
    ...updatedUser,
  }));

  localStorage.setItem(
    "chainify-user-data",
    JSON.stringify({
      ...currentUser,
      ...updatedUser,
    })
  );
};

  const handleLocationChange = (loc) => {
    setSelectedLocation(loc);
    setCurrentPage(1);
    loadParticipants(loc);
  };

  const handleMarkDay = async (participantId) => {
    if (!currentUser || currentUser.id !== participantId) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      const res = await markDay(participantId, today);
      if (res.success) {
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === participantId
              ? { ...p, completed_dates: [...p.completed_dates, today] }
              : p
          )
        );
        message.success("День отмечен! Отличная работа! 🎉");
      } else if (res.error === "Already marked for this date") {
        message.warning("Сегодня уже отмечено!");
      } else {
        message.error(res.error || "Ошибка");
      }
    } catch {
      message.error("Ошибка соединения");
    }
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  if (showLeaderboard) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#c8c4bfff",
          borderRadius: 8,
        },
      }}
    >
      <Leaderboard
        onBack={() => setShowLeaderboard(false)}
      />
    </ConfigProvider>
  );
}

  if (showProfile) {
    return (
      <ConfigProvider theme={{ token: { colorPrimary: "#c8c4bfff", borderRadius: 8 } }}>
        <Profile
          currentUser={currentUser}
          onBack={() => setShowProfile(false)}
          onUpdateUser={handleUpdateUser}
        />
      </ConfigProvider>
    );
  }

  if (selectedUser) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#c8c4bfff",
          borderRadius: 8,
        },
      }}
    >
      <UserProfile
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
      />
    </ConfigProvider>
  );
}

  const paginatedParticipants = participants.slice(
    (currentPage - 1) * PARTICIPANTS_PER_PAGE,
    currentPage * PARTICIPANTS_PER_PAGE
  );

  const totalPages = Math.ceil(participants.length / PARTICIPANTS_PER_PAGE);

  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#c8c4bfff", borderRadius: 8 } }}>
      <Layout className="app-layout">
        <Header className="app-header">
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      gap: 20,
    }}
  >
    {/* Левая часть */}
    <Title
      level={2}
      className="header-title"
      style={{
        margin: 0,
        minWidth: 160,
      }}
    >
      Chainify
    </Title>

    {/* Центр */}
    <div
      style={{
        flex: 1,
        textAlign: "center",
      }}
    >
      <Text
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "#0f0d0d",
          letterSpacing: "0.5px",
        }}
      >
        Каждый день — новая Возможность!
      </Text>
    </div>

    {/* Правая часть */}
    <Space>
      {locations.length > 0 && (
        <Select
          value={selectedLocation || undefined}
          placeholder="Все локации"
          allowClear
          style={{ minWidth: 140 }}
          onChange={(val) =>
            handleLocationChange(val || "")
          }
          options={locations.map((l) => ({
            value: l,
            label: l,
          }))}
          prefix={<EnvironmentOutlined />}
        />
      )}

      <Button
        type="link"
        icon={<TrophyOutlined />}
        className="header-link"
        onClick={() =>
          setShowLeaderboard(true)
        }
      >
        Рейтинг
      </Button>

      <Button
        type="link"
        icon={<LogoutOutlined />}
        className="header-link"
        onClick={handleLogout}
      >
        Выйти
      </Button>
    </Space>
  </div>
</Header>

        <Content className="app-content">
          <div className="main-content">
            <div className="left-panel">
              <Card className="profile-card">
                <Space direction="vertical" size="large" align="center" style={{ width: "100%" }}>
                  <Title level={3} style={{ margin: 0, textTransform: "capitalize" }}>
                    {currentUser?.username}
                  </Title>

                  <Badge.Ribbon text="Рабочий режим" color="#696FC7">
                    <Avatar
                      size={120}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: "#976ea8ff", fontSize: "60px", cursor: "pointer" }}
                      onClick={() => setShowProfile(true)}
                      className="profile-avatar-clickable"
                    />
                  </Badge.Ribbon>

                  <Button
                    type="default"
                    icon={<UserOutlined />}
                    onClick={() => setShowProfile(true)}
                    style={{ marginTop: "8px", borderRadius: "8px" }}
                  >
                    Мой профиль
                  </Button>

                  {currentUser?.goal && (
                    <Text style={{ textAlign: "center", color: "#8c8c8c", fontSize: "14px" }}>
                      {currentUser.goal}
                    </Text>
                  )}
                  {currentUser?.location && (
                    <Tag icon={<EnvironmentOutlined />} color="default">
                      {currentUser.location}
                    </Tag>
                  )}
                </Space>
              </Card>
              
            </div>

            <div className="right-panel">
              <Card className="progress-card">
                {loading ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <>
                    <div className="progress-grid">
                      {paginatedParticipants.map((participant, index) => {
                        const rank = getRank(participant.completed_dates.length);
                        const globalIndex = (currentPage - 1) * PARTICIPANTS_PER_PAGE + index + 1;
                        const isCurrentUser = currentUser?.id === participant.id;
                        const today = new Date().toISOString().slice(0, 10);
                        const todayDone = participant.completed_dates.includes(today);

                        return (
                          <div key={participant.id} className="progress-column">
                            <Space direction="vertical" size="small" align="center">
                              <div className="column-header">
                                <Space direction="vertical" size={4} align="center">
                                  <Badge
  count={globalIndex}
  title={`${rank.icon} ${rank.title}`}
  style={{
                                      backgroundColor:
                                        participant.completed_dates.length > 0
                                          ? "#1DB954"
                                          : "#d9d9d9",
                                      minWidth: "24px",
                                      height: "24px",
                                      lineHeight: "24px",
                                      fontSize: "12px",
                                      fontWeight: "bold",
                                    }}
                                  />
                                  <Text
  strong
  style={{
    fontSize: "14px",
    cursor: "pointer",
  }}
  onClick={() => setSelectedUser(participant)}
>
  {participant.username}
</Text>
                                  {participant.goal && (
                                    <Tag color="default" style={{ marginTop: "4px", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {participant.goal}
                                    </Tag>
                                  )}
                                  <Text type="secondary" style={{ fontSize: "12px", fontWeight: "bold" }}>
                                    {participant.completed_dates.length} дней
                                  </Text>
                                  {isCurrentUser && !todayDone && (
                                    <Button
                                      size="small"
                                      type="primary"
                                      onClick={() => handleMarkDay(participant.id)}
                                      style={{ marginTop: 4, fontSize: "11px" }}
                                    >
                                      Отметить сегодня
                                    </Button>
                                  )}
                                </Space>
                              </div>

                              <div
  className="progress-bars"
  style={{
    display: "flex",
    flexDirection: "column-reverse",
  }}
>
  {[...Array(DAYS_TO_SHOW)].map((_, index) => {

    const today = new Date()
      .toLocaleDateString("sv-SE");

    const completedDates =
      participant.completed_dates || [];

    const todayDone =
      completedDates.includes(today);

    const totalCompleted =
      completedDates.length;

    const cyclePosition =
      totalCompleted % DAYS_TO_SHOW === 0 &&
      totalCompleted > 0
        ? DAYS_TO_SHOW
        : totalCompleted % DAYS_TO_SHOW;

    /*
      Текущий активный день:
      - если сегодня НЕ отмечено:
        рамка стоит на текущем сером
      - если отмечено:
        рамка остается на зеленом сегодняшнем
    */

    const currentIndex =
      cyclePosition === 0
        ? 0
        : todayDone
        ? cyclePosition - 1
        : cyclePosition;

    let color = "#e8e8e8";

    // completed cells
    if (
      index < cyclePosition ||
      (todayDone && index === cyclePosition - 1)
    ) {
      color = "#1DB954";
    }

    const currentCell =
      index === currentIndex;

    /*
      Правильная дата для tooltip
    */

    const cellDate = new Date();

    if (todayDone) {
      cellDate.setDate(
        cellDate.getDate() -
          (cyclePosition - 1 - index)
      );
    } else {
      cellDate.setDate(
        cellDate.getDate() -
          (cyclePosition - index)
      );
    }

    return (
      <Tooltip
        key={index}
        title={cellDate.toLocaleDateString("sv-SE")}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 3,
            marginBottom: 3,
            backgroundColor: color,
            border: currentCell
              ? "2px solid #faad14"
              : "none",
            transition: "all 0.2s ease",
          }}
        />
      </Tooltip>
    );
  })}
</div>
                            </Space>
                          </div>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div className="pagination-container">
                        <Space>
                          <Button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                          >
                            ←
                          </Button>
                          <Text type="secondary">
                            {currentPage} / {totalPages}
                          </Text>
                          <Button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                          >
                            →
                          </Button>
                        </Space>
                      </div>
                    )}
                  </>
                )}
              </Card>

              <Card className="stats-card">
                <Space>
                  <TrophyOutlined style={{ fontSize: "18px", color: "#faad14" }} />
                  <Text strong style={{ fontSize: "16px" }}>
                    Участников в локации:{" "}
                    <Badge
                      count={participants.length}
                      showZero
                      style={{ backgroundColor: "#1DB954" }}
                    />
                  </Text>
                </Space>
              </Card>
            </div>
          </div>
        </Content>

        <Chat profileUsername="general" currentUser={currentUser?.username || ""} compact={true} />
      </Layout>
    </ConfigProvider>
  );
}

export default App;
