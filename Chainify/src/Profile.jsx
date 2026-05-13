import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Avatar,
  message,
  Divider,
  Row,
  Col,
  Statistic,
  Tag,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  TrophyOutlined,
  CalendarOutlined,
  AimOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import Chat from "./Chat";
import { getProgress, updateProfile, addReaction, getReactions } from "./api";
import "./Profile.css";

const { Title, Text } = Typography;

function Profile({ currentUser, onBack, onUpdateUser, profileUser }) {
  const profileUsername = profileUser || currentUser?.username || currentUser;
  const profileUserId = profileUser?.id || currentUser?.id;
  const currentUserId = currentUser?.id;
  const isOwnProfile = !profileUser || profileUser.id === currentUserId;

  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [userData, setUserData] = useState(() => {
    const base = typeof currentUser === "object" ? currentUser : {};
    const saved = localStorage.getItem(`chainify-user-${base.username || currentUser}`);
    return saved ? { ...base, ...JSON.parse(saved) } : base;
  });
  const [stats, setStats] = useState({ totalDays: 0, streak: 0 });
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (profileUserId) {
      getProgress(profileUserId).then((res) => {
        if (res.success) {
          setStats({ totalDays: res.total, streak: res.streak });
        }
      });
      getReactions(profileUserId).then((res) => {
        if (res.success) setReactions(res.reactions);
      });
    }
  }, [profileUserId]);

  useEffect(() => {
    form.setFieldsValue(userData);
  }, [userData, form]);

  const handleSave = async (values) => {
    try {
      const res = await updateProfile(currentUserId, {
  username: values.username || "",
  goal: values.goal || "",
  location: values.location || "",
});
      if (res.success) {
const updatedUser = {
  ...userData,
  ...values,
  ...res.user
};

setUserData(updatedUser);
onUpdateUser(updatedUser);

localStorage.setItem(
  "chainify-user-data",
  JSON.stringify(updatedUser)
);

  message.success("Профиль успешно обновлён!");
  setIsEditing(false);
} else {
        message.error(res.error || "Ошибка при сохранении");
      }
    } catch (e) {
  console.log(e);
  message.error("Ошибка соединения");
}
  };

  const handleCancel = () => {
    form.setFieldsValue(userData);
    setIsEditing(false);
  };

  const handleReaction = async (emoji) => {
    try {
      const res = await addReaction(currentUserId, profileUserId, emoji);
      if (res.success) {
        message.success(`Реакция ${emoji} отправлена!`);
        const updated = await getReactions(profileUserId);
        if (updated.success) setReactions(updated.reactions);
      } else {
        message.error(res.error || "Ошибка");
      }
    } catch {
      message.error("Ошибка соединения");
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          className="profile-back-button"
        >
          Назад
        </Button>

        <Card className="profile-main-card">
          <div className="profile-header">
            <Space direction="vertical" size="large" align="center" style={{ width: "100%" }}>
              <Avatar
                size={120}
                icon={<UserOutlined />}
                style={{
                  backgroundColor: "#976ea8ff",
                  fontSize: "60px",
                }}
                className="profile-avatar"
              />
              {!isEditing && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setIsEditing(true)}
                  className="profile-edit-button"
                >
                  Редактировать профиль
                </Button>
              )}
            </Space>
          </div>

          <Divider />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            className="profile-form"
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Имя пользователя"
                  name="username"
                  rules={[
                    { required: true, message: "Введите имя пользователя!" },
                    { min: 3, message: "Минимум 3 символа!" },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    disabled={!isEditing}
                    className="profile-input"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { type: "email", message: "Введите корректный email!" },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    disabled={!isEditing}
                    placeholder="email@example.com"
                    className="profile-input"
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Полное имя" name="fullName">
                  <Input
                    disabled={!isEditing}
                    placeholder="Ваше полное имя"
                    className="profile-input"
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="О себе" name="bio">
                  <Input.TextArea
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Расскажите о себе..."
                    className="profile-textarea"
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Локация" name="location">
                  <Input
                    prefix={<EnvironmentOutlined />}
                    disabled={!isEditing}
                    placeholder="Ваш город"
                    className="profile-input"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Цель" name="goal">
                  <Input
                    prefix={<AimOutlined />}
                    disabled={!isEditing}
                    placeholder="Ваша цель"
                    className="profile-input"
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Ежедневные действия" name="daily_actions">
                  <Input.TextArea
                    disabled={!isEditing}
                    rows={2}
                    placeholder="Что делаете каждый день?"
                    className="profile-textarea"
                    maxLength={300}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <div className="profile-info-section">
                  <Text type="secondary" className="profile-info-label">
                    <CalendarOutlined /> Дата регистрации
                  </Text>
                  <Text className="profile-info-value">{userData.joinDate || "—"}</Text>
                </div>
              </Col>
            </Row>

            {isEditing && (
              <div className="profile-form-actions">
                <Space>
                  <Button onClick={handleCancel} icon={<CloseOutlined />}>
                    Отмена
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    className="profile-save-button"
                  >
                    Сохранить
                  </Button>
                </Space>
              </div>
            )}
          </Form>

          <Divider />

          <div className="profile-stats">
            <Title level={4}>Статистика</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Card className="stat-card">
                  <Statistic
                    title="Всего дней"
                    value={stats.totalDays}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: "#1DB954" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card className="stat-card">
                  <Statistic
                    title="Текущая серия"
                    value={stats.streak}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: "#F5B027" }}
                  />
                </Card>
              </Col>
            </Row>
          </div>

          <Divider />

          {/* Reactions block */}
          <div className="profile-reactions">
            <Title level={4}>Реакции</Title>
            {!isOwnProfile && (
              <Space style={{ marginBottom: 12 }}>
                {["🔥", "💪", "👏", "⭐", "🎉"].map((emoji) => (
                  <Tooltip key={emoji} title={`Отправить ${emoji}`}>
                    <Button onClick={() => handleReaction(emoji)} style={{ fontSize: 18 }}>
                      {emoji}
                    </Button>
                  </Tooltip>
                ))}
              </Space>
            )}
            {reactions.length === 0 ? (
              <Text type="secondary">Пока нет реакций</Text>
            ) : (
              <Space wrap>
                {reactions.slice(0, 30).map((r, i) => (
                  <Tag key={i} style={{ fontSize: 14 }}>
                    {r.emoji} от {r.from_username}
                  </Tag>
                ))}
              </Space>
            )}
          </div>

          <Divider />

          <Chat profileUsername={profileUsername} currentUser={currentUser?.username || currentUser} />
        </Card>
      </div>
    </div>
  );
}

export default Profile;
