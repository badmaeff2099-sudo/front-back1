<?php

/**
 * Расчёт текущего стрика.
 *
 * Правила:
 *  - done-день   → стрик +1.
 *  - rest-день   → нейтрален: стрик не растёт и не падает.
 *  - два rest подряд → стрик обнуляется.
 *  - пустой день → серия прерывается.
 *  - Серия жива только если сегодня или вчера есть отметка.
 *
 * @param array $completedDates  даты со статусом "done"  (YYYY-MM-DD)
 * @param array $restDates       даты со статусом "rest"  (YYYY-MM-DD)
 * @return int
 */
function calcStreak(array $completedDates, array $restDates): int
{
    $today     = (new DateTime())->format('Y-m-d');
    $yesterday = (new DateTime('yesterday'))->format('Y-m-d');

    $restSet = array_flip($restDates);
    $doneSet = array_flip($completedDates);

    $todayMarked     = isset($doneSet[$today])     || isset($restSet[$today]);
    $yesterdayMarked = isset($doneSet[$yesterday]) || isset($restSet[$yesterday]);

    if (!$todayMarked && !$yesterdayMarked) return 0;

    // Если сегодня ещё не отмечено — начинаем со вчера
    $cursor      = new DateTime($todayMarked ? $today : $yesterday);
    $streak      = 0;
    $prevWasRest = false;

    while (true) {
        $cursorStr = $cursor->format('Y-m-d');

        if (isset($doneSet[$cursorStr])) {
            $streak++;
            $prevWasRest = false;
        } elseif (isset($restSet[$cursorStr])) {
            if ($prevWasRest) return 0;  // два rest подряд — обнуляем
            $prevWasRest = true;
        } else {
            break;  // пустой день — конец серии
        }

        $cursor->modify('-1 day');
    }

    return $streak;
}
