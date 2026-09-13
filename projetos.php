<?php

header("Content-Type: application/json; charset=UTF-8");

try {
    require_once __DIR__ . "/config.php";

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $metodo = $_SERVER["REQUEST_METHOD"];

    // GET: listar projetos.
    if ($metodo === "GET") {
        $sql = "SELECT id, nome, descricao
                FROM projetos
                ORDER BY nome, id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();

        $projetos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($projetos as $indice => $projeto) {
            $projetos[$indice]["id"] = (int) $projeto["id"];
        }

        echo json_encode($projetos, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // POST: cadastrar um projeto.
    if ($metodo === "POST") {
        // Lê os dados enviados pelo formulário em JSON.
        $corpo = file_get_contents("php://input");

        $dados = json_decode(
            $corpo,
            false,
            512,
            JSON_THROW_ON_ERROR
        );

        if (!($dados instanceof \stdClass)) {
            http_response_code(400);

            echo json_encode([
                "erro" => "Envie um objeto com nome e descricao."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $nome = $dados->nome ?? null;
        $descricao = $dados->descricao ?? null;

        // Valida o tipo dos campos.
        if (!is_string($nome) || !is_string($descricao)) {
            http_response_code(422);

            echo json_encode([
                "erro" => "Nome e descrição devem ser informados como texto."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $nome = trim($nome);
        $descricao = trim($descricao);

        // Não permite cadastrar campos vazios.
        if ($nome === "" || $descricao === "") {
            http_response_code(422);

            echo json_encode([
                "erro" => "Preencha o nome e a descrição."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (mb_strlen($nome, "UTF-8") > 100) {
            http_response_code(422);

            echo json_encode([
                "erro" => "O nome deve ter no máximo 100 caracteres."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Limite definido para as descrições do nosso sistema.
        if (mb_strlen($descricao, "UTF-8") > 2000) {
            http_response_code(422);

            echo json_encode([
                "erro" => "A descrição deve ter no máximo 2000 caracteres."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sql = "INSERT INTO projetos (nome, descricao)
                VALUES (:nome, :descricao)";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            "nome" => $nome,
            "descricao" => $descricao
        ]);

        http_response_code(201);

        echo json_encode([
            "mensagem" => "Projeto cadastrado com sucesso.",
            "projeto" => [
                "id" => (int) $pdo->lastInsertId(),
                "nome" => $nome,
                "descricao" => $descricao
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Os demais métodos serão adicionados nas próximas etapas.
    header("Allow: GET, POST");
    http_response_code(405);

    echo json_encode([
        "erro" => "Método não permitido."
    ], JSON_UNESCAPED_UNICODE);

} catch (\JsonException $erro) {
    http_response_code(400);

    echo json_encode([
        "erro" => "O JSON enviado está inválido."
    ], JSON_UNESCAPED_UNICODE);

} catch (\PDOException $erro) {
    http_response_code(500);

    echo json_encode([
        "erro" => "Não foi possível realizar a operação."
    ], JSON_UNESCAPED_UNICODE);
}