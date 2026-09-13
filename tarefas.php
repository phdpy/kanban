<?php

header("Content-Type: application/json; charset=UTF-8");

// Centraliza as respostas da API.
function responder(int $codigo, array $dados): void
{
    http_response_code($codigo);

    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Nesta etapa, esta API recebe somente cadastros.
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        header("Allow: POST");

        responder(405, [
            "erro" => "Método não permitido. Use POST para cadastrar."
        ]);
    }

    $corpo = file_get_contents("php://input");

    $dados = json_decode(
        $corpo,
        false,
        512,
        JSON_THROW_ON_ERROR
    );

    if (!($dados instanceof \stdClass)) {
        responder(400, [
            "erro" => "Envie os dados da tarefa como um objeto JSON."
        ]);
    }

    // Valida os campos de texto.
    $campos = [];

    $limites = [
        "titulo" => 150,
        "descricao" => 2000,
        "status" => 30,
        "prioridade" => 20
    ];

    foreach ($limites as $campo => $limite) {
        $valor = $dados->$campo ?? null;

        if (!is_string($valor) || trim($valor) === "") {
            responder(422, [
                "erro" => "O campo {$campo} é obrigatório e deve ser um texto."
            ]);
        }

        $valor = trim($valor);

        if (mb_strlen($valor, "UTF-8") > $limite) {
            responder(422, [
                "erro" => "O campo {$campo} aceita até {$limite} caracteres."
            ]);
        }

        $campos[$campo] = $valor;
    }

    // Mantém os valores usados pelas colunas do Kanban.
    $statusPermitidos = [
        "A Fazer",
        "Em Andamento",
        "Concluída"
    ];

    $prioridadesPermitidas = [
        "Alta",
        "Média",
        "Baixa"
    ];

    if (!in_array($campos["status"], $statusPermitidos, true)) {
        responder(422, [
            "erro" => "Selecione um status válido."
        ]);
    }

    if (!in_array($campos["prioridade"], $prioridadesPermitidas, true)) {
        responder(422, [
            "erro" => "Selecione uma prioridade válida."
        ]);
    }

    $projetoId = $dados->projeto_id ?? null;
    $usuarioId = $dados->usuario_id ?? null;

    if (!is_int($projetoId) || $projetoId <= 0) {
        responder(422, [
            "erro" => "Selecione um projeto válido."
        ]);
    }

    if (!is_int($usuarioId) || $usuarioId <= 0) {
        responder(422, [
            "erro" => "Selecione um responsável válido."
        ]);
    }

    require_once __DIR__ . "/config.php";

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Confere se o projeto existe.
    $stmt = $pdo->prepare(
        "SELECT id FROM projetos WHERE id = :id"
    );

    $stmt->execute(["id" => $projetoId]);

    if ($stmt->fetch(PDO::FETCH_ASSOC) === false) {
        responder(422, [
            "erro" => "O projeto selecionado não existe mais. Atualize a lista."
        ]);
    }

    // Busca o responsável no banco.
    $stmt = $pdo->prepare(
        "SELECT id, nome FROM usuarios WHERE id = :id"
    );

    $stmt->execute(["id" => $usuarioId]);

    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuario === false) {
        responder(422, [
            "erro" => "O responsável selecionado não existe mais. Atualize a lista."
        ]);
    }

    // Guarda os vínculos e mantém o nome usado pelo quadro atual.
    $sql = "INSERT INTO tarefas (
                titulo,
                descricao,
                status,
                prioridade,
                responsavel,
                projeto_id,
                usuario_id
            ) VALUES (
                :titulo,
                :descricao,
                :status,
                :prioridade,
                :responsavel,
                :projeto_id,
                :usuario_id
            )";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        "titulo" => $campos["titulo"],
        "descricao" => $campos["descricao"],
        "status" => $campos["status"],
        "prioridade" => $campos["prioridade"],
        "responsavel" => $usuario["nome"],
        "projeto_id" => $projetoId,
        "usuario_id" => $usuarioId
    ]);

    responder(201, [
        "mensagem" => "Tarefa cadastrada com sucesso.",
        "tarefa" => [
            "id" => (int) $pdo->lastInsertId(),
            "titulo" => $campos["titulo"],
            "descricao" => $campos["descricao"],
            "status" => $campos["status"],
            "prioridade" => $campos["prioridade"],
            "responsavel" => $usuario["nome"],
            "projeto_id" => $projetoId,
            "usuario_id" => $usuarioId
        ]
    ]);

} catch (\JsonException $erro) {
    responder(400, [
        "erro" => "O JSON enviado está inválido."
    ]);

} catch (\PDOException $erro) {
    // Trata um vínculo que deixou de existir durante o cadastro.
    if ((int) ($erro->errorInfo[1] ?? 0) === 1452) {
        responder(409, [
            "erro" => "O projeto ou responsável não está mais disponível. Atualize a página."
        ]);
    }

    responder(500, [
        "erro" => "Não foi possível cadastrar a tarefa."
    ]);
}