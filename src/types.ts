// Dados de uma tarefa recebida pela API do quadro.
export type Tarefa = {
    id: number;
    titulo: string;
    descricao: string;
    status: string;
    prioridade: string;
    responsavel: string;

    // Tarefas antigas podem ainda não ter esses vínculos.
    projeto_id: number | null;
    usuario_id: number | null;
};

// Dados de um usuário.
export type Usuario = {
    id: number;
    nome: string;
    email: string;
    cargo: string;
};

// Dados de um projeto.
export type Projeto = {
    id: number;
    nome: string;
    descricao: string;
};