--
-- Раздел "Мои цели на год" в кабинете.
--
-- year_goals          — карточка одного месяца: главная цель месяца.
-- year_goal_subgoals  — миниподцели внутри карточки, порядок задаёт position.
--
-- Одна карточка на (пользователь, год, месяц) — это гарантирует UNIQUE-ключ,
-- поэтому сохранение делается через ON CONFLICT, а не "проверил и вставил"
-- (второй вариант ловит гонку при быстрых правках одной карточки).
--
-- Пустые карточки в таблице не хранятся: как только и цель, и все подцели
-- стали пустыми, строка удаляется (см. api/yeargoals/save.php). Иначе один
-- заход в раздел создавал бы 12 пустых строк на каждый просмотренный год.
--

CREATE TABLE IF NOT EXISTS public.year_goals (
    id         serial PRIMARY KEY,
    user_id    integer  NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    year       smallint NOT NULL,
    month      smallint NOT NULL CHECK (month BETWEEN 1 AND 12),
    goal       text     NOT NULL DEFAULT '',
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT year_goals_user_year_month_key UNIQUE (user_id, year, month)
);

-- Загрузка идёт всегда за один год целиком, поэтому индекс по (user_id, year).
CREATE INDEX IF NOT EXISTS year_goals_user_year_idx
    ON public.year_goals (user_id, year);

CREATE TABLE IF NOT EXISTS public.year_goal_subgoals (
    id       serial  PRIMARY KEY,
    -- ON DELETE CASCADE: подцели живут только вместе со своей карточкой,
    -- поэтому очистка карточки не оставляет сирот.
    goal_id  integer NOT NULL REFERENCES public.year_goals (id) ON DELETE CASCADE,
    position integer NOT NULL DEFAULT 0,
    text     text    NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS year_goal_subgoals_goal_idx
    ON public.year_goal_subgoals (goal_id, position);
