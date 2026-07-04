--
-- PostgreSQL database dump
--

\restrict hryBMup6V20TyaFM33FsGntfBMrY10rJKc1GN1lHuvTCyor1oV5oYSEly1avaGt

-- Dumped from database version 14.22 (Ubuntu 14.22-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.22 (Ubuntu 14.22-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    user_id integer NOT NULL,
    channel character varying(255) DEFAULT 'general'::character varying,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chat_messages_id_seq OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: habits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.habits (
    id integer NOT NULL,
    user_id integer,
    title character varying(255) NOT NULL,
    total_days integer DEFAULT 30,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.habits OWNER TO postgres;

--
-- Name: habits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.habits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.habits_id_seq OWNER TO postgres;

--
-- Name: habits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.habits_id_seq OWNED BY public.habits.id;


--
-- Name: progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.progress (
    id integer NOT NULL,
    habit_id integer,
    day_date date NOT NULL,
    completed boolean DEFAULT false,
    user_id integer,
    status text DEFAULT 'done'::text
);


ALTER TABLE public.progress OWNER TO postgres;

--
-- Name: progress_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.progress_id_seq OWNER TO postgres;

--
-- Name: progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.progress_id_seq OWNED BY public.progress.id;


--
-- Name: reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reactions (
    id integer NOT NULL,
    from_user_id integer,
    to_user_id integer,
    emoji character varying(10) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reactions OWNER TO postgres;

--
-- Name: reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reactions_id_seq OWNER TO postgres;

--
-- Name: reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reactions_id_seq OWNED BY public.reactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
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
    daily_actions text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: habits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habits ALTER COLUMN id SET DEFAULT nextval('public.habits_id_seq'::regclass);


--
-- Name: progress id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress ALTER COLUMN id SET DEFAULT nextval('public.progress_id_seq'::regclass);


--
-- Name: reactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reactions ALTER COLUMN id SET DEFAULT nextval('public.reactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, user_id, channel, message, created_at) FROM stdin;
1	11	Ivan	прапр	2026-05-13 11:49:20.564643
2	6	Max	уеуке	2026-05-13 11:49:59.16963
\.


--
-- Data for Name: habits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.habits (id, user_id, title, total_days, created_at) FROM stdin;
\.


--
-- Data for Name: progress; Type: TABLE DATA; Schema: public; Owner: postgres
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
\.


--
-- Data for Name: reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reactions (id, from_user_id, to_user_id, emoji, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password, created_at, location, goal, full_name, bio, daily_actions) FROM stdin;
8	Alex	alex@gmail.com	$2y$12$y5Kz45Vy60RuPI1AW8YjXOmQgcaltaP08shLNHCn.v688hU0KUATq	2026-05-10	Улан	Ход	Alexander	Runner	Running every day
9	Anna	anna@gmail.com	$2y$12$ZygBNpELxHsM30QIoHqEgu/lEg472DnnE8C5mh.YZ7yc9.Ry9Y7Oy	2026-05-10		Бег	\N	\N	\N
12	Maria	maria@gmail.com	$2y$12$TuxfgvG4wB8Y9uo/V0fr2eRRgK2ovu/JnpR9/pOAm8afDsmusBsIa	2026-05-13			\N	\N	\N
11	Ivan	ivan@gmail.com	$2y$12$wuSDLuovEEE/zBVFkxdpmOEJHgieoYGpOKFDe63rv4T/rnj1BM0lm	2026-05-13	Москва	Бег	\N	\N	\N
13	Bator	bator@gmail.com	$2y$12$AYdg4HF36pBDamPKiGHsqeV8oJWfvUZfbzJ.rbVfWmvWrOFAa9pHq	2026-05-14			\N	\N	\N
14	Irina	irina@gmail.com	$2y$12$XS10eDj/nXMoSsNTIAhMrO66xObOqKXy.9eZDc19h0a8NKzpayRty	2026-05-14	Москва	Бег	\N	\N	\N
6	Max	max@gmail.com	$2y$12$kEO.RBZM.Ikp959E4V5d2utjCyO5gGxsT6bBsWjzc/hHteaRyP7n.	2026-05-08	Улан-Батор	Английский			
15	Erdem	erdem@gmail.com	$2y$12$JHcqu6Rc7OaHA1TTHaogCuWOqu.DVHm43I1T6EOIzKtGmuIt9nIV2	2026-05-14	Улан-Удэ	Ходьба	\N	\N	\N
7	Anton	anton@gmail.com	$2y$12$MLqm2ZxDjUmtL2FA47uh9uxdW7mDjd/vZ5SbAmQkMSFypFleAgckq	2026-05-10	Москва	Медитация	\N	\N	\N
10	Boris	boris@gmail.com	$2y$12$7YatqQJiOC02THXESLGWu.o6wF.YD0/0h88E6Y4J3A7t7U9BgBIQq	2026-05-13	Улан-Удэ	Мед	\N	\N	\N
16	Mila	mila@gmail.com	$2y$12$UjdpjYkkgEH2vF2lSrN62OAiuuXOn6pz1G9YmVne/9K2OP7Wt8eJC	2026-05-16			\N	\N	\N
\.


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 2, true);


--
-- Name: habits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.habits_id_seq', 1, true);


--
-- Name: progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.progress_id_seq', 27, true);


--
-- Name: reactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reactions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 16, true);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: habits habits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_pkey PRIMARY KEY (id);


--
-- Name: progress progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_pkey PRIMARY KEY (id);


--
-- Name: reactions reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_pkey PRIMARY KEY (id);


--
-- Name: progress unique_user_day; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT unique_user_day UNIQUE (user_id, day_date);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: habits habits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: progress progress_habit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;


--
-- Name: progress progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reactions reactions_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reactions reactions_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict hryBMup6V20TyaFM33FsGntfBMrY10rJKc1GN1lHuvTCyor1oV5oYSEly1avaGt

