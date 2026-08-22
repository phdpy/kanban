import type { Tarefa } from "./types";

async function carregarTarefas(): Promise<Tarefa[]> {
    try {
        const resposta = await fetch("api.php");

        if (!resposta.ok) {
            throw new Error("Erro ao consultar a API.");
        }

        const tarefas: Tarefa[] = await resposta.json();

        return tarefas;

    } catch (erro) {
        console.error("Erro ao carregar tarefas:", erro);

        return [];
    }
}

function criarCard(tarefa: Tarefa): HTMLDivElement {

    const card = document.createElement("div");

    card.classList.add("card-tarefa");

    card.innerHTML = `
        <h3>${tarefa.titulo}</h3>
        <p>${tarefa.descricao}</p>
        <p><strong>Prioridade:</strong> ${tarefa.prioridade}</p>
        <p><strong>Responsável:</strong> ${tarefa.responsavel}</p>
    `;
if (tarefa.prioridade === "Alta") {
    card.classList.add("prioridade-alta");
} else if (tarefa.prioridade === "Média") {
    card.classList.add("prioridade-media");
} else if (tarefa.prioridade === "Baixa") {
    card.classList.add("prioridade-baixa");
}
    return card;
}

function exibirTarefas(tarefas: Tarefa[]): void {

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

    tarefas.forEach((tarefa) => {

        const card = criarCard(tarefa);

        if (tarefa.status === "A Fazer") {
            colunaAFazer.appendChild(card);
        }

        else if (tarefa.status === "Em Andamento") {
            colunaEmAndamento.appendChild(card);
        }

        else if (tarefa.status === "Concluída") {
            colunaConcluida.appendChild(card);
        }

    });
}

async function iniciarAplicacao(): Promise<void> {

    const tarefas = await carregarTarefas();

    exibirTarefas(tarefas);
}

iniciarAplicacao();

