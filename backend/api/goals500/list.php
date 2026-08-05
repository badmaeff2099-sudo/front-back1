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

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {

    echo json_encode([
        "success" => false,
        "message" => "user_id required"
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    $stmt = $pdo->prepare("
        SELECT
            id,
            user_id,
            position,
            text,
            done

        FROM goals500

        WHERE user_id = :user_id

        ORDER BY position ASC, id ASC
    ");

    $stmt->execute([
        ':user_id' => $user_id
    ]);

    $goals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "goals" => $goals
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
