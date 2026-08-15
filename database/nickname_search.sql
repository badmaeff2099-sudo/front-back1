-- Поиск друзей по никнейму: нормализация данных и индексы.
--
-- Зачем: в users.nickname уникальность держалась только проверкой в PHP
-- (api/users/update.php), а ALTER TABLE ... ADD CONSTRAINT IF NOT EXISTS
-- в api/users/list.php молча падал — такого синтаксиса в PostgreSQL нет,
-- исключение проглатывалось пустым catch. Реальной защиты в БД не было.

-- 1. Пустые строки -> NULL.
--    В UNIQUE-индексе NULL-ы друг с другом не конфликтуют, а вот несколько
--    пустых строк — конфликтуют. Без этого шага индекс ниже не создастся,
--    как только два пользователя сохранят пустой никнейм.
UPDATE users SET nickname = NULL WHERE btrim(nickname) = '';

-- 2. Пробелы по краям — иначе 'ivan' и 'ivan ' считались бы разными.
UPDATE users SET nickname = btrim(nickname) WHERE nickname <> btrim(nickname);

-- 3. Уникальность без учёта регистра: 'Ivan' и 'ivan' — один и тот же никнейм.
CREATE UNIQUE INDEX IF NOT EXISTS users_nickname_lower_unique
    ON users (lower(nickname));

-- 4. Индексы под поиск.
--    Поиск идёт по началу строки: ILIKE 'q%'. Обычный btree тут не помогает,
--    потому что сравнение регистронезависимое, — нужен индекс по lower(...)
--    с text_pattern_ops, он умеет обслуживать префиксные LIKE-запросы.
CREATE INDEX IF NOT EXISTS users_username_lower_prefix
    ON users (lower(username) text_pattern_ops);

CREATE INDEX IF NOT EXISTS users_nickname_lower_prefix
    ON users (lower(nickname) text_pattern_ops);

-- 5. Триграммные индексы — на случай возврата к поиску по подстроке
--    (ILIKE '%q%'), где префиксный btree бесполезен.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS users_username_trgm
    ON users USING gin (username gin_trgm_ops);

CREATE INDEX IF NOT EXISTS users_nickname_trgm
    ON users USING gin (nickname gin_trgm_ops);
