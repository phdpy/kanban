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
// GET: consulta uma tarefa pelo ID.
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $idConsulta = filter_var(
        $_GET["id"] ?? null,
        FILTER_VALIDATE_INT,
        ["options" => ["min_range" => 1]]
    );

    if ($idConsulta === false || $idConsulta === null) {
        responder(422, [
            "erro" => "Informe um ID de tarefa válido."
        ]);
    }

    require_once __DIR__ . "/config.php";

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare(
        "SELECT id, titulo, descricao, status, prioridade,
                projeto_id, usuario_id
         FROM tarefas
         WHERE id = :id"
    );

    $stmt->execute(["id" => $idConsulta]);

    $tarefa = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($tarefa === false) {
        responder(404, [
            "erro" => "Tarefa não encontrada."
        ]);
    }

    $tarefa["id"] = (int) $tarefa["id"];
    $tarefa["descricao"] = $tarefa["descricao"] ?? "";

    $tarefa["projeto_id"] = $tarefa["projeto_id"] === null
        ? null
        : (int) $tarefa["projeto_id"];

    $tarefa["usuario_id"] = $tarefa["usuario_id"] === null
        ? null
        : (int) $tarefa["usuario_id"];

    responder(200, $tarefa);
}
    // Nesta etapa, esta API recebe somente cadastros.
    // POST cadastra, PUT edita e DELETE exclui.
    $metodo = $_SERVER["REQUEST_METHOD"];

if (!in_array($metodo, ["POST", "PUT", "DELETE"], true)) {
    header("Allow: GET,POST, PUT, DELETE");

    responder(405, [
        "erro" => "Método não permitido. Use POST, PUT ou DELETE."
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
// Edição e exclusão precisam identificar a tarefa.
$id = null;

if ($metodo === "PUT" || $metodo === "DELETE") {
    $id = $dados->id ?? null;

    if (!is_int($id) || $id <= 0) {
        responder(422, [
            "erro" => "Informe um ID de tarefa válido."
        ]);
    }
}

// DELETE precisa somente do ID.
if ($metodo === "DELETE") {
    require_once __DIR__ . "/config.php";

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare(
        "DELETE FROM tarefas WHERE id = :id"
    );

    $stmt->execute(["id" => $id]);

    if ($stmt->rowCount() === 0) {
        responder(404, [
            "erro" => "Tarefa não encontrada. Atualize o quadro."
        ]);
    }

    responder(200, [
        "mensagem" => "Tarefa excluída com sucesso."
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

    // PUT: atualiza uma tarefa existente.
if ($metodo === "PUT") {
    $stmt = $pdo->prepare(
        "SELECT id FROM tarefas WHERE id = :id"
    );

    $stmt->execute(["id" => $id]);

    if ($stmt->fetch(PDO::FETCH_ASSOC) === false) {
        responder(404, [
            "erro" => "Tarefa não encontrada. Atualize o quadro."
        ]);
    }

    $sql = "UPDATE tarefas
            SET titulo = :titulo,
                descricao = :descricao,
                status = :status,
                prioridade = :prioridade,
                responsavel = :responsavel,
                projeto_id = :projeto_id,
                usuario_id = :usuario_id
            WHERE id = :id";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        "titulo" => $campos["titulo"],
        "descricao" => $campos["descricao"],
        "status" => $campos["status"],
        "prioridade" => $campos["prioridade"],
        "responsavel" => $usuario["nome"],
        "projeto_id" => $projetoId,
        "usuario_id" => $usuarioId,
        "id" => $id
    ]);

    responder(200, [
        "mensagem" => "Tarefa atualizada com sucesso."
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
        "erro" => "Não foi possível realizar a operação na tarefa."
    ]);
}