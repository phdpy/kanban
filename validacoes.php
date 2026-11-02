<?php

declare(strict_types=1);

// Aceita CPF com pontuação ou somente números.
// Retorna apenas os números quando o formato é permitido.
function normalizarCpf(string $cpf): string
{
    $cpf = trim($cpf);

    $formatoPermitido = preg_match(
        '/^(?:[0-9]{11}|[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})$/',
        $cpf
    );

    if ($formatoPermitido !== 1) {
        return "";
    }

    return str_replace([".", "-"], "", $cpf);
}

// Confere o tamanho, sequências repetidas e os dígitos verificadores.
function validarCpf(string $cpf): bool
{
    $cpf = normalizarCpf($cpf);

    if (strlen($cpf) !== 11) {
        return false;
    }

    // Rejeita sequências como 00000000000 e 11111111111.
    if (preg_match('/^([0-9])\1{10}$/', $cpf) === 1) {
        return false;
    }

    // Calcula primeiro o décimo dígito, depois o décimo primeiro.
    for ($posicao = 9; $posicao <= 10; $posicao++) {
        $soma = 0;

        for ($indice = 0; $indice < $posicao; $indice++) {
            $peso = ($posicao + 1) - $indice;
            $soma += (int) $cpf[$indice] * $peso;
        }

        $resto = $soma % 11;
        $digitoEsperado = $resto < 2 ? 0 : 11 - $resto;

        if ((int) $cpf[$posicao] !== $digitoEsperado) {
            return false;
        }
    }

    return true;
}

// Retorna null quando a senha atende às regras.
// Caso contrário, retorna uma mensagem explicando o problema.
function validarSenha(string $senha): ?string
{
    if (mb_strlen($senha, "UTF-8") < 8) {
        return "A senha deve ter pelo menos 8 caracteres.";
    }

    // Evita ultrapassar o limite de entrada do bcrypt.
    if (strlen($senha) > 72) {
        return "A senha deve ocupar no máximo 72 bytes. Acentos podem ocupar mais de um byte.";
    }

    if (strpos($senha, "\0") !== false) {
        return "A senha contém um caractere inválido.";
    }

    if (preg_match('/[A-Z]/', $senha) !== 1) {
        return "A senha deve conter pelo menos uma letra maiúscula de A a Z.";
    }

    if (preg_match('/[a-z]/', $senha) !== 1) {
        return "A senha deve conter pelo menos uma letra minúscula de a a z.";
    }

    if (preg_match('/[0-9]/', $senha) !== 1) {
        return "A senha deve conter pelo menos um número.";
    }

    if (preg_match('/[\p{P}\p{S}]/u', $senha) !== 1) {
        return "A senha deve conter pelo menos um símbolo, como !, @ ou #.";
    }

    return null;
}

// Valida o formato do e-mail.
function validarEmail(string $email): bool
{
    $email = trim($email);

    return strlen($email) <= 150
        && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}