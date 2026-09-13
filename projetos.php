<?php

header("Content-Type: application/json; charset=UTF-8");

// Envia uma resposta JSON e encerra a execução.
function responder(int $codigo, array $dados): void
{
    http_response_code($codigo);

    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $metodo = $_SERVER["REQUEST_METHOD"];

    if (!in_array($metodo, ["GET", "POST", "PUT", "DELETE"], true)) {
        header("Allow: GET, POST, PUT, DELETE");

        responder(405, [
            "erro" => "Método não permitido."
        ]);
    }

    require_once __DIR__ . "/config.php";

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // GET: listar projetos.
    if ($metodo === "GET") {
        $stmt = $pdo->prepare(
            "SELECT id, nome, descricao
             FROM projetos
             ORDER BY nome, id"
        );

        $stmt->execute();

        $projetos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($projetos as $indice => $projeto) {
            $projetos[$indice]["id"] = (int) $projeto["id"];
        }

        responder(200, $projetos);
    }

    // POST, PUT e DELETE recebem dados no corpo da requisição.
    $corpo = file_get_contents("php://input");

    $dados = json_decode(
        $corpo,
        false,
        512,
        JSON_THROW_ON_ERROR
    );

    if (!($dados instanceof \stdClass)) {
        responder(400, [
            "erro" => "Envie os dados como um objeto JSON."
        ]);
    }

    // Edição e exclusão precisam identificar um projeto.
    $id = null;

    if ($metodo === "PUT" || $metodo === "DELETE") {
        $id = $dados->id ?? null;

        if (!is_int($id) || $id <= 0) {
            responder(422, [
                "erro" => "Informe um ID de projeto válido."
            ]);
        }
    }

    // DELETE: excluir projeto.
    if ($metodo === "DELETE") {
        $stmt = $pdo->prepare(
            "DELETE FROM projetos WHERE id = :id"
        );

        $stmt->execute(["id" => $id]);

        if ($stmt->rowCount() === 0) {
            responder(404, [
                "erro" => "Projeto não encontrado. Atualize a lista."
            ]);
        }

        responder(200, [
            "mensagem" => "Projeto excluído com sucesso."
        ]);
    }

    // Cadastro e edição compartilham as mesmas validações.
    $nome = $dados->nome ?? null;
    $descricao = $dados->descricao ?? null;

    if (!is_string($nome) || !is_string($descricao)) {
        responder(422, [
            "erro" => "Nome e descrição devem ser informados como texto."
        ]);
    }

    $nome = trim($nome);
    $descricao = trim($descricao);

    if ($nome === "" || $descricao === "") {
        responder(422, [
            "erro" => "Preencha o nome e a descrição."
        ]);
    }

    if (mb_strlen($nome, "UTF-8") > 100) {
        responder(422, [
            "erro" => "O nome deve ter no máximo 100 caracteres."
        ]);
    }

    if (mb_strlen($descricao, "UTF-8") > 2000) {
        responder(422, [
            "erro" => "A descrição deve ter no máximo 2000 caracteres."
        ]);
    }

    // POST: cadastrar projeto.
    if ($metodo === "POST") {
        $stmt = $pdo->prepare(
            "INSERT INTO projetos (nome, descricao)
             VALUES (:nome, :descricao)"
        );

        $stmt->execute([
            "nome" => $nome,
            "descricao" => $descricao
        ]);

        responder(201, [
            "mensagem" => "Projeto cadastrado com sucesso.",
            "projeto" => [
                "id" => (int) $pdo->lastInsertId(),
                "nome" => $nome,
                "descricao" => $descricao
            ]
        ]);
    }

    // PUT: verifica a existência do projeto antes de editar.
    $stmt = $pdo->prepare(
        "SELECT id FROM projetos WHERE id = :id"
    );

    $stmt->execute(["id" => $id]);

    if ($stmt->fetch(PDO::FETCH_ASSOC) === false) {
        responder(404, [
            "erro" => "Projeto não encontrado. Atualize a lista."
        ]);
    }

    $stmt = $pdo->prepare(
        "UPDATE projetos
         SET nome = :nome,
             descricao = :descricao
         WHERE id = :id"
    );

    $stmt->execute([
        "nome" => $nome,
        "descricao" => $descricao,
        "id" => $id
    ]);

    responder(200, [
        "mensagem" => "Projeto atualizado com sucesso.",
        "projeto" => [
            "id" => $id,
            "nome" => $nome,
            "descricao" => $descricao
        ]
    ]);

} catch (\JsonException $erro) {
    responder(400, [
        "erro" => "O JSON enviado está inválido."
    ]);

} catch (\PDOException $erro) {
    // O banco bloqueia a exclusão de projetos com tarefas vinculadas.
    if (
        $metodo === "DELETE" &&
        (int) ($erro->errorInfo[1] ?? 0) === 1451
    ) {
        responder(409, [
            "erro" => "Não é possível excluir este projeto porque ele possui tarefas vinculadas."
        ]);
    }

    responder(500, [
        "erro" => "Não foi possível realizar a operação."
    ]);
}