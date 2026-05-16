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

$username = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');
$location = trim($data['location'] ?? '');
$goal = trim($data['goal'] ?? '');

if (!$username || !$email || !$password) {

    echo json_encode([
        "success" => false,
        "error" => "Заполните обязательные поля"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

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

    $stmt = $pdo->prepare("
        INSERT INTO users (
            username,
            email,
            password,
            location,
            goal
        )

        VALUES (
            :username,
            :email,
            :password,
            :location,
            :goal
        )

        RETURNING
            id,
            username,
            email,
            location,
            goal
    ");

    $stmt->execute([
        ':username' => $username,
        ':email' => $email,
        ':password' => $hashedPassword,
        ':location' => $location,
        ':goal' => $goal
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