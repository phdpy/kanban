export function atualizarIndicadores(tarefas) {
    // Acumula as quantidades enquanto percorre as tarefas.
    const indicadores = tarefas.reduce((acumulador, tarefa) => {
        acumulador.total += 1;
        if (tarefa.status === "A Fazer") {
            acumulador.aFazer += 1;
        }
        else if (tarefa.status === "Em Andamento") {
            acumulador.emAndamento += 1;
        }
        else if (tarefa.status === "Concluída") {
            acumulador.concluidas += 1;
        }
        return acumulador;
    }, {
        total: 0,
        aFazer: 0,
        emAndamento: 0,
        concluidas: 0
    });
    // Evita divisão por zero quando não existem tarefas.
    const percentual = indicadores.total === 0
        ? 0
        : Math.round((indicadores.concluidas / indicadores.total) * 100);
    const valores = {
        "indicador-total": String(indicadores.total),
        "indicador-a-fazer": String(indicadores.aFazer),
        "indicador-em-andamento": String(indicadores.emAndamento),
        "indicador-concluidas": String(indicadores.concluidas),
        "indicador-percentual": `${percentual}%`
    };
    // Atualiza somente os elementos encontrados na página.
    Object.entries(valores).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
        }
    });
}
