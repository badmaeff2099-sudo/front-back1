<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once '../../db.php';

$pdo = getPDO();

$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data['user_id'] ?? null;
$goals = $data['goals'] ?? null;

if (!$user_id || !is_array($goals)) {

    echo json_encode([
        "success" => false,
        "message" => "user_id и goals обязательны"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    $pdo->beginTransaction();

    // Полностью заменяем список целей пользователя.
    $del = $pdo->prepare("DELETE FROM goals500 WHERE user_id = :user_id");
    $del->execute([':user_id' => $user_id]);

    $ins = $pdo->prepare("
        INSERT INTO goals500 (
            user_id,
            position,
            text,
            done
        )
        VALUES (
            :user_id,
            :position,
            :text,
            :done
        )
    ");

    foreach ($goals as $i => $goal) {

        $ins->execute([
            ':user_id'  => $user_id,
            ':position' => $i,
            ':text'     => (string)($goal['text'] ?? ''),
            ':done'     => !empty($goal['done']) ? 1 : 0,
        ]);
    }

    $pdo->commit();

    echo json_encode([
        "success" => true
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
