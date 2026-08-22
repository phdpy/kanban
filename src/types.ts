export type Tarefa = {
    id: number;
    titulo: string;
    descricao: string;
    status: string;
    prioridade: string;
    responsavel: string;
};
//Aqui estamos definindo o tipo Tarefa, que vai ser usado para tipar as tarefas do Kanban.
//Essa interface tarefas apresenta os dados que vem da API
//Se eu jogar um const tarefas : Tarefa []
//Significa que tarefa é um array de objetos do tipo Tarefa, 
// e cada objeto do array vai ter as propriedades id, titulo, descricao, status, prioridad
// e e responsavel.