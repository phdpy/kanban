var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Cpf_valor;
export class Cpf {
    constructor(valor) {
        // Só a própria classe pode acessar este campo diretamente.
        _Cpf_valor.set(this, void 0);
        // O objeto só é criado se o CPF for válido.
        __classPrivateFieldSet(this, _Cpf_valor, Cpf.normalizarEValidar(valor), "f");
    }
    // Permite consultar o CPF sem expor o campo privado.
    get valor() {
        return __classPrivateFieldGet(this, _Cpf_valor, "f");
    }
    // Toda alteração precisa passar novamente pela validação.
    set valor(novoValor) {
        __classPrivateFieldSet(this, _Cpf_valor, Cpf.normalizarEValidar(novoValor), "f");
    }
    // Expõe uma representação formatada para a interface.
    get formatado() {
        return __classPrivateFieldGet(this, _Cpf_valor, "f").replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    }
    static normalizarEValidar(valor) {
        const texto = valor.trim();
        const formatoPermitido = /^(?:[0-9]{11}|[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})$/;
        if (!formatoPermitido.test(texto)) {
            throw new Error("Informe o CPF com 11 dígitos ou no formato 000.000.000-00.");
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
_Cpf_valor = new WeakMap();
