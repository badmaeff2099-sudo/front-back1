<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../../db.php';

$data = json_decode(file_get_contents("php://input"), true);

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (!$email || !$password) {

    echo json_encode([
        "success" => false,
        "error" => "Введите email и пароль"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    $stmt = $pdo->prepare("
        SELECT *
        FROM users
        WHERE email = :email
    ");

    $stmt->execute([
        ':email' => $email
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password'])) {

        echo json_encode([
            "success" => false,
            "error" => "Неверный email или пароль"
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    echo json_encode([
        "success" => true,
        "user" => [
            "id" => $user['id'],
            "username" => $user['name'],
            "email" => $user['email'],
            "location" => $user['location'],
            "goal" => $user['goal']
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}