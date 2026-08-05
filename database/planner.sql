--
-- Планнер пользователя (раздел "Мой планнер" в кабинете).
-- planner        — мета-данные: дата последней ротации списков.
-- planner_items  — строки списков "сегодня" / "завтра".
--
-- Логика ротации: в новый день планы "завтра" становятся планами
-- "сегодня", а "завтра" очищается (выполняется на бэкенде при загрузке).
--

CREATE TABLE IF NOT EXISTS public.planner (
    user_id   integer PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
    last_date date NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.planner_items (
    id       serial PRIMARY KEY,
    user_id  integer NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    day_type varchar(10) NOT NULL CHECK (day_type IN ('today', 'tomorrow')),
    position integer NOT NULL DEFAULT 0,
    text     text NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS planner_items_user_idx
    ON public.planner_items (user_id, day_type, position);
