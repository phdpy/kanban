import type { Projeto, Usuario } from "./types";

function iniciarPagina(): void {
    const formulario = document.querySelector("#form-tarefa");
    const titulo = document.querySelector("#titulo");
    const descricao = document.querySelector("#descricao");
    const projeto = document.querySelector("#projeto");
    const responsavel = document.querySelector("#responsavel");
    const status = document.querySelector("#status");
    const prioridade = document.querySelector("#prioridade");
    const botao = document.querySelector("#botao-salvar");
    const mensagem = document.querySelector("#mensagem");

    if (
        !(formulario instanceof HTMLFormElement) ||
        !(titulo instanceof HTMLInputElement) ||
        !(descricao instanceof HTMLTextAreaElement) ||
        !(projeto instanceof HTMLSelectElement) ||
        !(responsavel instanceof HTMLSelectElement) ||
        !(status instanceof HTMLSelectElement) ||
        !(prioridade instanceof HTMLSelectElement) ||
        !(botao instanceof HTMLButtonElement) ||
        !(mensagem instanceof HTMLParagraphElement)
    ) {
        console.error("Não foi possível localizar os elementos da página.");
        return;
    }

    let salvando: boolean = false;
    let listasProntas: boolean = false;

    const mostrarMensagem = (texto: string): void => {
        mensagem.textContent = texto;
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

    function ehUsuario(valor: unknown): valor is Usuario {
        return (
            typeof valor === "object" &&
            valor !== null &&
            "id" in valor &&
            typeof valor.id === "number" &&
            Number.isInteger(valor.id) &&
            valor.id > 0 &&
            "nome" in valor &&
            typeof valor.nome === "string" &&
            "email" in valor &&
            typeof valor.email === "string" &&
            "cargo" in valor &&
            typeof valor.cargo === "string"
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

    // Consulta uma API e verifica se a resposta foi bem-sucedida.
    const consultar = async (url: string): Promise<unknown> => {
        const resposta = await fetch(url);
        const dados: unknown = await resposta.json();

        if (!resposta.ok) {
            throw new Error(obterMensagemErro(dados));
        }

        return dados;
    };

    // Preenche uma lista mostrando nomes e guardando IDs nos valores.
    const preencherLista = (
        select: HTMLSelectElement,
        itens: { id: number; nome: string }[],
        orientacao: string
    ): void => {
        select.replaceChildren();

        const opcaoInicial = document.createElement("option");
        opcaoInicial.value = "";
        opcaoInicial.textContent = orientacao;
        opcaoInicial.defaultSelected = true;

        select.appendChild(opcaoInicial);

        itens.forEach((item): void => {
            const opcao = document.createElement("option");

            opcao.value = String(item.id);
            opcao.textContent = item.nome;

            select.appendChild(opcao);
        });

        select.value = "";
    };

    const definirBloqueio = (bloqueado: boolean): void => {
        titulo.disabled = bloqueado;
        descricao.disabled = bloqueado;
        status.disabled = bloqueado;
        prioridade.disabled = bloqueado;

        projeto.disabled = bloqueado || !listasProntas;
        responsavel.disabled = bloqueado || !listasProntas;
        botao.disabled = bloqueado || !listasProntas;
    };

    const carregarListas = async (): Promise<void> => {
        listasProntas = false;
        definirBloqueio(true);
        mostrarMensagem("Carregando projetos e responsáveis...");

        try {
            // As duas consultas são independentes.
            const [projetos, usuarios] = await Promise.all([
                consultar("projetos.php"),
                consultar("usuarios.php")
            ]);

            if (
                !Array.isArray(projetos) ||
                !projetos.every(ehProjeto)
            ) {
                throw new Error("A lista de projetos está em formato inválido.");
            }

            if (
                !Array.isArray(usuarios) ||
                !usuarios.every(ehUsuario)
            ) {
                throw new Error("A lista de responsáveis está em formato inválido.");
            }

            preencherLista(
                projeto,
                projetos,
                projetos.length === 0
                    ? "Nenhum projeto cadastrado"
                    : "Selecione o projeto"
            );

            preencherLista(
                responsavel,
                usuarios,
                usuarios.length === 0
                    ? "Nenhum responsável cadastrado"
                    : "Selecione o responsável"
            );

            listasProntas = projetos.length > 0 && usuarios.length > 0;

            mostrarMensagem(
                listasProntas
                    ? ""
                    : "Cadastre pelo menos um projeto e um responsável. Depois, atualize esta página."
            );

        } catch (erro: unknown) {
            preencherLista(projeto, [], "Lista indisponível");
            preencherLista(responsavel, [], "Lista indisponível");

            const texto = erro instanceof Error
                ? erro.message
                : "Não foi possível carregar as opções.";

            mostrarMensagem(`${texto} Atualize a página para tentar novamente.`);

        } finally {
            definirBloqueio(false);
        }
    };

    const cadastrarTarefa = async (
        evento: SubmitEvent
    ): Promise<void> => {
        evento.preventDefault();

        if (salvando || !listasProntas) {
            return;
        }

        // Valores de select são textos; o PHP espera IDs numéricos.
        const projetoId = Number(projeto.value);
        const usuarioId = Number(responsavel.value);

        if (
            !Number.isInteger(projetoId) ||
            projetoId <= 0 ||
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0
        ) {
            mostrarMensagem("Selecione um projeto e um responsável.");
            return;
        }

        const tarefa = {
            titulo: titulo.value.trim(),
            descricao: descricao.value.trim(),
            projeto_id: projetoId,
            usuario_id: usuarioId,
            status: status.value,
            prioridade: prioridade.value
        };

        if (tarefa.titulo === "" || tarefa.descricao === "") {
            mostrarMensagem("Preencha o título e a descrição.");
            return;
        }

        if (
            !["A Fazer", "Em Andamento", "Concluída"].includes(tarefa.status) ||
            !["Alta", "Média", "Baixa"].includes(tarefa.prioridade)
        ) {
            mostrarMensagem("Selecione um status e uma prioridade válidos.");
            return;
        }

        salvando = true;
        definirBloqueio(true);
        mostrarMensagem("Salvando tarefa...");

        try {
            const resposta = await fetch("tarefas.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(tarefa)
            });

            const dados: unknown = await resposta.json();

            if (!resposta.ok) {
                throw new Error(obterMensagemErro(dados));
            }

            formulario.reset();

            mostrarMensagem(
                "Tarefa cadastrada com sucesso! Volte ao Kanban para visualizá-la."
            );

        } catch (erro: unknown) {
            const texto = erro instanceof Error
                ? erro.message
                : "Não foi possível cadastrar a tarefa.";

            mostrarMensagem(texto);

        } finally {
            salvando = false;
            definirBloqueio(false);
        }
    };

    formulario.addEventListener("submit", cadastrarTarefa);

    void carregarListas();
}

iniciarPagina();