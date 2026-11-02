export class Cpf {
    // Só a própria classe pode acessar este campo diretamente.
    #valor: string;

    constructor(valor: string) {
        // O objeto só é criado se o CPF for válido.
        this.#valor = Cpf.normalizarEValidar(valor);
    }

    // Permite consultar o CPF sem expor o campo privado.
    get valor(): string {
        return this.#valor;
    }

    // Toda alteração precisa passar novamente pela validação.
    set valor(novoValor: string) {
        this.#valor = Cpf.normalizarEValidar(novoValor);
    }

    // Expõe uma representação formatada para a interface.
    get formatado(): string {
        return this.#valor.replace(
            /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
            "$1.$2.$3-$4"
        );
    }

    private static normalizarEValidar(valor: string): string {
        const texto = valor.trim();

        const formatoPermitido =
            /^(?:[0-9]{11}|[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})$/;

        if (!formatoPermitido.test(texto)) {
            throw new Error(
                "Informe o CPF com 11 dígitos ou no formato 000.000.000-00."
            );
        }

        const numeros = texto.replace(/[.-]/g, "");

        if (/^([0-9])\1{10}$/.test(numeros)) {
            throw new Error("O CPF não pode ter todos os dígitos iguais.");
        }

        for (let posicao = 9; posicao <= 10; posicao++) {
            let soma = 0;

            for (let indice = 0; indice < posicao; indice++) {
                const peso = posicao + 1 - indice;
                soma += Number(numeros.charAt(indice)) * peso;
            }

            const resto = soma % 11;
            const digitoEsperado = resto < 2 ? 0 : 11 - resto;

            if (Number(numeros.charAt(posicao)) !== digitoEsperado) {
                throw new Error("O CPF informado é inválido.");
            }
        }

        return numeros;
    }
}