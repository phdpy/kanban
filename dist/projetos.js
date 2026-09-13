function iniciarPagina() {
    const formulario = document.querySelector("#form-projeto");
    const campoNome = document.querySelector("#nome");
    const campoDescricao = document.querySelector("#descricao");
    const botao = document.querySelector("#botao-salvar");
    const mensagem = document.querySelector("#mensagem");
    const lista = document.querySelector("#lista-projetos");
    // Valida os elementos antes de utilizá-los.
    if (!(formulario instanceof HTMLFormElement) ||
        !(campoNome instanceof HTMLInputElement) ||
        !(campoDescricao instanceof HTMLTextAreaElement) ||
        !(botao instanceof HTMLButtonElement) ||
        !(mensagem instanceof HTMLParagraphElement) ||
        !(lista instanceof HTMLUListElement)) {
        console.error("Não foi possível localizar os elementos da página.");
        return;
    }
    let processando = false;
    const mostrarMensagem = (texto) => {
        mensagem.textContent = texto;
    };
    const definirProcessamento = (ativo) => {
        processando = ativo;
        botao.disabled = ativo;
        campoNome.disabled = ativo;
        campoDescricao.disabled = ativo;
    };
    // Confere se os dados recebidos correspondem ao tipo Projeto.
    function ehProjeto(valor) {
        if (typeof valor !== "object" || valor === null) {
            return false;
        }
        return ("id" in valor &&
            typeof valor.id === "number" &&
            Number.isInteger(valor.id) &&
            valor.id > 0 &&
            "nome" in valor &&
            typeof valor.nome === "string" &&
            "descricao" in valor &&
            typeof valor.descricao === "string");
    }
    function obterMensagemErro(dados) {
        if (typeof dados === "object" &&
            dados !== null &&
            "erro" in dados &&
            typeof dados.erro === "string") {
            return dados.erro;
        }
        return "Não foi possível realizar a operação.";
    }
    // Monta a listagem usando os dados da API.
    const exibirProjetos = (projetos) => {
        lista.replaceChildren();
        if (projetos.length === 0) {
            const item = document.createElement("li");
            item.textContent = "Nenhum projeto cadastrado.";
            lista.appendChild(item);
            return;
        }
        projetos.forEach((projeto) => {
            const item = document.createElement("li");
            const titulo = document.createElement("h3");
            const descricao = document.createElement("p");
            titulo.textContent = projeto.nome;
            descricao.textContent = projeto.descricao;
            item.append(titulo, descricao);
            lista.appendChild(item);
        });
    };
    // GET: consulta os projetos.
    const carregarProjetos = async () => {
        lista.textContent = "Carregando projetos...";
        try {
            const resposta = await fetch("projetos.php");
            const dados = await resposta.json();
            if (!resposta.ok) {
                throw new Error(obterMensagemErro(dados));
            }
            if (!Array.isArray(dados) || !dados.every(ehProjeto)) {
                throw new Error("A API retornou uma lista em formato inválido.");
            }
            exibirProjetos(dados);
        }
        catch (erro) {
            lista.textContent =
                "Não foi possível carregar a lista. Atualize a página para tentar novamente.";
            console.error(erro);
        }
    };
    // POST: envia o novo projeto ao PHP.
    const cadastrarProjeto = async (evento) => {
        evento.preventDefault();
        if (processando) {
            return;
        }
        const novoProjeto = {
            nome: campoNome.value.trim(),
            descricao: campoDescricao.value.trim()
        };
        if (novoProjeto.nome === "" ||
            novoProjeto.descricao === "") {
            mostrarMensagem("Preencha o nome e a descrição.");
            return;
        }
        definirProcessamento(true);
        mostrarMensagem("Salvando projeto...");
        try {
            const resposta = await fetch("projetos.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(novoProjeto)
            });
            const dados = await resposta.json();
            if (!resposta.ok) {
                throw new Error(obterMensagemErro(dados));
            }
            formulario.reset();
            mostrarMensagem("Projeto cadastrado com sucesso.");
            await carregarProjetos();
        }
        catch (erro) {
            const texto = erro instanceof Error
                ? erro.message
                : "Não foi possível cadastrar o projeto.";
            mostrarMensagem(texto);
        }
        finally {
            definirProcessamento(false);
        }
    };
    formulario.addEventListener("submit", cadastrarProjeto);
    definirProcessamento(false);
    void carregarProjetos();
}
iniciarPagina();
export {};
