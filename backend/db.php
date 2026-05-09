<?php

$host = "localhost";
$port = "5432";
$dbname = "chainify";
$user = "postgres";
$password = "root";

try {
    $pdo = new PDO(
        "pgsql:host=$host;port=$port;dbname=$dbname",
        $user,
        $password
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $e) {
    die("Ошибка подключения к БД: " . $e->getMessage());
}