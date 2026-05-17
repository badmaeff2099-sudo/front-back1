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

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (!$email || !$password) {

    echo json_encode([
        "success" => false,
        "error" => "Email и пароль обязательны"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    $stmt = $pdo->prepare("
        SELECT
            id,
            username,
            email,
            password,
            location,
            goal,
            bio,
            daily_actions,
            avatar_url,
            created_at
        FROM users
        WHERE email = :email
        LIMIT 1
    ");

    $stmt->execute([
        ':email' => $email
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {

        echo json_encode([
            "success" => false,
            "error" => "Пользователь не найден"
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    if (!password_verify($password, $user['password'])) {

        echo json_encode([
            "success" => false,
            "error" => "Неверный пароль"
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    unset($user['password']);

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