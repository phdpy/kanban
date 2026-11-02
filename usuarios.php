<?php

header("Content-Type: application/json; charset=UTF-8");

try {
    require_once __DIR__ . "/config.php";
    require_once __DIR__ . "/validacoes.php";

    // Faz o PDO lançar exceções quando uma consulta falhar.
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Identifica a operação solicitada.
    $metodo = $_SERVER["REQUEST_METHOD"];

    // GET: listar usuários.
    if ($metodo === "GET") {
        $sql = "SELECT id, nome, email, cargo
                FROM usuarios
                ORDER BY nome, id";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();

        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($usuarios as $indice => $usuario) {
            $usuarios[$indice]["id"] = (int) $usuario["id"];
        }

        echo json_encode($usuarios, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // POST: cadastrar um usuário.
// POST: cadastrar um usuário.
if ($metodo === "POST") {
    $dados = json_decode(
        file_get_contents("php://input"),
        false,
        512,
        JSON_THROW_ON_ERROR
    );

    if (!($dados instanceof stdClass)) {
        http_response_code(400);

        echo json_encode([
            "erro" => "Envie um objeto com os dados do usuário."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Cargo continua fazendo parte do nosso Kanban.
    $camposObrigatorios = ["nome", "email", "senha", "cpf", "cargo"];

    foreach ($camposObrigatorios as $campo) {
        if (
            !isset($dados->$campo) ||
            !is_string($dados->$campo) ||
            trim($dados->$campo) === ""
        ) {
            http_response_code(422);

            echo json_encode([
                "erro" => "O campo {$campo} é obrigatório e deve ser um texto."
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    $nome = trim($dados->nome);
    $email = trim($dados->email);
    $cargo = trim($dados->cargo);
    $cpf = normalizarCpf($dados->cpf);

    // Preserva exatamente a senha digitada, inclusive seus espaços.
    $senha = $dados->senha;

    if (
        mb_strlen($nome, "UTF-8") > 100 ||
        mb_strlen($cargo, "UTF-8") > 100
    ) {
        http_response_code(422);

        echo json_encode([
            "erro" => "Nome e cargo aceitam até 100 caracteres."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!validarEmail($email)) {
        http_response_code(422);

        echo json_encode([
            "erro" => "Informe um e-mail válido com até 150 bytes."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!validarCpf($cpf)) {
        http_response_code(422);

        echo json_encode([
            "erro" => "Informe um CPF válido."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $erroSenha = validarSenha($senha);

    if ($erroSenha !== null) {
        http_response_code(422);

        echo json_encode([
            "erro" => $erroSenha
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // O banco recebe o hash, nunca a senha original.
    $senhaHash = password_hash($senha, PASSWORD_BCRYPT);

    if ($senhaHash === false) {
        http_response_code(500);

        echo json_encode([
            "erro" => "Não foi possível concluir o cadastro."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $sql = "INSERT INTO usuarios
                (nome, email, cargo, cpf, senha_hash)
            VALUES
                (:nome, :email, :cargo, :cpf, :senha_hash)";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        "nome" => $nome,
        "email" => $email,
        "cargo" => $cargo,
        "cpf" => $cpf,
        "senha_hash" => $senhaHash
    ]);

    http_response_code(201);

    // A resposta não expõe a senha nem o hash.
    echo json_encode([
        "mensagem" => "Usuário cadastrado com sucesso.",
        "usuario" => [
            "id" => (int) $pdo->lastInsertId(),
            "nome" => $nome,
            "email" => $email,
            "cargo" => $cargo
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
    // PUT: editar um usuário existente.
if ($metodo === "PUT") {
    $corpo = file_get_contents("php://input");

    $dados = json_decode(
        $corpo,
        false,
        512,
        JSON_THROW_ON_ERROR
    );

    if (!($dados instanceof stdClass)) {
        http_response_code(400);

        echo json_encode([
            "erro" => "Envie um objeto com id, nome, email e cargo."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = $dados->id ?? null;
    $nome = $dados->nome ?? null;
    $email = $dados->email ?? null;
    $cargo = $dados->cargo ?? null;

    // O ID precisa ser um número inteiro positivo.
    if (!is_int($id) || $id <= 0) {
        http_response_code(422);

        echo json_encode([
            "erro" => "Informe um ID de usuário válido."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (
        !is_string($nome) ||
        !is_string($email) ||
        !is_string($cargo)
    ) {
        http_response_code(422);

        echo json_encode([
            "erro" => "Nome, e-mail e cargo devem ser informados como texto."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $nome = trim($nome);
    $email = trim($email);
    $cargo = trim($cargo);

    if ($nome === "" || $email === "" || $cargo === "") {
        http_response_code(422);

        echo json_encode([
            "erro" => "Preencha nome, e-mail e cargo."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (
        mb_strlen($nome, "UTF-8") > 100 ||
        mb_strlen($email, "UTF-8") > 150 ||
        mb_strlen($cargo, "UTF-8") > 100
    ) {
        http_response_code(422);

        echo json_encode([
            "erro" => "Nome e cargo aceitam até 100 caracteres; e-mail, até 150."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        http_response_code(422);

        echo json_encode([
            "erro" => "Informe um e-mail válido."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Confere se o usuário existe antes de tentar editar.
    $stmt = $pdo->prepare(
        "SELECT id FROM usuarios WHERE id = :id"
    );

    $stmt->execute(["id" => $id]);

    if ($stmt->fetch(PDO::FETCH_ASSOC) === false) {
        http_response_code(404);

        echo json_encode([
            "erro" => "Usuário não encontrado."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Atualiza somente o usuário identificado pelo ID.
    $sql = "UPDATE usuarios
            SET nome = :nome,
                email = :email,
                cargo = :cargo
            WHERE id = :id";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        "nome" => $nome,
        "email" => $email,
        "cargo" => $cargo,
        "id" => $id
    ]);

    http_response_code(200);

    echo json_encode([
        "mensagem" => "Usuário atualizado com sucesso.",
        "usuario" => [
            "id" => $id,
            "nome" => $nome,
            "email" => $email,
            "cargo" => $cargo
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
// DELETE: excluir um usuário.
if ($metodo === "DELETE") {
    $corpo = file_get_contents("php://input");

    $dados = json_decode(
        $corpo,
        false,
        512,
        JSON_THROW_ON_ERROR
    );

    if (!($dados instanceof stdClass)) {
        http_response_code(400);

        echo json_encode([
            "erro" => "Envie um objeto com o ID do usuário."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = $dados->id ?? null;

    if (!is_int($id) || $id <= 0) {
        http_response_code(422);

        echo json_encode([
            "erro" => "Informe um ID de usuário válido."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->prepare(
        "DELETE FROM usuarios WHERE id = :id"
    );

    $stmt->execute(["id" => $id]);

    // Nenhuma linha excluída significa que o ID não foi encontrado.
    if ($stmt->rowCount() === 0) {
        http_response_code(404);

        echo json_encode([
            "erro" => "Usuário não encontrado. Atualize a lista."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode([
        "mensagem" => "Usuário excluído com sucesso."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
    // Outros métodos ainda não foram implementados.
    header("Allow: GET, POST, PUT, DELETE");
    http_response_code(405);

    echo json_encode([
        "erro" => "Método não permitido."
    ], JSON_UNESCAPED_UNICODE);

} catch (\JsonException $erro) {
    http_response_code(400);

    echo json_encode([
        "erro" => "O JSON enviado está inválido."
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $erro) {
    // Impede excluir usuários que possuem tarefas vinculadas.
if ((int) ($erro->errorInfo[1] ?? 0) === 1451) {
    http_response_code(409);

    echo json_encode([
        "erro" => "Não é possível excluir este usuário porque ele possui tarefas vinculadas."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
    // Código do MariaDB para valor duplicado em uma chave única.
    if ((int) ($erro->errorInfo[1] ?? 0) === 1062) {
        http_response_code(409);

        echo json_encode([
            "erro" => "Já existe um usuário com esse e-mail ou CPF."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(500);

    echo json_encode([
        "erro" => "Não foi possível realizar a operação."
    ], JSON_UNESCAPED_UNICODE);
}