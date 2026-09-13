function iniciarPagina() {
    const formulario = document.querySelector("#form-tarefa");
    const titulo = document.querySelector("#titulo");
    const descricao = document.querySelector("#descricao");
    const projeto = document.querySelector("#projeto");
    const responsavel = document.querySelector("#responsavel");
    const status = document.querySelector("#status");
    const prioridade = document.querySelector("#prioridade");
    const botao = document.querySelector("#botao-salvar");
    const mensagem = document.querySelector("#mensagem");
    if (!(formulario instanceof HTMLFormElement) ||
        !(titulo instanceof HTMLInputElement) ||
        !(descricao instanceof HTMLTextAreaElement) ||
        !(projeto instanceof HTMLSelectElement) ||
        !(responsavel instanceof HTMLSelectElement) ||
        !(status instanceof HTMLSelectElement) ||
        !(prioridade instanceof HTMLSelectElement) ||
        !(botao instanceof HTMLButtonElement) ||
        !(mensagem instanceof HTMLParagraphElement)) {
        console.error("Não foi possível localizar os elementos da página.");
        return;
    }
    let salvando = false;
    let listasProntas = false;
    const parametros = new URLSearchParams(window.location.search);
    const idTexto = parametros.get("id");
    const tarefaEmEdicao = idTexto === null
        ? null
        : Number(idTexto);
    const mostrarMensagem = (texto) => {
        mensagem.textContent = texto;
    };
    function ehProjeto(valor) {
        return (typeof valor === "object" &&
            valor !== null &&
            "id" in valor &&
            typeof valor.id === "number" &&
            Number.isInteger(valor.id) &&
            valor.id > 0 &&
            "nome" in valor &&
            typeof valor.nome === "string" &&
            "descricao" in valor &&
            typeof valor.descricao === "string");
    }
    function ehUsuario(valor) {
        return (typeof valor === "object" &&
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
            typeof valor.cargo === "string");
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
    // Consulta uma API e verifica se a resposta foi bem-sucedida.
    const consultar = async (url) => {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        if (!resposta.ok) {
            throw new Error(obterMensagemErro(dados));
        }
        return dados;
    };
    // Preenche uma lista mostrando nomes e guardando IDs nos valores.
    const preencherLista = (select, itens, orientacao) => {
        select.replaceChildren();
        const opcaoInicial = document.createElement("option");
        opcaoInicial.value = "";
        opcaoInicial.textContent = orientacao;
        opcaoInicial.defaultSelected = true;
        select.appendChild(opcaoInicial);
        itens.forEach((item) => {
            const opcao = document.createElement("option");
            opcao.value = String(item.id);
            opcao.textContent = item.nome;
            select.appendChild(opcao);
        });
        select.value = "";
    };
    const definirBloqueio = (bloqueado) => {
        titulo.disabled = bloqueado;
        descricao.disabled = bloqueado;
        status.disabled = bloqueado;
        prioridade.disabled = bloqueado;
        projeto.disabled = bloqueado || !listasProntas;
        responsavel.disabled = bloqueado || !listasProntas;
        botao.disabled = bloqueado || !listasProntas;
    };
    // Preenche o formulário quando a URL informa uma tarefa.
    const carregarTarefaParaEdicao = async () => {
        if (tarefaEmEdicao === null) {
            return;
        }
        if (!Number.isInteger(tarefaEmEdicao) ||
            tarefaEmEdicao <= 0) {
            throw new Error("O ID da tarefa na URL é inválido.");
        }
        const dados = await consultar(`tarefas.php?id=${tarefaEmEdicao}`);
        if (typeof dados !== "object" ||
            dados === null ||
            !("id" in dados) ||
            dados.id !== tarefaEmEdicao ||
            !("titulo" in dados) ||
            typeof dados.titulo !== "string" ||
            !("descricao" in dados) ||
            typeof dados.descricao !== "string" ||
            !("status" in dados) ||
            typeof dados.status !== "string" ||
            !("prioridade" in dados) ||
            typeof dados.prioridade !== "string" ||
            !("projeto_id" in dados) ||
            !(dados.projeto_id === null ||
                (typeof dados.projeto_id === "number" &&
                    Number.isInteger(dados.projeto_id) &&
                    dados.projeto_id > 0)) ||
            !("usuario_id" in dados) ||
            !(dados.usuario_id === null ||
                (typeof dados.usuario_id === "number" &&
                    Number.isInteger(dados.usuario_id) &&
                    dados.usuario_id > 0))) {
            throw new Error("A API retornou uma tarefa em formato inválido.");
        }
        titulo.value = dados.titulo;
        descricao.value = dados.descricao;
        status.value = dados.status;
        prioridade.value = dados.prioridade;
        projeto.value = dados.projeto_id === null
            ? ""
            : String(dados.projeto_id);
        responsavel.value = dados.usuario_id === null
            ? ""
            : String(dados.usuario_id);
        botao.textContent = "Salvar alterações";
        document.title = "Kanban - Editar tarefa";
        const cabecalho = document.querySelector("h1");
        if (cabecalho instanceof HTMLHeadingElement) {
            cabecalho.textContent = "Editar tarefa";
        }
        if (!listasProntas) {
            mostrarMensagem("Cadastre pelo menos um projeto e um responsável e atualize a página.");
        }
        else if (projeto.value === "" || responsavel.value === "") {
            mostrarMensagem("Selecione um projeto e um responsável para completar os vínculos desta tarefa.");
        }
        else {
            mostrarMensagem("Altere os dados e clique em Salvar alterações.");
        }
    };
    const carregarListas = async () => {
        listasProntas = false;
        definirBloqueio(true);
        mostrarMensagem("Carregando projetos e responsáveis...");
        try {
            const [projetos, usuarios] = await Promise.all([
                consultar("projetos.php"),
                consultar("usuarios.php")
            ]);
            if (!Array.isArray(projetos) ||
                !projetos.every(ehProjeto)) {
                throw new Error("A lista de projetos está em formato inválido.");
            }
            if (!Array.isArray(usuarios) ||
                !usuarios.every(ehUsuario)) {
                throw new Error("A lista de responsáveis está em formato inválido.");
            }
            preencherLista(projeto, projetos, projetos.length === 0
                ? "Nenhum projeto cadastrado"
                : "Selecione o projeto");
            preencherLista(responsavel, usuarios, usuarios.length === 0
                ? "Nenhum responsável cadastrado"
                : "Selecione o responsável");
            listasProntas = projetos.length > 0 && usuarios.length > 0;
            mostrarMensagem(listasProntas
                ? ""
                : "Cadastre pelo menos um projeto e um responsável. Depois, atualize esta página.");
            // Depois de montar as opções, preenche a tarefa escolhida.
            await carregarTarefaParaEdicao();
        }
        catch (erro) {
            listasProntas = false;
            preencherLista(projeto, [], "Lista indisponível");
            preencherLista(responsavel, [], "Lista indisponível");
            const texto = erro instanceof Error
                ? erro.message
                : "Não foi possível carregar as opções.";
            mostrarMensagem(`${texto} Atualize a página para tentar novamente.`);
        }
        finally {
            definirBloqueio(false);
        }
    };
    const cadastrarTarefa = async (evento) => {
        evento.preventDefault();
        if (salvando || !listasProntas) {
            return;
        }
        // Valores de select são textos; o PHP espera IDs numéricos.
        const projetoId = Number(projeto.value);
        const usuarioId = Number(responsavel.value);
        if (!Number.isInteger(projetoId) ||
            projetoId <= 0 ||
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0) {
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
        if (!["A Fazer", "Em Andamento", "Concluída"].includes(tarefa.status) ||
            !["Alta", "Média", "Baixa"].includes(tarefa.prioridade)) {
            mostrarMensagem("Selecione um status e uma prioridade válidos.");
            return;
        }
        salvando = true;
        definirBloqueio(true);
        mostrarMensagem("Salvando tarefa...");
        try {
            const resposta = await fetch("tarefas.php", {
                method: tarefaEmEdicao === null ? "POST" : "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(tarefaEmEdicao === null
                    ? tarefa
                    : { ...tarefa, id: tarefaEmEdicao })
            });
            const dados = await resposta.json();
            if (!resposta.ok) {
                throw new Error(obterMensagemErro(dados));
            }
            if (tarefaEmEdicao === null) {
                formulario.reset();
                mostrarMensagem("Tarefa cadastrada com sucesso! Volte ao Kanban para visualizá-la.");
            }
            else {
                mostrarMensagem("Tarefa atualizada com sucesso! Volte ao Kanban para conferir.");
            }
        }
        catch (erro) {
            const texto = erro instanceof Error
                ? erro.message
                : "Não foi possível cadastrar a tarefa.";
            mostrarMensagem(texto);
        }
        finally {
            salvando = false;
            definirBloqueio(false);
        }
    };
    formulario.addEventListener("submit", cadastrarTarefa);
    void carregarListas();
}
iniciarPagina();
export {};
