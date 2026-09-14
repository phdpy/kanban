<?php

// Esta API fornece as tarefas para o quadro Kanban.
header("Content-Type: application/json; charset=UTF-8");

try {
    require_once __DIR__ . "/config.php";

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Busca o nome atual do usuário vinculado.
    // Para tarefas antigas, mantém o responsável salvo na tarefa.
    $sql = "SELECT
                t.id,
                t.titulo,
                COALESCE(t.descricao, '') AS descricao,
                t.status,
                t.prioridade,
                COALESCE(u.nome, t.responsavel) AS responsavel,
                t.projeto_id,
                t.usuario_id
            FROM tarefas AS t
            LEFT JOIN usuarios AS u
                ON u.id = t.usuario_id
            ORDER BY t.id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $tarefas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Padroniza os IDs antes de enviar o JSON.
    foreach ($tarefas as $indice => $tarefa) {
        $tarefas[$indice]["id"] = (int) $tarefa["id"];

        $tarefas[$indice]["projeto_id"] =
            $tarefa["projeto_id"] === null
                ? null
                : (int) $tarefa["projeto_id"];

        $tarefas[$indice]["usuario_id"] =
            $tarefa["usuario_id"] === null
                ? null
                : (int) $tarefa["usuario_id"];
    }

    echo json_encode(
        $tarefas,
        JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
    );

} catch (\PDOException $erro) {
    http_response_code(500);

    echo json_encode([
        "erro" => "Não foi possível carregar as tarefas."
    ], JSON_UNESCAPED_UNICODE);

} catch (\JsonException $erro) {
    http_response_code(500);

    echo json_encode([
        "erro" => "Não foi possível converter as tarefas para JSON."
    ], JSON_UNESCAPED_UNICODE);
}