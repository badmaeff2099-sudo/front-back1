<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit();
}

require_once '../../db.php';

$pdo = getPDO();

$data = json_decode(file_get_contents("php://input"), true);

$user_id = $data['user_id'] ?? null;

if (!$user_id) {

    echo json_encode([
        "success" => false,
        "error" => "user_id required"
    ]);

    exit;
}

try {

    // Check nickname uniqueness if provided
    $newNickname = $data['nickname'] ?? null;
    if ($newNickname !== null && $newNickname !== '') {
        $nickCheck = $pdo->prepare("SELECT id FROM users WHERE nickname = :nickname AND id != :user_id");
        $nickCheck->execute([':nickname' => $newNickname, ':user_id' => $user_id]);
        if ($nickCheck->fetch()) {
            echo json_encode([
                "success" => false,
                "error" => "Этот никнейм уже занят"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    $stmt = $pdo->prepare("
        UPDATE users
        SET
            username = COALESCE(:username, username),
            nickname = COALESCE(:nickname, nickname),
            location = COALESCE(:location, location),
            goal = COALESCE(:goal, goal),
            bio = COALESCE(:bio, bio),
            daily_actions = COALESCE(:daily_actions, daily_actions)

        WHERE id = :user_id

        RETURNING
            id,
            username,
            nickname,
            location,
            goal,
            bio,
            daily_actions,
            created_at,
            avatar_url
    ");

    $stmt->execute([
        ':user_id' => $user_id,
        ':username' => $data['username'] ?? null,
        ':nickname' => $newNickname !== '' ? $newNickname : null,
        ':location' => $data['location'] ?? null,
        ':goal' => $data['goal'] ?? null,
        ':bio' => $data['bio'] ?? null,
        ':daily_actions' => $data['daily_actions'] ?? null,
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "user" => $user
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}