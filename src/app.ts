//Esse arquivo app.ts é o arquivo principal do Kanban, que vai carregar as tarefas da
//API e exibir na tela.
//1. Buscar tarefas
//2. Criar cards
//3. Colocar os cards nas colunas
//4. Iniciar a aplicação
import type { Tarefa } from "./types";
//// aqui eu estou importando as definicoes de taredas from .types.ts
async function carregarTarefas(): Promise<Tarefa[]> {
//o Async significa que essa funcao trabalha de forma assincrona, ou seja,
//  ela nao bloqueia a execucao do codigo enquanto espera a resposta da API.
//nesse caso a requisicao http precisa pedir dados ao servidor e esperar a resposta
// o Promise<Tarefa[]> essa funcao basicamente promete que quando terminar, ela vai retornar um
//array de tarefas
    try {
        const resposta = await fetch("api.php");
//const resposta = await fetch("api.php");
//significa "espera a resposta do servidor antes de continuar, sem o await, 
// o codigo continuaria a ser executado mesmo sem a resposta do servidor"  
//app.ts
//  ↓
//fetch()
//   ↓
//api.php
//o servidor faz uma req para o http://kanban.local/api.php
        if (!resposta.ok) {
            throw new Error("Erro ao consultar a API.");
//Verifica a resposta, se o server retornar um erro http vai ser o 404 ou o 500,
//  e nesse caso a resposta.ok vai ser false, e o throw new Error vai lançar um erro
//o throw new Error("Erro ao consultar a API."); significa 
// que se a resposta do servidor for diferente de 200, ou seja, 
// se o servidor retornar um erro http vai ser o 404 ou o 500, 
// e nesse caso a resposta.ok vai ser false, e o throw new Error vai lançar um erro
//Interrompa o fluxo normal e trate isso como um erro.
        }

        const tarefas: Tarefa[] = await resposta.json();
//const tarefas: Tarefa[] = await resposta.json(); converte Json em array de objetos 
// do tipo Tarefa
//resposta.json() transforma o json em objetos para o JavaScript
// o : Tarefa[] informa ao TypeScript qual estrutura esperamos.
        return tarefas;

    } catch (erro) {
        console.error("Erro ao carregar tarefas:", erro);

        return [];

//API indisponível
//PHP com erro
//problema de rede
//se a aplicaçao quebrar, ele nao quebra diretamente, ele retorna um array vazio.
// assim eu cumpro os req da rubrica 
//fetch
//async/await
//try/catch
    }
}
function criarCard(tarefa: Tarefa): HTMLDivElement {
//Recebe uma tarefa e devolve uma div HTML.
    const card = document.createElement("div");
//O navegador cria:
//<div></div>
    card.classList.add("card-tarefa");
//Agora o CSS consegue estilizar esse elemento.
//nos If a baixo serve pra definir a cor da borda do card de acordo com a prioridade da 
// tarefa.
    if (tarefa.prioridade === "Alta") {
        card.classList.add("prioridade-alta");

    } else if (tarefa.prioridade === "Média") {
        card.classList.add("prioridade-media");

    } else if (tarefa.prioridade === "Baixa") {
        card.classList.add("prioridade-baixa");
    }

    card.innerHTML = `
        <h3>${tarefa.titulo}</h3>
        <p>${tarefa.descricao}</p>
        <p><strong>Prioridade:</strong> ${tarefa.prioridade}</p>
        <p><strong>Responsável:</strong> ${tarefa.responsavel}</p>
    `;
    const botaoExcluir = document.createElement("button");

botaoExcluir.type = "button";
botaoExcluir.textContent = "Excluir";
botaoExcluir.classList.add("excluir-tarefa");

botaoExcluir.setAttribute(
    "aria-label",
    `Excluir tarefa ${tarefa.titulo}`
);

botaoExcluir.addEventListener("click", (): void => {
    void excluirTarefa(tarefa, botaoExcluir);
});

const linkEditar = document.createElement("a");

linkEditar.textContent = "Editar";
linkEditar.href = `tarefas.html?id=${encodeURIComponent(String(tarefa.id))}`;
linkEditar.classList.add("editar-tarefa");

linkEditar.setAttribute(
    "aria-label",
    `Editar tarefa ${tarefa.titulo}`
);

const acoes = document.createElement("div");
acoes.classList.add("acoes-tarefa");

acoes.append(linkEditar, botaoExcluir);
card.appendChild(acoes);

    return card;
}

function exibirMensagemSemTarefas(): void {

    const mensagem = document.createElement("p");

    mensagem.classList.add("sem-tarefas");

    mensagem.textContent = "Nenhuma tarefa cadastrada.";

    const colunas = document.querySelectorAll(".lista-tarefas");

    colunas.forEach((coluna) => {
        coluna.appendChild(mensagem.cloneNode(true));
    });
}

function exibirTarefas(tarefas: Tarefa[]): void {
//Aqui estamos selecionando as colunas do Kanban pelo id, e verificando se elas existem.
//  Se não existirem, retornamos da função.
    const colunaAFazer = document.querySelector("#a-fazer");
    const colunaEmAndamento = document.querySelector("#em-andamento");
    const colunaConcluida = document.querySelector("#concluida");

    if (
        !colunaAFazer ||
        !colunaEmAndamento ||
        !colunaConcluida
    ) {
        return;
    }

    colunaAFazer.innerHTML = "";
    colunaEmAndamento.innerHTML = "";
    colunaConcluida.innerHTML = "";

    if (tarefas.length === 0) {
        exibirMensagemSemTarefas();
        return;
    }

    tarefas.forEach((tarefa) => {

        const card = criarCard(tarefa);

        if (tarefa.status === "A Fazer") {
            colunaAFazer.appendChild(card);

        } else if (tarefa.status === "Em Andamento") {
            colunaEmAndamento.appendChild(card);

        } else if (tarefa.status === "Concluída") {
            colunaConcluida.appendChild(card);
        }
//Recebe uma tarefa e devolve uma div HTML.
    });
}

async function iniciarAplicacao(): Promise<void> {

    const tarefas = await carregarTarefas();

    exibirTarefas(tarefas);
}
// Exclui uma tarefa somente após a confirmação do usuário.
async function excluirTarefa(
    tarefa: Tarefa,
    botao: HTMLButtonElement
): Promise<void> {
    if (botao.disabled) {
        return;
    }

    const confirmou = window.confirm(
        `Deseja excluir a tarefa "${tarefa.titulo}"? ` +
        "Essa ação não pode ser desfeita."
    );

    if (!confirmou) {
        return;
    }

    // Garante um ID numérico, mesmo que a API o envie como texto.
    const id = Number(tarefa.id);

    if (!Number.isInteger(id) || id <= 0) {
        window.alert("O ID da tarefa está inválido. Atualize a página.");
        return;
    }

    botao.disabled = true;
    botao.textContent = "Excluindo...";

    try {
        const resposta = await fetch("tarefas.php", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ id })
        });

        const dados: unknown = await resposta.json();

        if (!resposta.ok) {
            let texto = "Não foi possível excluir a tarefa.";

            if (
                typeof dados === "object" &&
                dados !== null &&
                "erro" in dados &&
                typeof dados.erro === "string"
            ) {
                texto = dados.erro;
            }

            throw new Error(texto);
        }

        window.alert("Tarefa excluída com sucesso.");

        // Recarrega o quadro para consultar as tarefas restantes.
        window.location.reload();

    } catch (erro: unknown) {
        const texto = erro instanceof Error
            ? erro.message
            : "Não foi possível excluir a tarefa.";

        window.alert(texto);

        botao.disabled = false;
        botao.textContent = "Excluir";
    }
}
iniciarAplicacao();