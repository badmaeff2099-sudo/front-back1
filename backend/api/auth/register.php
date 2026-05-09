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

$name = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');
$location = trim($data['location'] ?? '');
$goal = trim($data['goal'] ?? '');

if (!$name || !$email || !$password) {

    echo json_encode([
        "success" => false,
        "error" => "Заполните все поля"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    // Проверяем email
    $check = $pdo->prepare("
        SELECT id
        FROM users
        WHERE email = :email
    ");

    $check->execute([
        ':email' => $email
    ]);

    if ($check->fetch()) {

        echo json_encode([
            "success" => false,
            "error" => "Email уже используется"
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Создаем пользователя
    $stmt = $pdo->prepare("
        INSERT INTO users (
            name,
            email,
            password,
            location,
            goal
        )
        VALUES (
            :name,
            :email,
            :password,
            :location,
            :goal
        )
        RETURNING id, name, email, location, goal
    ");

    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':password' => $hashedPassword,
        ':location' => $location,
        ':goal' => $goal
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

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