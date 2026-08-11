<?php

/**
 * Расчёт Discipline Score.
 *
 * Формула:
 *   score идёт по дням: +3 за выполненный, −1 за пропущенный, 0 за отмеченный 'rest'.
 *
 * Правила:
 *  - Выполненный день — день со статусом 'done': +3 балла.
 *  - Пропущенный день — день без отметки в диапазоне [дата старта; вчера]: −1 балл.
 *  - Выходной — только день, который пользователь сам отметил как 'rest'.
 *    Такие дни нейтральны: 0 баллов. День недели роли не играет.
 *  - Сегодня не считается пропущенным — день ещё не закончился.
 *  - Балл не опускается ниже 0: накопительный итог клампится на каждом дне,
 *    поэтому на нуле штраф за пропуск просто не применяется.
 *
 * Зеркало frontend/src/shared/lib/discipline.ts — правки нужно вносить в оба файла.
 */

const DISCIPLINE_POINTS_DONE   = 3;
const DISCIPLINE_POINTS_MISSED = -1;
const DISCIPLINE_SCORE_MIN     = 0;

/**
 * Разворачивает историю по дням — от даты старта до вчера включительно.
 *
 * @return array<int, array{date:string, status:string, delta:int, score:int}>
 */
function buildDisciplineHistory(array $completedDates, array $restDates, ?string $startDate = null): array
{
    $norm = static fn(string $d): string => substr($d, 0, 10);

    $doneSet = [];
    foreach ($completedDates as $d) {
        if ($d) $doneSet[$norm($d)] = true;
    }

    $restSet = [];
    foreach ($restDates as $d) {
        if ($d) $restSet[$norm($d)] = true;
    }

    $all = array_keys($doneSet + $restSet);
    sort($all);

    // Старт — дата регистрации, но если отметки есть раньше неё
    // (импорт, правка даты), берём самую раннюю отметку,
    // иначе часть выполненных дней потерялась бы.
    $firstMark = $all[0] ?? null;
    $start = $startDate ? $norm($startDate) : $firstMark;
    if ($start === null) return [];
    if ($firstMark !== null && $firstMark < $start) $start = $firstMark;

    // Сегодня ещё не закончилось — штрафовать за него рано.
    // Но если день уже отмечен, показываем его на графике.
    $today = (new DateTime())->format('Y-m-d');
    $end = (isset($doneSet[$today]) || isset($restSet[$today]))
        ? $today
        : (new DateTime('yesterday'))->format('Y-m-d');

    if ($start > $end) return [];

    $points = [];
    $score  = 0;
    $cursor = new DateTime($start);
    $endDt  = new DateTime($end);

    while ($cursor <= $endDt) {
        $iso = $cursor->format('Y-m-d');

        if (isset($doneSet[$iso])) {
            $status   = 'done';
            $rawDelta = DISCIPLINE_POINTS_DONE;
        } elseif (isset($restSet[$iso])) {
            $status   = 'rest';
            $rawDelta = 0;
        } else {
            $status   = 'missed';
            $rawDelta = DISCIPLINE_POINTS_MISSED;
        }

        // Балл не уходит в минус: на 0 штраф за пропуск просто не применяется.
        $next  = max(DISCIPLINE_SCORE_MIN, $score + $rawDelta);
        $delta = $next - $score;
        $score = $next;
        $points[] = ['date' => $iso, 'status' => $status, 'delta' => $delta, 'score' => $score];

        $cursor->modify('+1 day');
    }

    return $points;
}

/**
 * @return array{completed_days:int, missed_days:int, rest_days:int, earned_points:int, penalty_points:int, score:int}
 */
function calcDisciplineScore(array $completedDates, array $restDates, ?string $startDate = null): array
{
    $history = buildDisciplineHistory($completedDates, $restDates, $startDate);

    $completed = 0;
    $missed    = 0;
    $rest      = 0;
    $earned    = 0;
    $penalty   = 0;

    foreach ($history as $p) {
        if ($p['status'] === 'done') {
            $completed++;
            $earned += $p['delta'];
        } elseif ($p['status'] === 'missed') {
            $missed++;
            $penalty += $p['delta'];
        } else {
            $rest++;
        }
    }

    return [
        'completed_days'  => $completed,
        'missed_days'     => $missed,
        'rest_days'       => $rest,
        'earned_points'   => $earned,
        'penalty_points'  => $penalty,
        // Итог — накопительный балл последнего дня, он уже с нижней границей 0.
        'score'           => $history ? $history[count($history) - 1]['score'] : 0,
    ];
}

/**
 * Пересчитывает и сохраняет Discipline Score в таблицу discipline_scores.
 */
function saveDisciplineScore(PDO $pdo, int $userId, array $result): void
{
    $stmt = $pdo->prepare("
        INSERT INTO discipline_scores (user_id, completed_days, missed_days, rest_days, score, calculated_at)
        VALUES (:user_id, :completed, :missed, :rest, :score, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET
            completed_days = EXCLUDED.completed_days,
            missed_days    = EXCLUDED.missed_days,
            rest_days      = EXCLUDED.rest_days,
            score          = EXCLUDED.score,
            calculated_at  = CURRENT_TIMESTAMP
    ");

    $stmt->execute([
        ':user_id'   => $userId,
        ':completed' => $result['completed_days'],
        ':missed'    => $result['missed_days'],
        ':rest'      => $result['rest_days'],
        ':score'     => $result['score'],
    ]);
}
