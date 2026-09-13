import type { Usuario } from "./types";

function iniciarPagina(): void {
    const formulario = document.querySelector("#form-usuario");
    const campoNome = document.querySelector("#nome");
    const campoEmail = document.querySelector("#email");
    const campoCargo = document.querySelector("#cargo");
    const botao = document.querySelector("#botao-salvar");
    const botaoCancelar = document.querySelector("#botao-cancelar");
    const mensagem = document.querySelector("#mensagem");
    const lista = document.querySelector("#lista-usuarios");

    // Confere a existência e o tipo dos elementos.
    if (
        !(formulario instanceof HTMLFormElement) ||
        !(campoNome instanceof HTMLInputElement) ||
        !(campoEmail instanceof HTMLInputElement) ||
        !(campoCargo instanceof HTMLInputElement) ||
        !(botao instanceof HTMLButtonElement) ||
        !(botaoCancelar instanceof HTMLButtonElement) ||
        !(mensagem instanceof HTMLParagraphElement) ||
        !(lista instanceof HTMLUListElement)
    ) {
        console.error("Não foi possível localizar os elementos da página.");
        return;
    }

    // null representa um novo cadastro.
    let usuarioEmEdicao: number | null = null;

    // Impede operações simultâneas de cadastro, edição ou exclusão.
    let processando: boolean = false;

    const mostrarMensagem = (texto: string): void => {
        mensagem.textContent = texto;
    };

    // Bloqueia os controles enquanto uma operação está em andamento.
    const definirProcessamento = (ativo: boolean): void => {
        processando = ativo;

        botao.disabled = ativo;
        botaoCancelar.disabled = ativo;
        campoNome.disabled = ativo;
        campoEmail.disabled = ativo;
        campoCargo.disabled = ativo;

        lista.querySelectorAll("button").forEach((controle): void => {
            controle.disabled = ativo;
        });
    };

    // Verifica o formato dos usuários recebidos da API.
    function ehUsuario(valor: unknown): valor is Usuario {
        if (typeof valor !== "object" || valor === null) {
            return false;
        }

        return (
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

    // Devolve o formulário ao modo de cadastro.
    const limparFormulario = (): void => {
        usuarioEmEdicao = null;
        formulario.reset();

        botao.textContent = "Cadastrar";
        botaoCancelar.hidden = true;
    };

    // Preenche os campos com os dados do usuário escolhido.
    const iniciarEdicao = (usuario: Usuario): void => {
        if (processando) {
            return;
        }

        usuarioEmEdicao = usuario.id;

        campoNome.value = usuario.nome;
        campoEmail.value = usuario.email;
        campoCargo.value = usuario.cargo;

        botao.textContent = "Salvar alterações";
        botaoCancelar.hidden = false;

        mostrarMensagem(`Editando o usuário ${usuario.nome}.`);
        campoNome.focus();
    };

    // Cria os itens e os botões da listagem.
    const exibirUsuarios = (usuarios: Usuario[]): void => {
        lista.replaceChildren();

        if (usuarios.length === 0) {
            const item = document.createElement("li");

            item.textContent = "Nenhum usuário cadastrado.";
            lista.appendChild(item);
            return;
        }

        usuarios.forEach((usuario): void => {
            const item = document.createElement("li");
            const texto = document.createElement("span");
            const botaoEditar = document.createElement("button");
            const botaoExcluir = document.createElement("button");

            texto.textContent =
                `${usuario.nome} — ${usuario.email} — ${usuario.cargo} `;

            botaoEditar.type = "button";
            botaoEditar.classList.add("botao-editar");
            botaoEditar.disabled = processando;

            botaoEditar.setAttribute(
                "aria-label",
                `Editar usuário ${usuario.nome}`
            );

            botaoEditar.addEventListener("click", (): void => {
                iniciarEdicao(usuario);
            });

            botaoExcluir.type = "button";
            botaoExcluir.classList.add("botao-excluir");
            botaoExcluir.disabled = processando;

            botaoExcluir.setAttribute(
                "aria-label",
                `Excluir usuário ${usuario.nome}`
            );

            botaoExcluir.addEventListener("click", (): void => {
                void excluirUsuario(usuario);
            });

            item.append(texto, botaoEditar, " ", botaoExcluir);
            lista.appendChild(item);
        });
    };

    // GET: busca os usuários cadastrados.
    const carregarUsuarios = async (): Promise<void> => {
        lista.textContent = "Carregando usuários...";

        try {
            const resposta = await fetch("usuarios.php");
            const dados: unknown = await resposta.json();

            if (!resposta.ok) {
                throw new Error(obterMensagemErro(dados));
            }

            if (!Array.isArray(dados) || !dados.every(ehUsuario)) {
                throw new Error(
                    "A API retornou uma lista em formato inválido."
                );
            }

            exibirUsuarios(dados);

        } catch (erro: unknown) {
            lista.textContent =
                "Não foi possível carregar a lista. Atualize a página para tentar novamente.";

            console.error(erro);
        }
    };

    // DELETE: exclui somente após a confirmação.
    const excluirUsuario = async (
        usuario: Usuario
    ): Promise<void> => {
        if (processando) {
            return;
        }

        const confirmou = window.confirm(
            `Deseja excluir o usuário "${usuario.nome}"? ` +
            "Essa ação não pode ser desfeita."
        );

        if (!confirmou) {
            return;
        }

        definirProcessamento(true);
        mostrarMensagem("Excluindo usuário...");

        try {
            const resposta = await fetch("usuarios.php", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: usuario.id })
            });

            const dados: unknown = await resposta.json();

            if (!resposta.ok) {
                throw new Error(obterMensagemErro(dados));
            }

            // Evita continuar editando um usuário que foi excluído.
            if (usuarioEmEdicao === usuario.id) {
                limparFormulario();
            }

            mostrarMensagem("Usuário excluído com sucesso.");
            await carregarUsuarios();

        } catch (erro: unknown) {
            const texto = erro instanceof Error
                ? erro.message
                : "Não foi possível excluir o usuário.";

            mostrarMensagem(texto);

        } finally {
            definirProcessamento(false);
        }
    };

    // POST cadastra; PUT atualiza o usuário selecionado.
    const salvarUsuario = async (
        evento: SubmitEvent
    ): Promise<void> => {
        evento.preventDefault();

        if (processando) {
            return;
        }

        const usuario = {
            nome: campoNome.value.trim(),
            email: campoEmail.value.trim(),
            cargo: campoCargo.value.trim()
        };

        if (
            usuario.nome === "" ||
            usuario.email === "" ||
            usuario.cargo === ""
        ) {
            mostrarMensagem("Preencha todos os campos.");
            return;
        }

        const editando = usuarioEmEdicao !== null;

        const dadosEnvio = editando
            ? { ...usuario, id: usuarioEmEdicao }
            : usuario;

        definirProcessamento(true);
        mostrarMensagem("Salvando usuário...");

        try {
            const resposta = await fetch("usuarios.php", {
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
                    ? "Usuário atualizado com sucesso."
                    : "Usuário cadastrado com sucesso."
            );

            await carregarUsuarios();

        } catch (erro: unknown) {
            const texto = erro instanceof Error
                ? erro.message
                : "Não foi possível salvar o usuário.";

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

    formulario.addEventListener("submit", salvarUsuario);

    // Inicia a página.
    definirProcessamento(false);
    void carregarUsuarios();
}

iniciarPagina();