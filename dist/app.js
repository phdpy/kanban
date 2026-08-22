//Esse arquivo app.ts é o arquivo principal do Kanban, que vai carregar as tarefas da
//API e exibir na tela.


async function carregarTarefas() {
    try {
        const resposta = await fetch("api.php");
        if (!resposta.ok) {
            throw new Error("Erro ao consultar a API.");
        }
        const tarefas = await resposta.json();
        return tarefas;
    }
    catch (erro) {
        console.error("Erro ao carregar tarefas:", erro);
        return [];
    }
}
function criarCard(tarefa) {
    const card = document.createElement("div");
    card.classList.add("card-tarefa");
    if (tarefa.prioridade === "Alta") {
        card.classList.add("prioridade-alta");
    }
    else if (tarefa.prioridade === "Média") {
        card.classList.add("prioridade-media");
    }
    else if (tarefa.prioridade === "Baixa") {
        card.classList.add("prioridade-baixa");
    }
    card.innerHTML = `
        <h3>${tarefa.titulo}</h3>
        <p>${tarefa.descricao}</p>
        <p><strong>Prioridade:</strong> ${tarefa.prioridade}</p>
        <p><strong>Responsável:</strong> ${tarefa.responsavel}</p>
    `;
    return card;
}
function exibirMensagemSemTarefas() {
    const mensagem = document.createElement("p");
    mensagem.classList.add("sem-tarefas");
    mensagem.textContent = "Nenhuma tarefa cadastrada.";
    const colunas = document.querySelectorAll(".lista-tarefas");
    colunas.forEach((coluna) => {
        coluna.appendChild(mensagem.cloneNode(true));
    });
}
function exibirTarefas(tarefas) {
    const colunaAFazer = document.querySelector("#a-fazer");
    const colunaEmAndamento = document.querySelector("#em-andamento");
    const colunaConcluida = document.querySelector("#concluida");
    if (!colunaAFazer ||
        !colunaEmAndamento ||
        !colunaConcluida) {
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
        }
        else if (tarefa.status === "Em Andamento") {
            colunaEmAndamento.appendChild(card);
        }
        else if (tarefa.status === "Concluída") {
            colunaConcluida.appendChild(card);
        }
    });
}
async function iniciarAplicacao() {
    const tarefas = await carregarTarefas();
    exibirTarefas(tarefas);
}
iniciarAplicacao();
export {};
