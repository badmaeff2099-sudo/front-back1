--
-- Таблица "Мои 500 целей"
-- Хранит цели пользователя из раздела "Мой кабинет".
-- Каждая строка — одна цель; порядок определяется полем position.
--

CREATE TABLE IF NOT EXISTS public.goals500 (
    id         serial PRIMARY KEY,
    user_id    integer NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    position   integer NOT NULL DEFAULT 0,
    text       text    NOT NULL DEFAULT '',
    done       boolean NOT NULL DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS goals500_user_id_idx
    ON public.goals500 (user_id, position);
