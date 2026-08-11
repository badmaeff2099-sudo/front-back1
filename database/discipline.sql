-- Discipline Score
--
-- Формула: score = (выполненные дни × 3) − (пропущенные дни × 1)
--
-- Выходной — только день, который пользователь сам отметил как 'rest'.
-- Такие дни нейтральны: 0 баллов. День недели роли не играет.
--
-- Пропущенный день — день между датой регистрации пользователя
-- и вчерашним днём, для которого нет записи в progress.

CREATE TABLE IF NOT EXISTS public.discipline_scores (
    id             integer NOT NULL,
    user_id        integer NOT NULL,
    completed_days integer NOT NULL DEFAULT 0,
    missed_days    integer NOT NULL DEFAULT 0,
    rest_days      integer NOT NULL DEFAULT 0,
    score          integer NOT NULL DEFAULT 0,
    calculated_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.discipline_scores OWNER TO bairbadmaev;

ALTER TABLE public.discipline_scores
    ADD COLUMN IF NOT EXISTS rest_days integer NOT NULL DEFAULT 0;

CREATE SEQUENCE IF NOT EXISTS public.discipline_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.discipline_scores_id_seq OWNER TO bairbadmaev;
ALTER SEQUENCE public.discipline_scores_id_seq OWNED BY public.discipline_scores.id;

ALTER TABLE ONLY public.discipline_scores
    ALTER COLUMN id SET DEFAULT nextval('public.discipline_scores_id_seq'::regclass);

DO $$
BEGIN
    ALTER TABLE ONLY public.discipline_scores
        ADD CONSTRAINT discipline_scores_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_table OR invalid_table_definition THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE ONLY public.discipline_scores
        ADD CONSTRAINT discipline_scores_user_id_key UNIQUE (user_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE ONLY public.discipline_scores
        ADD CONSTRAINT discipline_scores_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS discipline_scores_score_idx
    ON public.discipline_scores (score DESC);
