import type { Projeto } from "./types";

function iniciarPagina(): void {
    const formulario = document.querySelector("#form-projeto");
    const campoNome = document.querySelector("#nome");
    const campoDescricao = document.querySelector("#descricao");
    const botao = document.querySelector("#botao-salvar");
    const botaoCancelar = document.querySelector("#botao-cancelar");
    const mensagem = document.querySelector("#mensagem");
    const lista = document.querySelector("#lista-projetos");

    // Confere a existência e o tipo dos elementos.
    if (
        !(formulario instanceof HTMLFormElement) ||
        !(campoNome instanceof HTMLInputElement) ||
        !(campoDescricao instanceof HTMLTextAreaElement) ||
        !(botao instanceof HTMLButtonElement) ||
        !(botaoCancelar instanceof HTMLButtonElement) ||
        !(mensagem instanceof HTMLParagraphElement) ||
        !(lista instanceof HTMLUListElement)
    ) {
        console.error("Não foi possível localizar os elementos da página.");
        return;
    }

    // null representa um novo cadastro.
    let projetoEmEdicao: number | null = null;
    let processando: boolean = false;

    const mostrarMensagem = (texto: string): void => {
        mensagem.textContent = texto;
    };

    // Evita operações simultâneas.
    const definirProcessamento = (ativo: boolean): void => {
        processando = ativo;

        botao.disabled = ativo;
        botaoCancelar.disabled = ativo;
        campoNome.disabled = ativo;
        campoDescricao.disabled = ativo;

        lista.querySelectorAll("button").forEach((controle): void => {
            controle.disabled = ativo;
        });
    };

    function ehProjeto(valor: unknown): valor is Projeto {
        return (
            typeof valor === "object" &&
            valor !== null &&
            "id" in valor &&
            typeof valor.id === "number" &&
            Number.isInteger(valor.id) &&
            valor.id > 0 &&
            "nome" in valor &&
            typeof valor.nome === "string" &&
            "descricao" in valor &&
            typeof valor.descricao === "string"
        );
    }

    function obterMensagemErro(dados: unknown): string {
        if (
            typeof dados === "object" &&
            dados !== null &&
            "erro" in dados &&
            typeof dados.erro === "string"
        ) {
            return dados.erro;
        }

        return "Não foi possível realizar a operação.";
    }

    const limparFormulario = (): void => {
        projetoEmEdicao = null;
        formulario.reset();

        botao.textContent = "Cadastrar projeto";
        botaoCancelar.hidden = true;
    };

    // Coloca os dados do projeto no formulário.
    const iniciarEdicao = (projeto: Projeto): void => {
        if (processando) {
            return;
        }

        projetoEmEdicao = projeto.id;

        campoNome.value = projeto.nome;
        campoDescricao.value = projeto.descricao;

        botao.textContent = "Salvar alterações";
        botaoCancelar.hidden = false;

        mostrarMensagem(`Editando o projeto ${projeto.nome}.`);
        campoNome.focus();
    };

    // Monta os cartões e seus botões.
    const exibirProjetos = (projetos: Projeto[]): void => {
        lista.replaceChildren();

        if (projetos.length === 0) {
            const item = document.createElement("li");

            item.textContent = "Nenhum projeto cadastrado.";
            lista.appendChild(item);
            return;
        }

        projetos.forEach((projeto): void => {
            const item = document.createElement("li");
            const titulo = document.createElement("h3");
            const descricao = document.createElement("p");
            const acoes = document.createElement("div");
            const botaoEditar = document.createElement("button");
            const botaoExcluir = document.createElement("button");

            titulo.textContent = projeto.nome;
            descricao.textContent = projeto.descricao;
            acoes.classList.add("acoes-projeto");

            botaoEditar.type = "button";
            botaoEditar.textContent = "Editar";
            botaoEditar.classList.add("botao-editar");
            botaoEditar.disabled = processando;

            botaoEditar.setAttribute(
                "aria-label",
                `Editar projeto ${projeto.nome}`
            );

            botaoEditar.addEventListener("click", (): void => {
                iniciarEdicao(projeto);
            });

            botaoExcluir.type = "button";
            botaoExcluir.textContent = "Excluir";
            botaoExcluir.classList.add("botao-excluir");
            botaoExcluir.disabled = processando;

            botaoExcluir.setAttribute(
                "aria-label",
                `Excluir projeto ${projeto.nome}`
            );

            botaoExcluir.addEventListener("click", (): void => {
                void excluirProjeto(projeto);
            });

            acoes.append(botaoEditar, botaoExcluir);
            item.append(titulo, descricao, acoes);
            lista.appendChild(item);
        });
    };

    // GET: atualiza a listagem.
    const carregarProjetos = async (): Promise<void> => {
        lista.textContent = "Carregando projetos...";

        try {
            const resposta = await fetch("projetos.php");
            const dados: unknown = await resposta.json();

            if (!resposta.ok) {
                throw new Error(obterMensagemErro(dados));
            }

            if (!Array.isArray(dados) || !dados.every(ehProjeto)) {
                throw new Error(
                    "A API retornou uma lista em formato inválido."
                );
            }

            exibirProjetos(dados);

        } catch (erro: unknown) {
            lista.textContent =
                "Não foi possível carregar a lista. Atualize a página para tentar novamente.";

            console.error(erro);
        }
    };

    // DELETE: pede confirmação e solicita a exclusão.
    const excluirProjeto = async (
        projeto: Projeto
    ): Promise<void> => {
        if (processando) {
            return;
        }

        const confirmou = window.confirm(
            `Deseja excluir o projeto "${projeto.nome}"? ` +
            "Essa ação não pode ser desfeita."
        );

        if (!confirmou) {
            return;
        }

        definirProcessamento(true);
        mostrarMensagem("Excluindo projeto...");

        try {
            const resposta = await fetch("projetos.php", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: projeto.id })
            });

            const dados: unknown = await resposta.json();

            if (!resposta.ok) {
                throw new Error(obterMensagemErro(dados));
            }

            if (projetoEmEdicao === projeto.id) {
                limparFormulario();
            }

            mostrarMensagem("Projeto excluído com sucesso.");
            await carregarProjetos();

        } catch (erro: unknown) {
            const texto = erro instanceof Error
                ? erro.message
                : "Não foi possível excluir o projeto.";

            mostrarMensagem(texto);

        } finally {
            definirProcessamento(false);
        }
    };

    // POST cadastra; PUT altera o projeto escolhido.
    const salvarProjeto = async (
        evento: SubmitEvent
    ): Promise<void> => {
        evento.preventDefault();

        if (processando) {
            return;
        }

        const projeto = {
            nome: campoNome.value.trim(),
            descricao: campoDescricao.value.trim()
        };

        if (projeto.nome === "" || projeto.descricao === "") {
            mostrarMensagem("Preencha o nome e a descrição.");
            return;
        }

        const editando = projetoEmEdicao !== null;

        const dadosEnvio = editando
            ? { ...projeto, id: projetoEmEdicao }
            : projeto;

        definirProcessamento(true);
        mostrarMensagem("Salvando projeto...");

        try {
            const resposta = await fetch("projetos.php", {
                method: editando ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dadosEnvio)
            });

            const dados: unknown = await resposta.json();

            if (!resposta.ok) {
                throw new Error(obterMensagemErro(dados));
            }

            limparFormulario();

            mostrarMensagem(
                editando
                    ? "Projeto atualizado com sucesso."
                    : "Projeto cadastrado com sucesso."
            );

            await carregarProjetos();

        } catch (erro: unknown) {
            const texto = erro instanceof Error
                ? erro.message
                : "Não foi possível salvar o projeto.";

            mostrarMensagem(texto);

        } finally {
            definirProcessamento(false);
        }
    };

    botaoCancelar.addEventListener("click", (): void => {
        if (processando) {
            return;
        }

        limparFormulario();
        mostrarMensagem("Edição cancelada.");
    });

    formulario.addEventListener("submit", salvarProjeto);

    definirProcessamento(false);
    void carregarProjetos();
}

iniciarPagina();