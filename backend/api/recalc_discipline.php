<?php

/**
 * Разовый пересчёт Discipline Score для всех пользователей.
 *
 * Нужен после смены логики: балл больше не опускается ниже 0,
 * а хранимые в discipline_scores значения пересчитываются лениво —
 * только при обращении к progress/get.php. Скрипт приводит таблицу
 * в актуальное состояние сразу для всех.
 *
 * Запуск:  php backend/api/recalc_discipline.php
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("CLI only\n");
}

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/discipline_helper.php';

$pdo = getPDO();

$users = $pdo->query("SELECT id, created_at FROM users ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);

$progressStmt = $pdo->prepare("
    SELECT day_date, status
    FROM progress
    WHERE user_id = :user_id
    ORDER BY day_date ASC
");

$changed = 0;

foreach ($users as $user) {
    $userId = (int)$user['id'];

    $progressStmt->execute([':user_id' => $userId]);
    $rows = $progressStmt->fetchAll(PDO::FETCH_ASSOC);

    $completed = [];
    $rest      = [];

    foreach ($rows as $row) {
        if ($row['status'] === 'rest') {
            $rest[] = $row['day_date'];
        } else {
            $completed[] = $row['day_date'];
        }
    }

    $before = $pdo->prepare("SELECT score FROM discipline_scores WHERE user_id = :user_id");
    $before->execute([':user_id' => $userId]);
    $oldScore = $before->fetchColumn();

    $result = calcDisciplineScore($completed, $rest, $user['created_at'] ?: null);
    saveDisciplineScore($pdo, $userId, $result);

    $old = $oldScore === false ? '—' : $oldScore;
    if ((string)$old !== (string)$result['score']) $changed++;

    printf(
        "user %-4d  score %6s -> %-4d  (done %d, missed %d, rest %d)\n",
        $userId,
        $old,
        $result['score'],
        $result['completed_days'],
        $result['missed_days'],
        $result['rest_days']
    );
}

printf("\nОбработано пользователей: %d, изменено: %d\n", count($users), $changed);
