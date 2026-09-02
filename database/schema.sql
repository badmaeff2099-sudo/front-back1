-- =====================================================================
--  Chainify — полная схема базы данных в одном файле.
-- =====================================================================
--
--  Что это. Единственный источник правды о структуре БД: 13 таблиц,
--  индексы, ограничения, расширения и справочные данные челленджей.
--  Раньше это лежало россыпью (goals500.sql, planner.sql, discipline.sql,
--  challenges.sql, nickname_search.sql, year_goals.sql), причём схема
--  шести таблиц — users, habits, progress, chat_messages, friendships,
--  reactions — не была описана вообще нигде, кроме дампа backup.sql.
--  Поднять проект с нуля по этим файлам было нельзя.
--
--  Как применять:
--      psql -U bairbadmaev -d chainify -f database/schema.sql
--
--  Файл идемпотентен: его можно запускать сколько угодно раз, и на
--  пустой БД, и на рабочей. Ничего не удаляется, данные не теряются.
--  Отсюда стиль: IF NOT EXISTS у таблиц и индексов, ADD COLUMN IF NOT
--  EXISTS у колонок, добавленных со временем, и DO-блоки у ограничений —
--  CREATE TABLE IF NOT EXISTS не добавит ограничение к уже существующей
--  таблице, а у ALTER TABLE ... ADD CONSTRAINT в PostgreSQL нет формы
--  IF NOT EXISTS.
--
--  В DO-блоках перехватываются ДВА исключения. duplicate_object — когда
--  ограничение с таким именем уже есть. duplicate_table — когда UNIQUE
--  или PRIMARY KEY создаёт индекс, а индекс с таким именем уже занят:
--  PostgreSQL сообщает об этом как о конфликте отношения, и одного
--  duplicate_object здесь не хватает.
--
--  Порядок разделов = порядок зависимостей: users первыми, потом всё,
--  что ссылается на них по FOREIGN KEY.
--
--  Чем это НЕ является: это не бэкап. Пользовательских данных здесь нет
--  (кроме справочника челленджей — это часть приложения, а не данные
--  пользователя). Снимок данных живёт отдельно в backup.sql и делается
--  через pg_dump. Смешивать их нельзя: pg_dump перезаписывает свой файл
--  целиком, и всё написанное руками — вот эти комментарии в том числе —
--  исчезло бы при первом же новом бэкапе.
--
-- =====================================================================


-- ---------------------------------------------------------------------
--  Расширения
-- ---------------------------------------------------------------------

-- pg_trgm нужен для поиска пользователей по части ника (см. users_*_trgm
-- ниже). Требует прав суперпользователя только при первой установке.
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ---------------------------------------------------------------------
--  users — аккаунты
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
    id         serial PRIMARY KEY,
    username   character varying(100) NOT NULL,
    email      character varying(255) NOT NULL,
    password   text NOT NULL,
    -- date, а не timestamp: от даты регистрации считается цикл дисциплины
    -- (shared/lib/cycle.ts), а там нужен день, не момент.
    created_at date DEFAULT CURRENT_TIMESTAMP,
    location   text,
    goal       text,
    full_name  text,
    bio        text,
    daily_actions text,
    avatar_url character varying(500),
    nickname   character varying(50)
);

-- Колонки профиля добавлялись по мере роста приложения — на старой БД
-- их может не быть.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location      text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS goal          text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name     text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio           text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS daily_actions text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url    character varying(500);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS nickname      character varying(50);

DO $$ BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;


-- ---------------------------------------------------------------------
--  habits + progress — отметки дней
-- ---------------------------------------------------------------------
--
--  habits остались от первой версии, где у пользователя было несколько
--  привычек. Сейчас приложение работает с одной целью на пользователя и
--  пишет прямо в progress.user_id, поэтому progress.habit_id nullable.
--

CREATE TABLE IF NOT EXISTS public.habits (
    id         serial PRIMARY KEY,
    user_id    integer REFERENCES public.users (id) ON DELETE CASCADE,
    title      character varying(255) NOT NULL,
    total_days integer DEFAULT 30,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.progress (
    id        serial PRIMARY KEY,
    habit_id  integer REFERENCES public.habits (id) ON DELETE CASCADE,
    day_date  date NOT NULL,
    completed boolean DEFAULT false,
    user_id   integer REFERENCES public.users (id) ON DELETE CASCADE,
    -- 'done' | 'rest': выходной — это осознанная отметка, а не пропуск,
    -- и в цикле он не считается пропущенным днём.
    status    text DEFAULT 'done'
);

ALTER TABLE public.progress ADD COLUMN IF NOT EXISTS user_id integer;
ALTER TABLE public.progress ADD COLUMN IF NOT EXISTS status  text DEFAULT 'done';

-- Один день — одна отметка. Без этого повторный клик создавал бы дубли,
-- и календарь считал бы один день дважды.
DO $$ BEGIN
    ALTER TABLE public.progress ADD CONSTRAINT unique_user_day UNIQUE (user_id, day_date);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.progress ADD CONSTRAINT progress_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;


-- ---------------------------------------------------------------------
--  Социальная часть: friendships, reactions, chat_messages
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.friendships (
    id           serial PRIMARY KEY,
    from_user_id integer NOT NULL,
    to_user_id   integer NOT NULL,
    -- 'pending' | 'accepted' | 'declined'
    status       character varying(20) NOT NULL DEFAULT 'pending',
    created_at   timestamp without time zone DEFAULT now(),
    -- Одна заявка на пару в одном направлении.
    CONSTRAINT friendships_from_user_id_to_user_id_key UNIQUE (from_user_id, to_user_id)
);

DO $$ BEGIN
    ALTER TABLE public.friendships ADD CONSTRAINT friendships_from_user_id_to_user_id_key
        UNIQUE (from_user_id, to_user_id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.reactions (
    id           serial PRIMARY KEY,
    from_user_id integer REFERENCES public.users (id) ON DELETE CASCADE,
    to_user_id   integer REFERENCES public.users (id) ON DELETE CASCADE,
    emoji        character varying(10) NOT NULL,
    created_at   timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id         serial PRIMARY KEY,
    user_id    integer NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    channel    character varying(255) DEFAULT 'general',
    message    text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


-- ---------------------------------------------------------------------
--  discipline_scores — рейтинг дисциплины
-- ---------------------------------------------------------------------
--
--  Пересчитывается приложением, поэтому UNIQUE (user_id): на человека
--  одна строка, обновляемая через ON CONFLICT.
--

CREATE TABLE IF NOT EXISTS public.discipline_scores (
    id             serial PRIMARY KEY,
    user_id        integer NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    completed_days integer NOT NULL DEFAULT 0,
    missed_days    integer NOT NULL DEFAULT 0,
    score          integer NOT NULL DEFAULT 0,
    calculated_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    -- rest_days последней намеренно: в рабочей БД она появилась поздним
    -- ALTER TABLE и стоит в конце. Порядок сохранён, чтобы схема,
    -- поднятая из этого файла, совпадала с рабочей байт в байт и
    -- сверялась обычным diff.
    rest_days      integer NOT NULL DEFAULT 0,
    CONSTRAINT discipline_scores_user_id_key UNIQUE (user_id)
);

ALTER TABLE public.discipline_scores
    ADD COLUMN IF NOT EXISTS rest_days integer NOT NULL DEFAULT 0;

DO $$ BEGIN
    ALTER TABLE public.discipline_scores ADD CONSTRAINT discipline_scores_user_id_key UNIQUE (user_id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

-- Рейтинг всегда читается отсортированным по убыванию очков.
CREATE INDEX IF NOT EXISTS discipline_scores_score_idx
    ON public.discipline_scores (score DESC);


-- ---------------------------------------------------------------------
--  planner + planner_items — «Сегодня / Завтра»
-- ---------------------------------------------------------------------
--
--  planner.last_date — дата, на которую актуален список. При наступлении
--  нового дня приложение видит расхождение и переносит «завтра» в
--  «сегодня». PRIMARY KEY (user_id) — планировщик один на человека.
--

CREATE TABLE IF NOT EXISTS public.planner (
    user_id   integer PRIMARY KEY REFERENCES public.users (id) ON DELETE CASCADE,
    last_date date NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS public.planner_items (
    id       serial PRIMARY KEY,
    user_id  integer NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    day_type character varying(10) NOT NULL,
    position integer NOT NULL DEFAULT 0,
    text     text NOT NULL DEFAULT '',
    CONSTRAINT planner_items_day_type_check CHECK (day_type IN ('today', 'tomorrow'))
);

CREATE INDEX IF NOT EXISTS planner_items_user_idx
    ON public.planner_items (user_id, day_type, position);


-- ---------------------------------------------------------------------
--  goals500 — раздел «Мои 500 целей»
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.goals500 (
    id         serial PRIMARY KEY,
    user_id    integer NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    position   integer NOT NULL DEFAULT 0,
    text       text NOT NULL DEFAULT '',
    done       boolean NOT NULL DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Список читается целиком и в исходном порядке.
CREATE INDEX IF NOT EXISTS goals500_user_id_idx
    ON public.goals500 (user_id, position);


-- ---------------------------------------------------------------------
--  year_goals + year_goal_subgoals — раздел «Мои цели на год»
-- ---------------------------------------------------------------------
--
--  year_goals         — карточка одного месяца: главная цель месяца.
--  year_goal_subgoals — миниподцели внутри карточки, порядок в position.
--
--  Одна карточка на (пользователь, год, месяц) — это гарантирует
--  UNIQUE-ключ, поэтому сохранение идёт через ON CONFLICT, а не
--  «проверил и вставил» (второй вариант ловит гонку при быстрых правках
--  одной карточки).
--
--  Пустые карточки не хранятся: как только и цель, и все подцели стали
--  пустыми, строка удаляется (api/yeargoals/save.php). Иначе один заход
--  в раздел создавал бы 12 пустых строк на каждый просмотренный год.
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

DO $$ BEGIN
    ALTER TABLE public.year_goals ADD CONSTRAINT year_goals_user_year_month_key
        UNIQUE (user_id, year, month);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

-- Загрузка идёт всегда за один год целиком.
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


-- ---------------------------------------------------------------------
--  Поиск пользователей по имени и нику
-- ---------------------------------------------------------------------
--
--  Нормализация ДО создания уникального индекса — иначе индекс не
--  построится на существующих данных с пустыми строками и пробелами.
--  Раньше уникальность ника проверялась только в PHP, а попытка завести
--  ограничение в api/users/list.php была написана как ALTER TABLE ... ADD
--  CONSTRAINT IF NOT EXISTS — такого синтаксиса в PostgreSQL нет, ошибка
--  молча гасилась пустым catch, и ограничения не появлялось.
--

-- Пустой ник — это «ника нет», то есть NULL: иначе двое без ника
-- конфликтовали бы по уникальному индексу.
UPDATE public.users SET nickname = NULL
 WHERE nickname IS NOT NULL AND btrim(nickname) = '';

UPDATE public.users SET nickname = btrim(nickname)
 WHERE nickname IS NOT NULL AND nickname <> btrim(nickname);

-- lower(): «Ivan» и «ivan» — один и тот же ник.
CREATE UNIQUE INDEX IF NOT EXISTS users_nickname_lower_unique
    ON public.users (lower(nickname));

-- text_pattern_ops — для поиска по началу строки (LIKE 'ник%').
CREATE INDEX IF NOT EXISTS users_username_lower_prefix
    ON public.users (lower(username) text_pattern_ops);

CREATE INDEX IF NOT EXISTS users_nickname_lower_prefix
    ON public.users (lower(nickname) text_pattern_ops);

-- Триграммы — для поиска по подстроке в середине (LIKE '%ван%'),
-- который префиксный индекс не покрывает.
CREATE INDEX IF NOT EXISTS users_username_trgm
    ON public.users USING gin (username public.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS users_nickname_trgm
    ON public.users USING gin (nickname public.gin_trgm_ops);


-- ---------------------------------------------------------------------
--  challenges — справочник ежедневных челленджей
-- ---------------------------------------------------------------------
--
--  Это не пользовательские данные, а часть приложения, поэтому список
--  живёт здесь, а не в бэкапе. Уникальность по title позволяет
--  перезапускать файл: описания обновятся, новые челленджи добавятся,
--  дублей не будет.
--

CREATE TABLE IF NOT EXISTS public.challenges (
    id          serial PRIMARY KEY,
    title       character varying(255) NOT NULL,
    description text NOT NULL DEFAULT '',
    active      boolean NOT NULL DEFAULT true,
    created_at  timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Уникальность именно индексом, а не ограничением: ON CONFLICT ниже
-- ссылается на колонку title, и индекса для этого достаточно.
CREATE UNIQUE INDEX IF NOT EXISTS challenges_title_key ON public.challenges (title);

-- Выборка челленджа дня идёт только среди активных.
CREATE INDEX IF NOT EXISTS challenges_active_idx ON public.challenges (active);

INSERT INTO public.challenges (title, description) VALUES
    ('День без сладкого', 'Не ешь сегодня сладости, шоколад и десерты.'),
    ('3 часа без телефона', 'Не используй телефон в течение трёх часов.'),
    ('30 минут чтения', 'Прочитай книгу минимум 30 минут.'),
    ('10 000 шагов', 'Пройди сегодня минимум 10 000 шагов.'),
    ('Холодный душ', 'Заверши обычный душ холодной водой.'),
    ('Убери рабочее место', 'Полностью наведи порядок на своём рабочем столе.'),
    ('Встань сразу', 'Сегодня не нажимай кнопку «Отложить» после будильника.'),
    ('20 отжиманий', 'Выполни 20 отжиманий за день.'),
    ('Без соцсетей', 'Проведи минимум 4 часа без социальных сетей.'),
    ('Утренний стакан воды', 'Выпей теплый стакан воды сразу после пробуждения.'),
    ('20 минут прогулки', 'Проведи минимум 20 минут на свежем воздухе.'),
    ('Заправь кровать', 'Сразу после пробуждения заправь свою кровать.'),
    ('Один час тишины', 'Проведи один час без музыки, видео и развлечений.'),
    ('Самая сложная задача', 'Выполни сегодня самую неприятную задачу первой.'),
    ('50 приседаний', 'Сделай 50 приседаний в течение дня.'),
    ('15 минут медитации', 'Проведи 15 минут в тишине, сосредоточившись на дыхании.'),
    ('Выключи уведомления', 'Отключи ненужные уведомления на весь день.'),
    ('1 час обучения', 'Потрать минимум час на изучение полезного навыка.'),
    ('Без лишних покупок', 'Сегодня не покупай ничего, кроме действительно необходимого.'),
    ('Разбери шкаф', 'Наведи порядок хотя бы в одном отделе шкафа.'),
    ('30 минут спорта', 'Посвяти минимум 30 минут физической активности.'),
    ('Не жалуйся', 'Проведи весь день без жалоб и нытья.'),
    ('10 минут планирования', 'Утром составь план своих главных задач на день.'),
    ('Закончи начатое', 'Заверши одну задачу, которую давно откладываешь.'),
    ('Без YouTube', 'Не открывай YouTube в течение всего дня.'),
    ('Без коротких видео', 'Не смотри TikTok, Reels или Shorts сегодня.'),
    ('20 минут уборки', 'Потрать 20 минут на уборку дома или комнаты.'),
    ('Ранний сон', 'Ляг спать минимум на 30 минут раньше обычного.'),
    ('10 минут растяжки', 'Выполни 10 минут лёгкой растяжки.'),
    ('5 новых иностранных слов', 'Выучи всего 5 иностранных слов и используй их в течении дня.'),
    ('Запиши 3 цели', 'Запиши три цели, которых хочешь достичь в ближайшее время.'),
    ('Без телефона за едой', 'Не используй телефон во время приёмов пищи сегодня.'),
    ('Чистая почта', 'Удали ненужные письма из электронной почты.'),
    ('Разбери файлы', 'Удали ненужные файлы и наведи порядок в одной папке.'),
    ('30 минут без экрана', 'Проведи 30 минут перед сном без телефона и компьютера.'),
    ('Сделай то, чего боишься', 'Выполни небольшое действие, которое давно откладываешь из-за страха.'),
    ('Позвони близкому', 'Позвони человеку, с которым давно не разговаривал.'),
    ('Поблагодари человека', 'Поблагодари человека за что-то.'),
    ('Сделай добро', 'Сделай одно бескорыстное доброе дело.'),
    ('Не опаздывай', 'Сегодня приходи на все встречи и дела вовремя.'),
    ('100 приседаний', 'Выполни 100 приседаний в течение дня.'),
    ('30 отжиманий', 'Выполни 30 отжиманий за день.'),
    ('План без отвлечений', 'Выполни одну задачу, не отвлекаясь на телефон.'),
    ('45 минут фокуса', 'Работай или учись 45 минут без отвлечений.'),
    ('Без телефона утром', 'Не бери телефон первые 30 минут после пробуждения.'),
    ('Утренняя прогулка', 'Выйди на прогулку в первой половине дня.'),
    ('Вечерняя прогулка', 'Соверши 20-минутную прогулку вечером.'),
    ('Без газировки', 'Не пей сегодня сладкие газированные напитки.'),
    ('Фрукты вместо сладкого', 'Если захочется сладкого, выбери вместо него фрукт.'),
    ('Чистая комната', 'Перед сном оставь комнату убранной.'),
    ('Разбери фотографии', 'Удали 30 ненужных фотографий с телефона.'),
    ('Освободи память телефона', 'Удали 3 ненужные приложения.'),
    ('Без наушников', 'Проведи хотя бы час без музыки, подкастов и видео.'),
    ('20 минут обучения', 'Узнай что-то новое по интересующей тебя теме.'),
    ('Запиши мысли', 'Вечером запиши несколько мыслей о прошедшем дне.'),
    ('Определи приоритет', 'Выбери одну главную задачу и обязательно выполни её.'),
    ('Не откладывай', 'Выполни небольшую задачу сразу, не откладывая её.'),
    ('Один час продуктивности', 'Проведи один час исключительно полезной деятельностью.'),
    ('Без многозадачности', 'Сегодня выполняй задачи только по одной.'),
    ('Наведи порядок в телефоне', 'Удали минимум 10 ненужных файлов или фотографий.'),
    ('Изучи 3 новых фактов', 'Узнай три новых факта по интересующей тебя теме.'),
    ('Напиши визуализацию', 'Напиши на пол страницы от руки твою жизнь через 6 месяцев.'),
    ('Прочитай статью', 'Прочитай одну полезную статью полностью.'),
    ('Образовательное видео', 'Посмотри одно образовательное видео вместо развлекательного контента.'),
    ('Без спешки', 'Сегодня сознательно выполняй привычные действия медленнее и внимательнее.'),
    ('Не спорь', 'Не вступай сегодня в бессмысленные споры.'),
    ('Слушай внимательно', 'В одном разговоре сегодня не перебивай собеседника.'),
    ('Сделай комплимент', 'Сделай искренний комплимент одному человеку.'),
    ('Помоги человеку', 'Предложи кому-нибудь помощь без просьбы с его стороны.'),
    ('День без негатива', 'Не смотри и не отправляй негативный контент.'),
    ('Проверь расходы', 'Запиши все свои расходы за сегодняшний день.'),
    ('Без импульсивных покупок', 'Не покупай ничего под влиянием сиюминутного желания.'),
    ('Отложи деньги', 'Отложи небольшую сумму денег в накопления.'),
    ('Составь бюджет', 'Запиши план своих расходов на ближайшую неделю.'),
    ('7 минут иностранного языка', 'Позанимайся иностранным языком минимум 7 минут.'),
    ('Без прокрастинации', 'Как только заметишь, что откладываешь задачу, сразу начни её выполнять.'),
    ('Сделай больше нормы', 'Выполни привычную задачу немного лучше или больше, чем обычно.'),
    ('60 минут без развлечений', 'Проведи один час без игр, сериалов и социальных сетей.'),
    ('Час без телефона перед сном', 'Не используй телефон за час до сна.'),
    ('Утро без соцсетей', 'Не открывай социальные сети в течение первого часа после пробуждения.'),
    ('Вечер без соцсетей', 'Не заходи в социальные сети после 20:00.'),
    ('Сделай то, что откладывал', 'Выбери одну давно отложенную задачу и наконец выполни её.'),
    ('5 минут порядка', 'Перед сном потрать 5 минут на наведение порядка.'),
    ('Новый маршрут', 'Пройдись сегодня новым маршрутом, которым раньше не ходил.'),
    ('Преврати жалобу в действие', 'Каждый раз, когда хочется пожаловаться, замени жалобу конкретным действием.'),
    ('20 минут творчества', 'Посвяти 20 минут рисованию, музыке, письму или другому творчеству.'),
    ('Узнай что-то о себе', 'Запиши одну свою сильную сторону и одну сторону, которую хочешь улучшить.'),
    ('Сначала дела, потом развлечения', 'Не начинай развлечения, пока не выполнишь главную задачу дня.'),
    ('Рабочий стол компьютера', 'Удали всё лишнее с рабочего стола компьютера и организуй файлы.'),
    ('Один час концентрации', 'Работай над одной задачей один час без переключения на другие дела.'),
    ('Шаг к большой цели', 'Выполни сегодня одно конкретное действие, которое приблизит тебя к важной цели.')
ON CONFLICT (title) DO UPDATE
    SET description = EXCLUDED.description;


-- =====================================================================
--  Конец схемы.
--
--  Проверка после применения — должно быть 13 таблиц:
--      SELECT count(*) FROM pg_tables WHERE schemaname = 'public';
-- =====================================================================
