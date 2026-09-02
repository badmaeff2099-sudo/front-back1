--
-- PostgreSQL database dump
--

\restrict mAaeUzuL9K5qDrmSW9Ap04iQpwcQoRrFCw7v0nG5NbYgxr3oco4aDLtDqIQ8aRN

-- Dumped from database version 17.10 (Homebrew)
-- Dumped by pg_dump version 17.10 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: challenges; Type: TABLE; Schema: public; Owner: bairbadmaev
--

CREATE TABLE public.challenges (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.challenges OWNER TO bairbadmaev;

--
-- Name: challenges_id_seq; Type: SEQUENCE; Schema: public; Owner: bairbadmaev
--

CREATE SEQUENCE public.challenges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.challenges_id_seq OWNER TO bairbadmaev;

--
-- Name: challenges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bairbadmaev
--

ALTER SEQUENCE public.challenges_id_seq OWNED BY public.challenges.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: bairbadmaev
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    user_id integer NOT NULL,
    channel character varying(255) DEFAULT 'general'::character varying,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_messages OWNER TO bairbadmaev;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: bairbadmaev
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO bairbadmaev;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bairbadmaev
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: discipline_scores; Type: TABLE; Schema: public; Owner: bairbadmaev
--

CREATE TABLE public.discipline_scores (
    id integer NOT NULL,
    user_id integer NOT NULL,
    completed_days integer DEFAULT 0 NOT NULL,
    missed_days integer DEFAULT 0 NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    calculated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    rest_days integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.discipline_scores OWNER TO bairbadmaev;

--
-- Name: discipline_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: bairbadmaev
--

CREATE SEQUENCE public.discipline_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.discipline_scores_id_seq OWNER TO bairbadmaev;

--
-- Name: discipline_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bairbadmaev
--

ALTER SEQUENCE public.discipline_scores_id_seq OWNED BY public.discipline_scores.id;


--
-- Name: friendships; Type: TABLE; Schema: public; Owner: bairbadmaev
--

CREATE TABLE public.friendships (
    id integer NOT NULL,
    from_user_id integer NOT NULL,
    to_user_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.friendships OWNER TO bairbadmaev;

--
-- Name: friendships_id_seq; Type: SEQUENCE; Schema: public; Owner: bairbadmaev
--

CREATE SEQUENCE public.friendships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.friendships_id_seq OWNER TO bairbadmaev;

--
-- Name: friendships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bairbadmaev
--

ALTER SEQUENCE public.friendships_id_seq OWNED BY public.friendships.id;


--
-- Name: goals500; Type: TABLE; Schema: public; Owner: bairbadmaev
--

CREATE TABLE public.goals500 (
    id integer NOT NULL,
    user_id integer NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    text text DEFAULT ''::text NOT NULL,
    done boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.goals500 OWNER TO bairbadmaev;

--
-- Name: goals500_id_seq; Type: SEQUENCE; Schema: public; Owner: bairbadmaev
--

CREATE SEQUENCE public.goals500_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goals500_id_seq OWNER TO bairbadmaev;

--
-- Name: goals500_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bairbadmaev
--

ALTER SEQUENCE public.goals500_id_seq OWNED BY public.goals500.id;


--
-- Name: habits; Type: TABLE; Schema: public; Owner: bairbadmaev
--

CREATE TABLE public.habits (
    id integer NOT NULL,
    user_id integer,
    title character varying(255) NOT NULL,
    total_days integer DEFAULT 30,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.habits OWNER TO bairbadmaev;

--
-- Name: habits_id_seq; Type: SEQUENCE; Schema: public; Owner: bairbadmaev
--

CREATE SEQUENCE public.habits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.habits_id_seq OWNER TO bairbadmaev;

--
-- Name: habits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bairbadmaev
--

ALTER SEQUENCE public.habits_id_seq OWNED BY public.habits.id;


--
-- Name: planner; Type: TABLE; Schema: public; Owner: bairbadmaev
--

CREATE TABLE public.planner (
    user_id integer NOT NULL,
    last_date date DEFAULT CURRENT_DATE NOT NULL
);


ALTER TABLE public.planner OWNER TO bairbadmaev;

--
-- Name: planner_items; Type: TABLE; Schema: public; Owner: bairbadmaev
--

CREATE TABLE public.planner_items (
    id integer NOT NULL,
    user_id integer NOT NULL,
    day_type character varying(10) NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    text text DEFAULT ''::text NOT NULL,
    CONSTRAINT planner_items_day_type_check CHECK (((day_type)::text = ANY ((ARRAY['today'::character varying, 'tomorrow'::character varying])::text[])))
);


ALTER TABLE public.planner_items OWNER TO bairbadmaev;

--
-- Name: planner_items_id_seq; Type: SEQUENCE; Schema: public; Owner: bairbadmaev
--

CREATE SEQUENCE public.planner_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.planner_items_id_seq OWNER TO bairbadmaev;

--
-- Name: planner_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bairbadmaev
--

ALTER SEQUENCE public.planner_items_id_seq OWNED BY public.planner_items.id;


--
-- Name: progress; Type: TABLE; Schema: public; Owner: bairbadmaev
--

CREATE TABLE public.progress (
    id integer NOT NULL,
    habit_id integer,
    day_date date NOT NULL,
    completed boolean DEFAULT false,
    user_id integer,
    status text DEFAULT 'done'::text
);


ALTER TABLE public.progress OWNER TO bairbadmaev;

--
-- Name: progress_id_seq; Type: SEQUENCE; Schema: public; Owner: bairbadmaev
--

CREATE SEQUENCE public.progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.progress_id_seq OWNER TO bairbadmaev;

--
-- Name: progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bairbadmaev
--

ALTER SEQUENCE public.progress_id_seq OWNED BY public.progress.id;


--
-- Name: reactions; Type: TABLE; Schema: public; Owner: bairbadmaev
--

CREATE TABLE public.reactions (
    id integer NOT NULL,
    from_user_id integer,
    to_user_id integer,
    emoji character varying(10) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reactions OWNER TO bairbadmaev;

--
-- Name: reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: bairbadmaev
--

CREATE SEQUENCE public.reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reactions_id_seq OWNER TO bairbadmaev;

--
-- Name: reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bairbadmaev
--

ALTER SEQUENCE public.reactions_id_seq OWNED BY public.reactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: bairbadmaev
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password text NOT NULL,
    created_at date DEFAULT CURRENT_TIMESTAMP,
    location text,
    goal text,
    full_name text,
    bio text,
    daily_actions text,
    avatar_url character varying(500),
    nickname character varying(50)
);


ALTER TABLE public.users OWNER TO bairbadmaev;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: bairbadmaev
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO bairbadmaev;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bairbadmaev
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: year_goal_subgoals; Type: TABLE; Schema: public; Owner: bairbadmaev
--

CREATE TABLE public.year_goal_subgoals (
    id integer NOT NULL,
    goal_id integer NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    text text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.year_goal_subgoals OWNER TO bairbadmaev;

--
-- Name: year_goal_subgoals_id_seq; Type: SEQUENCE; Schema: public; Owner: bairbadmaev
--

CREATE SEQUENCE public.year_goal_subgoals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.year_goal_subgoals_id_seq OWNER TO bairbadmaev;

--
-- Name: year_goal_subgoals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bairbadmaev
--

ALTER SEQUENCE public.year_goal_subgoals_id_seq OWNED BY public.year_goal_subgoals.id;


--
-- Name: year_goals; Type: TABLE; Schema: public; Owner: bairbadmaev
--

CREATE TABLE public.year_goals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    year smallint NOT NULL,
    month smallint NOT NULL,
    goal text DEFAULT ''::text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT year_goals_month_check CHECK (((month >= 1) AND (month <= 12)))
);


ALTER TABLE public.year_goals OWNER TO bairbadmaev;

--
-- Name: year_goals_id_seq; Type: SEQUENCE; Schema: public; Owner: bairbadmaev
--

CREATE SEQUENCE public.year_goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.year_goals_id_seq OWNER TO bairbadmaev;

--
-- Name: year_goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bairbadmaev
--

ALTER SEQUENCE public.year_goals_id_seq OWNED BY public.year_goals.id;


--
-- Name: challenges id; Type: DEFAULT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.challenges ALTER COLUMN id SET DEFAULT nextval('public.challenges_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: discipline_scores id; Type: DEFAULT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.discipline_scores ALTER COLUMN id SET DEFAULT nextval('public.discipline_scores_id_seq'::regclass);


--
-- Name: friendships id; Type: DEFAULT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.friendships ALTER COLUMN id SET DEFAULT nextval('public.friendships_id_seq'::regclass);


--
-- Name: goals500 id; Type: DEFAULT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.goals500 ALTER COLUMN id SET DEFAULT nextval('public.goals500_id_seq'::regclass);


--
-- Name: habits id; Type: DEFAULT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.habits ALTER COLUMN id SET DEFAULT nextval('public.habits_id_seq'::regclass);


--
-- Name: planner_items id; Type: DEFAULT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.planner_items ALTER COLUMN id SET DEFAULT nextval('public.planner_items_id_seq'::regclass);


--
-- Name: progress id; Type: DEFAULT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.progress ALTER COLUMN id SET DEFAULT nextval('public.progress_id_seq'::regclass);


--
-- Name: reactions id; Type: DEFAULT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.reactions ALTER COLUMN id SET DEFAULT nextval('public.reactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: year_goal_subgoals id; Type: DEFAULT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.year_goal_subgoals ALTER COLUMN id SET DEFAULT nextval('public.year_goal_subgoals_id_seq'::regclass);


--
-- Name: year_goals id; Type: DEFAULT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.year_goals ALTER COLUMN id SET DEFAULT nextval('public.year_goals_id_seq'::regclass);


--
-- Data for Name: challenges; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.challenges (id, title, description, active, created_at) FROM stdin;
2	3 часа без телефона	Не используй телефон в течение трёх часов.	t	2026-08-23 20:29:53.29223
4	10 000 шагов	Пройди сегодня минимум 10 000 шагов.	t	2026-08-23 20:29:53.29223
1	День без сладкого	Не ешь сегодня сладости, шоколад и десерты.	t	2026-08-23 20:29:53.29223
3	30 минут чтения	Прочитай книгу минимум 30 минут.	t	2026-08-23 20:29:53.29223
9	Холодный душ	Заверши обычный душ холодной водой.	t	2026-08-23 21:23:10.641673
10	Убери рабочее место	Полностью наведи порядок на своём рабочем столе.	t	2026-08-23 21:23:10.641673
54	Чистая комната	Перед сном оставь комнату убранной.	t	2026-08-23 21:23:10.641673
11	Встань сразу	Сегодня не нажимай кнопку «Отложить» после будильника.	t	2026-08-23 21:23:10.641673
12	20 отжиманий	Выполни 20 отжиманий за день.	t	2026-08-23 21:23:10.641673
13	Без соцсетей	Проведи минимум 4 часа без социальных сетей.	t	2026-08-23 21:23:10.641673
14	Утренний стакан воды	Выпей теплый стакан воды сразу после пробуждения.	t	2026-08-23 21:23:10.641673
15	20 минут прогулки	Проведи минимум 20 минут на свежем воздухе.	t	2026-08-23 21:23:10.641673
16	Заправь кровать	Сразу после пробуждения заправь свою кровать.	t	2026-08-23 21:23:10.641673
17	Один час тишины	Проведи один час без музыки, видео и развлечений.	t	2026-08-23 21:23:10.641673
18	Самая сложная задача	Выполни сегодня самую неприятную задачу первой.	t	2026-08-23 21:23:10.641673
19	50 приседаний	Сделай 50 приседаний в течение дня.	t	2026-08-23 21:23:10.641673
20	15 минут медитации	Проведи 15 минут в тишине, сосредоточившись на дыхании.	t	2026-08-23 21:23:10.641673
21	Выключи уведомления	Отключи ненужные уведомления на весь день.	t	2026-08-23 21:23:10.641673
22	1 час обучения	Потрать минимум час на изучение полезного навыка.	t	2026-08-23 21:23:10.641673
23	Без лишних покупок	Сегодня не покупай ничего, кроме действительно необходимого.	t	2026-08-23 21:23:10.641673
24	Разбери шкаф	Наведи порядок хотя бы в одном отделе шкафа.	t	2026-08-23 21:23:10.641673
25	30 минут спорта	Посвяти минимум 30 минут физической активности.	t	2026-08-23 21:23:10.641673
26	Не жалуйся	Проведи весь день без жалоб и нытья.	t	2026-08-23 21:23:10.641673
27	10 минут планирования	Утром составь план своих главных задач на день.	t	2026-08-23 21:23:10.641673
28	Закончи начатое	Заверши одну задачу, которую давно откладываешь.	t	2026-08-23 21:23:10.641673
29	Без YouTube	Не открывай YouTube в течение всего дня.	t	2026-08-23 21:23:10.641673
30	Без коротких видео	Не смотри TikTok, Reels или Shorts сегодня.	t	2026-08-23 21:23:10.641673
31	20 минут уборки	Потрать 20 минут на уборку дома или комнаты.	t	2026-08-23 21:23:10.641673
32	Ранний сон	Ляг спать минимум на 30 минут раньше обычного.	t	2026-08-23 21:23:10.641673
33	10 минут растяжки	Выполни 10 минут лёгкой растяжки.	t	2026-08-23 21:23:10.641673
34	5 новых иностранных слов	Выучи всего 5 иностранных слов и используй их в течении дня.	t	2026-08-23 21:23:10.641673
35	Запиши 3 цели	Запиши три цели, которых хочешь достичь в ближайшее время.	t	2026-08-23 21:23:10.641673
36	Без телефона за едой	Не используй телефон во время приёмов пищи сегодня.	t	2026-08-23 21:23:10.641673
37	Чистая почта	Удали ненужные письма из электронной почты.	t	2026-08-23 21:23:10.641673
38	Разбери файлы	Удали ненужные файлы и наведи порядок в одной папке.	t	2026-08-23 21:23:10.641673
39	30 минут без экрана	Проведи 30 минут перед сном без телефона и компьютера.	t	2026-08-23 21:23:10.641673
40	Сделай то, чего боишься	Выполни небольшое действие, которое давно откладываешь из-за страха.	t	2026-08-23 21:23:10.641673
41	Позвони близкому	Позвони человеку, с которым давно не разговаривал.	t	2026-08-23 21:23:10.641673
42	Поблагодари человека	Поблагодари человека за что-то.	t	2026-08-23 21:23:10.641673
43	Сделай добро	Сделай одно бескорыстное доброе дело.	t	2026-08-23 21:23:10.641673
44	Не опаздывай	Сегодня приходи на все встречи и дела вовремя.	t	2026-08-23 21:23:10.641673
45	100 приседаний	Выполни 100 приседаний в течение дня.	t	2026-08-23 21:23:10.641673
46	30 отжиманий	Выполни 30 отжиманий за день.	t	2026-08-23 21:23:10.641673
47	План без отвлечений	Выполни одну задачу, не отвлекаясь на телефон.	t	2026-08-23 21:23:10.641673
48	45 минут фокуса	Работай или учись 45 минут без отвлечений.	t	2026-08-23 21:23:10.641673
49	Без телефона утром	Не бери телефон первые 30 минут после пробуждения.	t	2026-08-23 21:23:10.641673
50	Утренняя прогулка	Выйди на прогулку в первой половине дня.	t	2026-08-23 21:23:10.641673
51	Вечерняя прогулка	Соверши 20-минутную прогулку вечером.	t	2026-08-23 21:23:10.641673
52	Без газировки	Не пей сегодня сладкие газированные напитки.	t	2026-08-23 21:23:10.641673
53	Фрукты вместо сладкого	Если захочется сладкого, выбери вместо него фрукт.	t	2026-08-23 21:23:10.641673
55	Разбери фотографии	Удали 30 ненужных фотографий с телефона.	t	2026-08-23 21:23:10.641673
56	Освободи память телефона	Удали 3 ненужные приложения.	t	2026-08-23 21:23:10.641673
57	Без наушников	Проведи хотя бы час без музыки, подкастов и видео.	t	2026-08-23 21:23:10.641673
58	20 минут обучения	Узнай что-то новое по интересующей тебя теме.	t	2026-08-23 21:23:10.641673
59	Запиши мысли	Вечером запиши несколько мыслей о прошедшем дне.	t	2026-08-23 21:23:10.641673
60	Определи приоритет	Выбери одну главную задачу и обязательно выполни её.	t	2026-08-23 21:23:10.641673
61	Не откладывай	Выполни небольшую задачу сразу, не откладывая её.	t	2026-08-23 21:23:10.641673
62	Один час продуктивности	Проведи один час исключительно полезной деятельностью.	t	2026-08-23 21:23:10.641673
63	Без многозадачности	Сегодня выполняй задачи только по одной.	t	2026-08-23 21:23:10.641673
64	Наведи порядок в телефоне	Удали минимум 10 ненужных файлов или фотографий.	t	2026-08-23 21:23:10.641673
65	Изучи 3 новых фактов	Узнай три новых факта по интересующей тебя теме.	t	2026-08-23 21:23:10.641673
66	Напиши визуализацию	Напиши на пол страницы от руки твою жизнь через 6 месяцев.	t	2026-08-23 21:23:10.641673
67	Прочитай статью	Прочитай одну полезную статью полностью.	t	2026-08-23 21:23:10.641673
68	Образовательное видео	Посмотри одно образовательное видео вместо развлекательного контента.	t	2026-08-23 21:23:10.641673
69	Без спешки	Сегодня сознательно выполняй привычные действия медленнее и внимательнее.	t	2026-08-23 21:23:10.641673
70	Не спорь	Не вступай сегодня в бессмысленные споры.	t	2026-08-23 21:23:10.641673
71	Слушай внимательно	В одном разговоре сегодня не перебивай собеседника.	t	2026-08-23 21:23:10.641673
72	Сделай комплимент	Сделай искренний комплимент одному человеку.	t	2026-08-23 21:23:10.641673
73	Помоги человеку	Предложи кому-нибудь помощь без просьбы с его стороны.	t	2026-08-23 21:23:10.641673
74	День без негатива	Не смотри и не отправляй негативный контент.	t	2026-08-23 21:23:10.641673
75	Проверь расходы	Запиши все свои расходы за сегодняшний день.	t	2026-08-23 21:23:10.641673
76	Без импульсивных покупок	Не покупай ничего под влиянием сиюминутного желания.	t	2026-08-23 21:23:10.641673
77	Отложи деньги	Отложи небольшую сумму денег в накопления.	t	2026-08-23 21:23:10.641673
78	Составь бюджет	Запиши план своих расходов на ближайшую неделю.	t	2026-08-23 21:23:10.641673
79	7 минут иностранного языка	Позанимайся иностранным языком минимум 7 минут.	t	2026-08-23 21:23:10.641673
80	Без прокрастинации	Как только заметишь, что откладываешь задачу, сразу начни её выполнять.	t	2026-08-23 21:23:10.641673
81	Сделай больше нормы	Выполни привычную задачу немного лучше или больше, чем обычно.	t	2026-08-23 21:23:10.641673
82	60 минут без развлечений	Проведи один час без игр, сериалов и социальных сетей.	t	2026-08-23 21:23:10.641673
83	Час без телефона перед сном	Не используй телефон за час до сна.	t	2026-08-23 21:23:10.641673
84	Утро без соцсетей	Не открывай социальные сети в течение первого часа после пробуждения.	t	2026-08-23 21:23:10.641673
85	Вечер без соцсетей	Не заходи в социальные сети после 20:00.	t	2026-08-23 21:23:10.641673
86	Сделай то, что откладывал	Выбери одну давно отложенную задачу и наконец выполни её.	t	2026-08-23 21:23:10.641673
87	5 минут порядка	Перед сном потрать 5 минут на наведение порядка.	t	2026-08-23 21:23:10.641673
88	Новый маршрут	Пройдись сегодня новым маршрутом, которым раньше не ходил.	t	2026-08-23 21:23:10.641673
89	Преврати жалобу в действие	Каждый раз, когда хочется пожаловаться, замени жалобу конкретным действием.	t	2026-08-23 21:23:10.641673
90	20 минут творчества	Посвяти 20 минут рисованию, музыке, письму или другому творчеству.	t	2026-08-23 21:23:10.641673
91	Узнай что-то о себе	Запиши одну свою сильную сторону и одну сторону, которую хочешь улучшить.	t	2026-08-23 21:23:10.641673
92	Сначала дела, потом развлечения	Не начинай развлечения, пока не выполнишь главную задачу дня.	t	2026-08-23 21:23:10.641673
93	Рабочий стол компьютера	Удали всё лишнее с рабочего стола компьютера и организуй файлы.	t	2026-08-23 21:23:10.641673
94	Один час концентрации	Работай над одной задачей один час без переключения на другие дела.	t	2026-08-23 21:23:10.641673
95	Шаг к большой цели	Выполни сегодня одно конкретное действие, которое приблизит тебя к важной цели.	t	2026-08-23 21:23:10.641673
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.chat_messages (id, user_id, channel, message, created_at) FROM stdin;
1	11	Ivan	прапр	2026-05-13 11:49:20.564643
2	6	Max	уеуке	2026-05-13 11:49:59.16963
\.


--
-- Data for Name: discipline_scores; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.discipline_scores (id, user_id, completed_days, missed_days, score, calculated_at, rest_days) FROM stdin;
8	9	4	93	3	2026-08-15 23:16:10.138464	1
1	6	26	88	27	2026-09-02 19:49:28.833374	4
10	11	6	106	0	2026-09-02 16:22:17.018012	0
7	8	7	87	0	2026-08-11 15:55:35.537439	0
9	10	2	87	0	2026-08-11 15:55:35.53932	1
11	12	2	87	0	2026-08-11 15:55:35.540991	1
12	13	1	86	0	2026-08-11 15:55:35.541783	2
13	14	0	88	0	2026-08-11 15:55:35.54257	1
14	15	1	86	0	2026-08-11 15:55:35.54335	2
15	16	2	85	0	2026-08-11 15:55:35.544131	0
16	18	2	56	0	2026-08-11 15:55:35.544891	0
17	21	2	56	0	2026-08-11 15:55:35.545643	0
18	22	3	53	0	2026-08-11 15:55:35.546411	2
19	23	0	55	0	2026-08-11 15:55:35.547154	1
20	24	1	53	0	2026-08-11 15:55:35.547759	2
21	25	0	55	0	2026-08-11 15:55:35.548325	1
22	26	1	54	0	2026-08-11 15:55:35.548704	1
6	7	12	103	0	2026-09-02 18:22:45.785207	1
\.


--
-- Data for Name: friendships; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.friendships (id, from_user_id, to_user_id, status, created_at) FROM stdin;
1	17	7	accepted	2026-05-20 09:20:01.651065
2	17	11	accepted	2026-05-22 10:02:46.195866
3	7	11	pending	2026-05-24 04:42:46.213925
4	14	11	pending	2026-05-24 05:41:15.832808
5	6	11	pending	2026-05-24 05:42:15.176173
6	8	11	pending	2026-05-24 05:43:31.380295
7	6	7	accepted	2026-06-07 01:44:51.057394
9	18	7	accepted	2026-06-14 01:29:17.399973
11	21	6	accepted	2026-06-14 03:46:26.862617
10	21	18	accepted	2026-06-14 03:46:21.597917
12	21	7	accepted	2026-06-14 03:46:30.633433
13	8	22	accepted	2026-06-16 11:46:07.643025
14	22	11	pending	2026-06-16 11:48:11.315472
15	9	6	accepted	2026-08-15 23:15:39.831494
16	6	24	pending	2026-08-23 19:13:17.795974
17	7	8	pending	2026-08-24 20:58:13.219379
18	7	26	pending	2026-08-24 20:58:13.812417
19	7	9	pending	2026-08-24 20:58:14.338969
\.


--
-- Data for Name: goals500; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.goals500 (id, user_id, "position", text, done, created_at) FROM stdin;
53	6	0	Бег	t	2026-09-02 15:55:58.829976
54	6	1		f	2026-09-02 15:55:58.829976
55	6	2		f	2026-09-02 15:55:58.829976
56	6	3		f	2026-09-02 15:55:58.829976
57	6	4		f	2026-09-02 15:55:58.829976
58	6	5		f	2026-09-02 15:55:58.829976
59	6	6		f	2026-09-02 15:55:58.829976
60	6	7		f	2026-09-02 15:55:58.829976
61	6	8		f	2026-09-02 15:55:58.829976
62	6	9		f	2026-09-02 15:55:58.829976
\.


--
-- Data for Name: habits; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.habits (id, user_id, title, total_days, created_at) FROM stdin;
\.


--
-- Data for Name: planner; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.planner (user_id, last_date) FROM stdin;
7	2026-08-24
6	2026-09-02
\.


--
-- Data for Name: planner_items; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.planner_items (id, user_id, day_type, "position", text) FROM stdin;
76	7	today	0	
77	7	today	1	
78	7	today	2	
79	7	today	3	
80	7	today	4	
101	6	today	0	
102	6	today	1	
103	6	today	2	
104	6	today	3	
105	6	today	4	
\.


--
-- Data for Name: progress; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.progress (id, habit_id, day_date, completed, user_id, status) FROM stdin;
5	\N	2026-05-09	t	6	done
6	\N	2026-05-09	t	7	done
7	\N	2026-05-09	t	8	done
8	\N	2026-05-10	t	6	done
9	\N	2026-05-10	t	8	done
10	\N	2026-05-12	t	6	done
11	\N	2026-05-13	t	6	done
12	\N	2026-05-13	t	7	done
13	\N	2026-05-13	t	8	done
14	\N	2026-05-13	t	9	done
15	\N	2026-05-13	t	12	done
16	\N	2026-05-13	f	11	done
17	\N	2026-05-13	f	10	done
18	\N	2026-05-14	f	6	done
19	\N	2026-05-14	f	9	done
20	\N	2026-05-14	f	8	done
21	\N	2026-05-14	f	11	done
22	\N	2026-05-14	f	12	done
23	\N	2026-05-14	f	10	done
24	\N	2026-05-14	f	7	done
25	\N	2026-05-14	f	13	done
26	\N	2026-05-16	f	16	done
27	\N	2026-05-16	f	11	done
28	\N	2026-05-16	f	8	done
29	\N	2026-05-16	f	9	done
31	\N	2026-05-20	f	7	done
33	\N	2026-05-22	f	7	done
34	\N	2026-05-22	f	11	done
35	\N	2026-05-23	f	7	done
36	\N	2026-05-23	f	6	done
37	\N	2026-05-23	f	8	done
38	\N	2026-05-23	f	11	done
39	\N	2026-05-27	f	7	done
40	\N	2026-06-06	f	6	done
41	\N	2026-06-06	f	7	done
42	\N	2026-06-13	f	7	done
43	\N	2026-06-13	f	6	done
44	\N	2026-06-14	f	18	done
45	\N	2026-06-14	f	21	done
46	\N	2026-06-14	f	22	done
47	\N	2026-06-15	f	22	done
48	\N	2026-06-15	f	6	done
49	\N	2026-06-16	f	6	done
50	\N	2026-06-16	f	18	done
51	\N	2026-06-16	f	7	done
52	\N	2026-06-16	f	21	done
53	\N	2026-06-16	f	8	done
54	\N	2026-06-16	f	22	done
55	\N	2026-06-16	f	11	done
56	\N	2026-06-16	f	15	rest
57	\N	2026-06-16	f	10	rest
58	\N	2026-06-16	f	9	rest
59	\N	2026-06-16	f	12	rest
60	\N	2026-06-16	f	13	rest
61	\N	2026-06-16	f	16	done
62	\N	2026-06-16	f	14	rest
63	\N	2026-06-16	f	23	rest
64	\N	2026-06-16	f	24	done
65	\N	2026-06-16	f	25	rest
66	\N	2026-06-16	f	26	done
67	\N	2026-06-17	f	13	rest
68	\N	2026-06-17	f	15	rest
69	\N	2026-06-17	f	26	rest
70	\N	2026-06-17	f	22	rest
71	\N	2026-06-17	f	7	done
72	\N	2026-06-17	f	24	rest
73	\N	2026-06-18	f	24	rest
74	\N	2026-06-18	f	22	rest
75	\N	2026-07-05	f	6	done
76	\N	2026-07-10	f	6	done
77	\N	2026-07-27	f	15	done
78	\N	2026-07-27	f	6	rest
79	\N	2026-08-02	f	6	done
80	\N	2026-08-05	f	6	done
81	\N	2026-08-06	f	6	done
82	\N	2026-08-07	f	6	done
83	\N	2026-08-11	f	6	done
84	\N	2026-08-14	f	6	done
85	\N	2026-08-15	f	6	done
86	\N	2026-08-15	f	9	done
87	\N	2026-08-16	f	6	rest
88	\N	2026-08-21	f	6	done
89	\N	2026-08-22	f	6	done
90	\N	2026-08-23	f	6	done
91	\N	2026-08-23	f	7	rest
92	\N	2026-08-24	f	7	done
93	\N	2026-08-24	f	6	done
94	\N	2026-08-25	f	6	done
95	\N	2026-08-27	f	6	done
96	\N	2026-08-28	f	6	rest
97	\N	2026-08-30	f	6	rest
98	\N	2026-09-02	f	6	done
\.


--
-- Data for Name: reactions; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.reactions (id, from_user_id, to_user_id, emoji, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.users (id, username, email, password, created_at, location, goal, full_name, bio, daily_actions, avatar_url, nickname) FROM stdin;
8	Alex	alex@gmail.com	$2y$12$y5Kz45Vy60RuPI1AW8YjXOmQgcaltaP08shLNHCn.v688hU0KUATq	2026-05-10	Улан	Ход	Alexander	Runner	Running every day	\N	\N
13	Bator	bator@gmail.com	$2y$12$AYdg4HF36pBDamPKiGHsqeV8oJWfvUZfbzJ.rbVfWmvWrOFAa9pHq	2026-05-14			\N	\N	\N	\N	\N
14	Irina	irina@gmail.com	$2y$12$XS10eDj/nXMoSsNTIAhMrO66xObOqKXy.9eZDc19h0a8NKzpayRty	2026-05-14	Москва	Бег	\N	\N	\N	\N	\N
15	Erdem	erdem@gmail.com	$2y$12$JHcqu6Rc7OaHA1TTHaogCuWOqu.DVHm43I1T6EOIzKtGmuIt9nIV2	2026-05-14	Улан-Удэ	Ходьба	\N	\N	\N	\N	\N
16	Mila	mila@gmail.com	$2y$12$UjdpjYkkgEH2vF2lSrN62OAiuuXOn6pz1G9YmVne/9K2OP7Wt8eJC	2026-05-16			\N	\N	\N	\N	\N
9	Ana	anna@gmail.com	$2y$12$ZygBNpELxHsM30QIoHqEgu/lEg472DnnE8C5mh.YZ7yc9.Ry9Y7Oy	2026-05-10	Улан-Удэ	Шахматы	\N	\N	\N	\N	\N
11	Ivan	ivan@gmail.com	$2y$12$wuSDLuovEEE/zBVFkxdpmOEJHgieoYGpOKFDe63rv4T/rnj1BM0lm	2026-05-13	Москва	Бег	\N			\N	ivan
7	Anton	anton@gmail.com	$2y$12$MLqm2ZxDjUmtL2FA47uh9uxdW7mDjd/vZ5SbAmQkMSFypFleAgckq	2026-05-10	Москва	Медитация	\N			/uploads/avatars/7.jpg	anton
18	Sam	sam@gmail.com	$2y$12$ndgvBjgblOzqmsCJoMpLguOP6H8UNm9DqYDZYemgRiBIgSq8H/AlK	2026-06-14	Москва	Английский	\N			\N	\N
21	KIm	kim@gmail.com	$2y$12$cTOl8C2CgobQS7PR3mL79u.p1Re1Juq9b4e2KwQVM7oOlCO1K6xga	2026-06-14			\N	\N	\N	\N	\N
22	Edik	edik@gmail.com	$2y$12$w0xnpEuDl4AcXmmo9f3wButZZHqOmHJRDlyxIfY9oERk71BWs6QSa	2026-06-14	Москва	Ходьба	\N			\N	\N
12	Maria	maria@gmail.com	$2y$12$TuxfgvG4wB8Y9uo/V0fr2eRRgK2ovu/JnpR9/pOAm8afDsmusBsIa	2026-05-13			\N			/uploads/avatars/12.jpg	\N
23	Vlad	vlad@gmail.com	$2y$12$S2O0D9BWrT9YDzC/O2PoAe/Q.a0fvbfSEZBy5DJmWvP89LdfOY2jO	2026-06-16	Новосибирск	Английский	\N	\N	\N	\N	\N
24	Olga	olga@gmail.com	$2y$12$a62TpqofxcuW9TqMB8JTBOZ95Whev4bQpLo.vZgya/uY67NCQbIg.	2026-06-16	Москва	Спорт	\N	\N	\N	\N	\N
25	Nina	nina@gmail.com	$2y$12$8coO3xv1OnbuyoFTlp.tC.xvo4j0ifZ7jlZS8EpiRf7sXeFk7lPhm	2026-06-16	Новосибирск		\N			\N	\N
26	Alim	alim@gmail.com	$2y$12$CnFVQYIOrPOXXa2VoSPiS.D3mC/64sDR90TWg2Jtw7biGUTtTlqLS	2026-06-16	Улан-Удэ	Бег	\N	\N	\N	\N	\N
10	Boris	boris@gmail.com	$2y$12$7YatqQJiOC02THXESLGWu.o6wF.YD0/0h88E6Y4J3A7t7U9BgBIQq	2026-05-13	Улан-Удэ	Мед	\N	\N	\N	\N	\N
6	Max 	max@gmail.com	$2y$12$kEO.RBZM.Ikp959E4V5d2utjCyO5gGxsT6bBsWjzc/hHteaRyP7n.	2026-05-08	Улан-Батор	Meditation				/uploads/avatars/6.png	madmax
\.


--
-- Data for Name: year_goal_subgoals; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.year_goal_subgoals (id, goal_id, "position", text) FROM stdin;
\.


--
-- Data for Name: year_goals; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.year_goals (id, user_id, year, month, goal, created_at, updated_at) FROM stdin;
\.


--
-- Name: challenges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.challenges_id_seq', 186, true);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 2, true);


--
-- Name: discipline_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.discipline_scores_id_seq', 826, true);


--
-- Name: friendships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.friendships_id_seq', 19, true);


--
-- Name: goals500_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.goals500_id_seq', 62, true);


--
-- Name: habits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.habits_id_seq', 1, true);


--
-- Name: planner_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.planner_items_id_seq', 105, true);


--
-- Name: progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.progress_id_seq', 98, true);


--
-- Name: reactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.reactions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.users_id_seq', 26, true);


--
-- Name: year_goal_subgoals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.year_goal_subgoals_id_seq', 40, true);


--
-- Name: year_goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.year_goals_id_seq', 29, true);


--
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: discipline_scores discipline_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.discipline_scores
    ADD CONSTRAINT discipline_scores_pkey PRIMARY KEY (id);


--
-- Name: discipline_scores discipline_scores_user_id_key; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.discipline_scores
    ADD CONSTRAINT discipline_scores_user_id_key UNIQUE (user_id);


--
-- Name: friendships friendships_from_user_id_to_user_id_key; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_from_user_id_to_user_id_key UNIQUE (from_user_id, to_user_id);


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (id);


--
-- Name: goals500 goals500_pkey; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.goals500
    ADD CONSTRAINT goals500_pkey PRIMARY KEY (id);


--
-- Name: habits habits_pkey; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_pkey PRIMARY KEY (id);


--
-- Name: planner_items planner_items_pkey; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.planner_items
    ADD CONSTRAINT planner_items_pkey PRIMARY KEY (id);


--
-- Name: planner planner_pkey; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.planner
    ADD CONSTRAINT planner_pkey PRIMARY KEY (user_id);


--
-- Name: progress progress_pkey; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_pkey PRIMARY KEY (id);


--
-- Name: reactions reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_pkey PRIMARY KEY (id);


--
-- Name: progress unique_user_day; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT unique_user_day UNIQUE (user_id, day_date);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: year_goal_subgoals year_goal_subgoals_pkey; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.year_goal_subgoals
    ADD CONSTRAINT year_goal_subgoals_pkey PRIMARY KEY (id);


--
-- Name: year_goals year_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.year_goals
    ADD CONSTRAINT year_goals_pkey PRIMARY KEY (id);


--
-- Name: year_goals year_goals_user_year_month_key; Type: CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.year_goals
    ADD CONSTRAINT year_goals_user_year_month_key UNIQUE (user_id, year, month);


--
-- Name: challenges_active_idx; Type: INDEX; Schema: public; Owner: bairbadmaev
--

CREATE INDEX challenges_active_idx ON public.challenges USING btree (active);


--
-- Name: challenges_title_key; Type: INDEX; Schema: public; Owner: bairbadmaev
--

CREATE UNIQUE INDEX challenges_title_key ON public.challenges USING btree (title);


--
-- Name: discipline_scores_score_idx; Type: INDEX; Schema: public; Owner: bairbadmaev
--

CREATE INDEX discipline_scores_score_idx ON public.discipline_scores USING btree (score DESC);


--
-- Name: goals500_user_id_idx; Type: INDEX; Schema: public; Owner: bairbadmaev
--

CREATE INDEX goals500_user_id_idx ON public.goals500 USING btree (user_id, "position");


--
-- Name: planner_items_user_idx; Type: INDEX; Schema: public; Owner: bairbadmaev
--

CREATE INDEX planner_items_user_idx ON public.planner_items USING btree (user_id, day_type, "position");


--
-- Name: users_nickname_lower_prefix; Type: INDEX; Schema: public; Owner: bairbadmaev
--

CREATE INDEX users_nickname_lower_prefix ON public.users USING btree (lower((nickname)::text) text_pattern_ops);


--
-- Name: users_nickname_lower_unique; Type: INDEX; Schema: public; Owner: bairbadmaev
--

CREATE UNIQUE INDEX users_nickname_lower_unique ON public.users USING btree (lower((nickname)::text));


--
-- Name: users_nickname_trgm; Type: INDEX; Schema: public; Owner: bairbadmaev
--

CREATE INDEX users_nickname_trgm ON public.users USING gin (nickname public.gin_trgm_ops);


--
-- Name: users_username_lower_prefix; Type: INDEX; Schema: public; Owner: bairbadmaev
--

CREATE INDEX users_username_lower_prefix ON public.users USING btree (lower((username)::text) text_pattern_ops);


--
-- Name: users_username_trgm; Type: INDEX; Schema: public; Owner: bairbadmaev
--

CREATE INDEX users_username_trgm ON public.users USING gin (username public.gin_trgm_ops);


--
-- Name: year_goal_subgoals_goal_idx; Type: INDEX; Schema: public; Owner: bairbadmaev
--

CREATE INDEX year_goal_subgoals_goal_idx ON public.year_goal_subgoals USING btree (goal_id, "position");


--
-- Name: year_goals_user_year_idx; Type: INDEX; Schema: public; Owner: bairbadmaev
--

CREATE INDEX year_goals_user_year_idx ON public.year_goals USING btree (user_id, year);


--
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: discipline_scores discipline_scores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.discipline_scores
    ADD CONSTRAINT discipline_scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: goals500 goals500_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.goals500
    ADD CONSTRAINT goals500_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: habits habits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: planner_items planner_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.planner_items
    ADD CONSTRAINT planner_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: planner planner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.planner
    ADD CONSTRAINT planner_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: progress progress_habit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;


--
-- Name: progress progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reactions reactions_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reactions reactions_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: year_goal_subgoals year_goal_subgoals_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.year_goal_subgoals
    ADD CONSTRAINT year_goal_subgoals_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.year_goals(id) ON DELETE CASCADE;


--
-- Name: year_goals year_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bairbadmaev
--

ALTER TABLE ONLY public.year_goals
    ADD CONSTRAINT year_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict mAaeUzuL9K5qDrmSW9Ap04iQpwcQoRrFCw7v0nG5NbYgxr3oco4aDLtDqIQ8aRN

