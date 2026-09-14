import type { Tarefa } from "./types";

// Recebe as tarefas e uma função que atualiza a tela.
export function configurarFiltros(
    tarefas: Tarefa[],
    atualizarTela: (tarefasFiltradas: Tarefa[]) => void
): void {
    const campoStatus = document.querySelector("#filtro-status");
    const campoPrioridade = document.querySelector("#filtro-prioridade");
    const botaoLimpar = document.querySelector("#limpar-filtros");
    const resumo = document.querySelector("#resumo-filtros");

    if (
        !(campoStatus instanceof HTMLSelectElement) ||
        !(campoPrioridade instanceof HTMLSelectElement) ||
        !(botaoLimpar instanceof HTMLButtonElement) ||
        !(resumo instanceof HTMLParagraphElement)
    ) {
        console.error("Não foi possível localizar os filtros.");

        // Mantém o quadro funcionando se o HTML dos filtros estiver ausente.
        atualizarTela(tarefas);
        return;
    }

    const aplicarFiltros = (): void => {
        // filter cria um novo array sem alterar as tarefas originais.
        const tarefasFiltradas = tarefas.filter((tarefa): boolean => {
            const correspondeStatus =
                campoStatus.value === "" ||
                tarefa.status === campoStatus.value;

            const correspondePrioridade =
                campoPrioridade.value === "" ||
                tarefa.prioridade === campoPrioridade.value;

            // A tarefa precisa atender aos dois filtros.
            return correspondeStatus && correspondePrioridade;
        });

        atualizarTela(tarefasFiltradas);

        resumo.textContent = tarefasFiltradas.length === 0
            ? "Nenhuma tarefa encontrada para esta seleção."
            : `Exibindo ${tarefasFiltradas.length} de ${tarefas.length} tarefas.`;
    };

    campoStatus.addEventListener("change", aplicarFiltros);
    campoPrioridade.addEventListener("change", aplicarFiltros);

    botaoLimpar.addEventListener("click", (): void => {
        campoStatus.value = "";
        campoPrioridade.value = "";

        aplicarFiltros();
    });

    aplicarFiltros();
}