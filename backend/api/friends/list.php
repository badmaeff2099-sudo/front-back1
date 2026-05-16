<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit();
require_once '../../db.php';

$pdo = getPDO();
$userId = intval($_GET['user_id'] ?? 0);

if (!$userId) {
    echo json_encode(["success" => false, "error" => "No user_id"], JSON_UNESCAPED_UNICODE); exit;
}

try {
    // Accepted friends
    $stmt = $pdo->prepare("
        SELECT u.id, u.username, u.location, u.avatar_url, f.id as friendship_id
        FROM friendships f
        JOIN users u ON (
            CASE WHEN f.from_user_id = :uid1 THEN f.to_user_id ELSE f.from_user_id END = u.id
        )
        WHERE (f.from_user_id = :uid2 OR f.to_user_id = :uid3) AND f.status = 'accepted'
    ");
    $stmt->execute([':uid1' => $userId, ':uid2' => $userId, ':uid3' => $userId]);
    $friends = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Incoming pending requests
    $inStmt = $pdo->prepare("
        SELECT f.id as friendship_id, u.id, u.username, u.location
        FROM friendships f
        JOIN users u ON f.from_user_id = u.id
        WHERE f.to_user_id = :uid AND f.status = 'pending'
    ");
    $inStmt->execute([':uid' => $userId]);
    $incoming = $inStmt->fetchAll(PDO::FETCH_ASSOC);

    // Outgoing pending requests
    $outStmt = $pdo->prepare("
        SELECT f.id as friendship_id, u.id, u.username, f.status
        FROM friendships f
        JOIN users u ON f.to_user_id = u.id
        WHERE f.from_user_id = :uid AND f.status = 'pending'
    ");
    $outStmt->execute([':uid' => $userId]);
    $outgoing = $outStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($friends as &$f) {
        $f['completed_dates'] = [];
    }

    echo json_encode([
        "success" => true,
        "friends" => $friends,
        "incoming" => $incoming,
        "outgoing" => $outgoing,
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
