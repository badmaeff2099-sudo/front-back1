<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit();
require_once '../../db.php';

$pdo = getPDO();

// Add column if not exists
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)");
} catch (PDOException $e) {}

$userId = intval($_POST['user_id'] ?? 0);
if (!$userId || empty($_FILES['avatar'])) {
    echo json_encode(["success" => false, "error" => "Missing user_id or file"], JSON_UNESCAPED_UNICODE); exit;
}

$file = $_FILES['avatar'];
$allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
if (!in_array($file['type'], $allowed)) {
    echo json_encode(["success" => false, "error" => "Invalid file type"], JSON_UNESCAPED_UNICODE); exit;
}
if ($file['size'] > 5 * 1024 * 1024) {
    echo json_encode(["success" => false, "error" => "File too large (max 5MB)"], JSON_UNESCAPED_UNICODE); exit;
}

$ext = match($file['type']) {
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
    default => 'jpg',
};

$uploadDir = __DIR__ . '/../../uploads/avatars/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Remove old avatar files for this user
foreach (glob($uploadDir . $userId . '.*') as $old) {
    unlink($old);
}

$filename = $userId . '.' . $ext;
$filepath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    echo json_encode(["success" => false, "error" => "Upload failed"], JSON_UNESCAPED_UNICODE); exit;
}

$avatarUrl = '/uploads/avatars/' . $filename;

try {
    $stmt = $pdo->prepare("UPDATE users SET avatar_url = :url WHERE id = :id");
    $stmt->execute([':url' => $avatarUrl, ':id' => $userId]);
    echo json_encode(["success" => true, "avatar_url" => $avatarUrl], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
