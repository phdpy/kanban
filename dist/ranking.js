// Conta por ID para não misturar usuários com nomes iguais.
export function calcularRanking(tarefas) {
    const contagens = new Map();
    tarefas.forEach((tarefa) => {
        const id = tarefa.usuario_id;
        // Tarefas antigas sem vínculo ficam fora do ranking.
        if (id === null) {
            return;
        }
        const existente = contagens.get(id);
        if (existente) {
            existente.quantidade += 1;
        }
        else {
            contagens.set(id, {
                id,
                nome: tarefa.responsavel,
                quantidade: 1
            });
        }
    });
    // Maior quantidade primeiro.
    // Em caso de empate, ordena por nome e depois por ID.
    const ordenados = Array.from(contagens.values()).sort((a, b) => {
        return b.quantidade - a.quantidade ||
            a.nome.localeCompare(b.nome, "pt-BR") ||
            a.id - b.id;
    });
    // map prepara os dados para apresentação.
    return ordenados.map((usuario) => ({
        ...usuario,
        textoQuantidade: usuario.quantidade === 1
            ? "1 tarefa"
            : `${usuario.quantidade} tarefas`
    }));
}
// Mostra o ranking na página.
export function atualizarRanking(tarefas) {
    const lista = document.querySelector("#ranking-responsaveis");
    const aviso = document.querySelector("#aviso-ranking");
    if (!(lista instanceof HTMLUListElement) ||
        !(aviso instanceof HTMLParagraphElement)) {
        return;
    }
    const ranking = calcularRanking(tarefas);
    const semVinculo = tarefas.filter((tarefa) => tarefa.usuario_id === null).length;
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
    ranking.forEach((usuario) => {
        const item = document.createElement("li");
        const nome = document.createElement("span");
        const quantidade = document.createElement("strong");
        nome.textContent = `${usuario.nome} (ID ${usuario.id})`;
        quantidade.textContent = usuario.textoQuantidade;
        item.append(nome, quantidade);
        lista.appendChild(item);
    });
}
