<?php
//http://kanban.local/api.php
//A responsabilidade da API é:
//consultar banco
//      ↓
//pegar tarefas
//      ↓
//transformar em JSON
//      ↓
//enviar para o front-end


require_once "config.php";
//require_once "config.php";
try {
//Depois executamos uma consulta SQL:
    $sql = "SELECT * FROM tarefas";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $tarefas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    header("Content-Type: application/json; charset=UTF-8");
//O resultado é buscado e enviado:
//O json_encode() transforma os dados PHP em JSON.
echo json_encode($tarefas);

} catch (PDOException $e) {

    http_response_code(500);

    header("Content-Type: application/json; charset=UTF-8");

    echo json_encode([
        "erro" => "Erro ao buscar tarefas."
    ]);
}