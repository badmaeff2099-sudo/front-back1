import { useState, useEffect, useRef } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Avatar,
  message,
  Empty,
  Spin,
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  MessageOutlined,
  UpOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { sendMessage, getMessages } from "./api";
import "./Chat.css";

const { Text } = Typography;
const { TextArea } = Input;

const POLL_INTERVAL = 10000; // 10 seconds

function Chat({ profileUsername, currentUser, compact = false }) {
  const [isCollapsed, setIsCollapsed] = useState(compact);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const chatEndRef = useRef(null);

  const currentUserId =
    typeof currentUser === "object"
      ? currentUser?.id
      : (() => {
          try {
            return JSON.parse(localStorage.getItem("chainify-user-data"))?.id;
          } catch {
            return null;
          }
        })();
  const currentUsername =
    typeof currentUser === "object" ? currentUser?.username : currentUser;

  const channel = profileUsername || "general";

  const loadMessages = async () => {
    try {
      const res = await getMessages(channel);
      if (res.success) setComments(res.messages);
    } catch {
      // silent — don't spam errors on poll
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [channel]);

  useEffect(() => {
    setIsCollapsed(compact);
  }, [compact]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  const handleSubmit = async (values) => {
    if (!values.message || !values.message.trim()) {
      message.warning("Введите сообщение!");
      return;
    }
    if (!currentUserId) {
      message.error("Не удалось определить пользователя");
      return;
    }

    setLoading(true);
    try {
      const res = await sendMessage(currentUserId, channel, values.message.trim());
      if (res.success) {
        form.resetFields();
        await loadMessages();
      } else {
        message.error(res.error || "Ошибка при отправке");
      }
    } catch {
      message.error("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "только что";
    if (minutes < 60)
      return `${minutes} ${minutes === 1 ? "минуту" : minutes < 5 ? "минуты" : "минут"} назад`;
    if (hours < 24)
      return `${hours} ${hours === 1 ? "час" : hours < 5 ? "часа" : "часов"} назад`;
    if (days < 7)
      return `${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"} назад`;
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className={`chat-container ${compact ? "chat-compact" : ""}`}>
      <Card
        className={`chat-card ${compact ? "chat-card-compact" : ""}`}
        bordered={false}
      >
        <div className="chat-header">
          <Space>
            <MessageOutlined style={{ fontSize: "20px", color: "#667eea" }} />
            <Text strong style={{ fontSize: compact ? "16px" : "18px" }}>
              {compact ? "Чат" : "Комментарии"} ({comments.length})
            </Text>
          </Space>
          {compact && (
            <Button
              type="text"
              icon={isCollapsed ? <UpOutlined /> : <DownOutlined />}
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="chat-collapse-button"
            />
          )}
        </div>

        {!isCollapsed && (
          <>
            <div
              className={`chat-messages ${compact ? "chat-messages-compact" : ""}`}
            >
              {comments.length === 0 ? (
                <Empty
                  description="Пока нет сообщений. Будьте первым!"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ margin: "40px 0" }}
                />
              ) : (
                <div className="comments-list">
                  {comments.map((comment) => {
                    const isOwn = comment.username === currentUsername;
                    return (
                      <div
                        key={comment.id}
                        className={`comment-item ${isOwn ? "own-comment" : ""}`}
                      >
                        <div className="comment-avatar">
                          <Avatar
                            size={40}
                            icon={<UserOutlined />}
                            style={{
                              backgroundColor: isOwn ? "#667eea" : "#976ea8ff",
                            }}
                          >
                            {comment.username?.charAt(0).toUpperCase()}
                          </Avatar>
                        </div>
                        <div className="comment-content">
                          <div className="comment-header">
                            <Text strong className="comment-author">
                              {comment.username}
                            </Text>
                            <Text type="secondary" className="comment-time">
                              {formatTime(comment.created_at)}
                            </Text>
                          </div>
                          <div className="comment-message">{comment.message}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            <div className="chat-input-container">
              <Form form={form} onFinish={handleSubmit} className="chat-form">
                <Form.Item
                  name="message"
                  rules={[
                    { required: true, message: "Введите сообщение!" },
                    { max: 1000, message: "Максимум 1000 символов!" },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <TextArea
                    rows={compact ? 2 : 3}
                    placeholder="Напишите сообщение..."
                    className="chat-textarea"
                    maxLength={1000}
                    showCount={!compact}
                    onPressEnter={(e) => {
                      if (e.shiftKey) return;
                      e.preventDefault();
                      form.submit();
                    }}
                  />
                </Form.Item>
                <div className="chat-actions">
                  {!compact && (
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Нажмите Enter для отправки, Shift+Enter для новой строки
                    </Text>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SendOutlined />}
                    loading={loading}
                    className="chat-send-button"
                    size={compact ? "small" : "middle"}
                  >
                    {compact ? "" : "Отправить"}
                  </Button>
                </div>
              </Form>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default Chat;
