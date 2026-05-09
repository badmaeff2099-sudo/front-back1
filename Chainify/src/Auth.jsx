import { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Divider,
  Checkbox,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  LoginOutlined,
  UserAddOutlined,
  EnvironmentOutlined,
  AimOutlined,
} from "@ant-design/icons";
import { register, login } from "./api";
import "./Auth.css";

const { Title, Text, Link } = Typography;

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (isLogin) {
        const res = await login({  email: values.email,  password: values.password});
        if (!res.success) {
          message.error(res.error || "Неверный логин или пароль");
          return;
        }
        localStorage.setItem("chainify-user-data", JSON.stringify(res.user));
        message.success("Добро пожаловать обратно! 🎉");
        onLogin(res.user);
      } else {
        const res = await register({
          username: values.username,
          password: values.password,
          email: values.email || "",
          location: values.location || "",
          goal: values.goal || "",
          daily_actions: values.daily_actions || "",
        });
        if (!res.success) {
          message.error(res.error || "Ошибка регистрации");
          return;
        }
        localStorage.setItem("chainify-user-data", JSON.stringify(res.user));
        message.success("Регистрация успешна! Добро пожаловать! 🎉");
        onLogin(res.user);
      }
    } catch {
      message.error("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    form.resetFields();
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
      
      <Card className="auth-card">
        <div className="auth-header">
          <Title level={2} className="auth-title">
            Chainify
          </Title>
          <Text type="secondary" className="auth-subtitle">
            {isLogin
              ? "Добро пожаловать обратно!"
              : "Создайте аккаунт и начните свой путь"}
          </Text>
        </div>

        <Form
          form={form}
          name={isLogin ? "login" : "register"}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          className="auth-form"
        >
          {(
            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Пожалуйста, введите email!" },
                { type: "email", message: "Введите корректный email!" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Email"
                className="auth-input"
              />
            </Form.Item>
          )}

          <Form.Item
            name="username"
            rules={[
              { required: true, message: "Пожалуйста, введите имя пользователя!" },
              { min: 3, message: "Минимум 3 символа!" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Имя пользователя"
              className="auth-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Пожалуйста, введите пароль!" },
              { min: 6, message: "Минимум 6 символов!" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Пароль"
              className="auth-input"
            />
          </Form.Item>

          {!isLogin && (
            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Подтвердите пароль!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Пароли не совпадают!")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Подтвердите пароль"
                className="auth-input"
              />
            </Form.Item>
          )}

          {!isLogin && (
            <Form.Item name="location">
              <Input
                prefix={<EnvironmentOutlined />}
                placeholder="Ваш город (например: Москва)"
                className="auth-input"
              />
            </Form.Item>
          )}

          {!isLogin && (
            <Form.Item name="goal">
              <Input
                prefix={<AimOutlined />}
                placeholder="Ваша цель"
                className="auth-input"
              />
            </Form.Item>
          )}

          {!isLogin && (
            <Form.Item name="daily_actions">
              <Input.TextArea
                placeholder="Ежедневные действия (опишите, что будете делать каждый день)"
                rows={2}
                className="auth-input"
                maxLength={300}
              />
            </Form.Item>
          )}

          {isLogin && (
            <div className="auth-options">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Запомнить меня</Checkbox>
              </Form.Item>
              <Link className="auth-forgot-link">Забыли пароль?</Link>
            </div>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="auth-submit-button"
              icon={isLogin ? <LoginOutlined /> : <UserAddOutlined />}
            >
              {isLogin ? "Войти" : "Зарегистрироваться"}
            </Button>
          </Form.Item>
        </Form>

        <Divider className="auth-divider">
          <Text type="secondary">или</Text>
        </Divider>

        <div className="auth-footer">
          <Text type="secondary">
            {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
          </Text>
          <Link onClick={switchMode} className="auth-switch-link">
            {isLogin ? "Зарегистрироваться" : "Войти"}
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default Auth;
