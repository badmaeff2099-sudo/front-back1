--
-- PostgreSQL database dump
--

\restrict CopevxfGTVQde95lDo6X5CK1Hnwo2XOgc1DTNQI1cnH319cxLGXWFJpjmrBqC6W

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

SET default_tablespace = '';

SET default_table_access_method = heap;

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
1	6	17	78	10	2026-08-11 15:56:43.872149	1
6	7	11	83	0	2026-08-11 15:55:35.536425	0
7	8	7	87	0	2026-08-11 15:55:35.537439	0
8	9	3	89	0	2026-08-11 15:55:35.538389	1
9	10	2	87	0	2026-08-11 15:55:35.53932	1
10	11	6	84	0	2026-08-11 15:55:35.540198	0
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
8	18	6	accepted	2026-06-14 01:29:06.007428
11	21	6	accepted	2026-06-14 03:46:26.862617
10	21	18	accepted	2026-06-14 03:46:21.597917
12	21	7	accepted	2026-06-14 03:46:30.633433
13	8	22	accepted	2026-06-16 11:46:07.643025
14	22	11	pending	2026-06-16 11:48:11.315472
\.


--
-- Data for Name: goals500; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.goals500 (id, user_id, "position", text, done, created_at) FROM stdin;
43	6	0	Бег	f	2026-08-05 21:14:04.297925
44	6	1		f	2026-08-05 21:14:04.297925
45	6	2		f	2026-08-05 21:14:04.297925
46	6	3		f	2026-08-05 21:14:04.297925
47	6	4		f	2026-08-05 21:14:04.297925
48	6	5		f	2026-08-05 21:14:04.297925
49	6	6		f	2026-08-05 21:14:04.297925
50	6	7		f	2026-08-05 21:14:04.297925
51	6	8		f	2026-08-05 21:14:04.297925
52	6	9		f	2026-08-05 21:14:04.297925
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
6	2026-08-11
\.


--
-- Data for Name: planner_items; Type: TABLE DATA; Schema: public; Owner: bairbadmaev
--

COPY public.planner_items (id, user_id, day_type, "position", text) FROM stdin;
56	6	today	0	
57	6	today	1	
58	6	today	2	
59	6	today	3	
60	6	today	4	
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
10	Boris	boris@gmail.com	$2y$12$7YatqQJiOC02THXESLGWu.o6wF.YD0/0h88E6Y4J3A7t7U9BgBIQq	2026-05-13	Улан-Удэ	Мед	\N	\N	\N	\N	\N
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
6	Max	max@gmail.com	$2y$12$kEO.RBZM.Ikp959E4V5d2utjCyO5gGxsT6bBsWjzc/hHteaRyP7n.	2026-05-08	Улан-Батор	Английский				\N	m
\.


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 2, true);


--
-- Name: discipline_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.discipline_scores_id_seq', 420, true);


--
-- Name: friendships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.friendships_id_seq', 14, true);


--
-- Name: goals500_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.goals500_id_seq', 52, true);


--
-- Name: habits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.habits_id_seq', 1, true);


--
-- Name: planner_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.planner_items_id_seq', 60, true);


--
-- Name: progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.progress_id_seq', 83, true);


--
-- Name: reactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.reactions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bairbadmaev
--

SELECT pg_catalog.setval('public.users_id_seq', 26, true);


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
-- PostgreSQL database dump complete
--

\unrestrict CopevxfGTVQde95lDo6X5CK1Hnwo2XOgc1DTNQI1cnH319cxLGXWFJpjmrBqC6W

