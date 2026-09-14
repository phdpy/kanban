import type { Tarefa } from "./types";

type Contagem = {
    id: number;
    nome: string;
    quantidade: number;
};

type LinhaRanking = Contagem & {
    textoQuantidade: string;
};

// Conta por ID para não misturar usuários com nomes iguais.
export function calcularRanking(tarefas: Tarefa[]): LinhaRanking[] {
    const contagens = new Map<number, Contagem>();

    tarefas.forEach((tarefa): void => {
        const id = tarefa.usuario_id;

        // Tarefas antigas sem vínculo ficam fora do ranking.
        if (id === null) {
            return;
        }

        const existente = contagens.get(id);

        if (existente) {
            existente.quantidade += 1;
        } else {
            contagens.set(id, {
                id,
                nome: tarefa.responsavel,
                quantidade: 1
            });
        }
    });

    // Maior quantidade primeiro.
    // Em caso de empate, ordena por nome e depois por ID.
    const ordenados = Array.from(contagens.values()).sort(
        (a, b): number => {
            return b.quantidade - a.quantidade ||
                a.nome.localeCompare(b.nome, "pt-BR") ||
                a.id - b.id;
        }
    );

    // map prepara os dados para apresentação.
    return ordenados.map((usuario): LinhaRanking => ({
        ...usuario,
        textoQuantidade: usuario.quantidade === 1
            ? "1 tarefa"
            : `${usuario.quantidade} tarefas`
    }));
}

// Mostra o ranking na página.
export function atualizarRanking(tarefas: Tarefa[]): void {
    const lista = document.querySelector("#ranking-responsaveis");
    const aviso = document.querySelector("#aviso-ranking");

    if (
        !(lista instanceof HTMLUListElement) ||
        !(aviso instanceof HTMLParagraphElement)
    ) {
        return;
    }

    const ranking = calcularRanking(tarefas);

    const semVinculo = tarefas.filter(
        (tarefa): boolean => tarefa.usuario_id === null
    ).length;

    lista.replaceChildren();

    aviso.textContent = semVinculo > 0
        ? `${semVinculo} tarefa(s) sem responsável vinculado não entram neste ranking.`
        : "";

    if (ranking.length === 0) {
        const item = document.createElement("li");

        item.textContent =
            "Nenhuma tarefa com responsável vinculado nesta seleção.";

        lista.appendChild(item);
        return;
    }

    ranking.forEach((usuario): void => {
        const item = document.createElement("li");
        const nome = document.createElement("span");
        const quantidade = document.createElement("strong");

        nome.textContent = `${usuario.nome} (ID ${usuario.id})`;
        quantidade.textContent = usuario.textoQuantidade;

        item.append(nome, quantidade);
        lista.appendChild(item);
    });
}