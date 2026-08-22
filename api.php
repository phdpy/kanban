<?php
//http://kanban.local/api.php
require_once "config.php";

try {

    $sql = "SELECT * FROM tarefas";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $tarefas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    header("Content-Type: application/json; charset=UTF-8");

    echo json_encode($tarefas);

} catch (PDOException $e) {

    http_response_code(500);

    header("Content-Type: application/json; charset=UTF-8");

    echo json_encode([
        "erro" => "Erro ao buscar tarefas."
    ]);
}