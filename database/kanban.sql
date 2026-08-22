-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Tempo de geração: 22/08/2026 às 23:56
-- Versão do servidor: 10.4.28-MariaDB
-- Versão do PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `kanban`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `tarefas`
--

CREATE TABLE `tarefas` (
  `id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descricao` text DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `prioridade` varchar(20) NOT NULL,
  `responsavel` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `tarefas`
--

INSERT INTO `tarefas` (`id`, `titulo`, `descricao`, `status`, `prioridade`, `responsavel`) VALUES
(1, 'Criar banco de dados', 'Criar a estrutura inicial do banco Kanban', 'Concluída', 'Alta', 'Paulo'),
(2, 'Criar API PHP', 'Desenvolver a API para retornar as tarefas em JSON', 'Em Andamento', 'Alta', 'Paulo'),
(3, 'Criar interface', 'Criar a dashboard inicial do sistema', 'A Fazer', 'Média', 'Paulo'),
(4, 'Configurar TypeScript', 'Configurar a compilação de TypeScript para JavaScript', 'Concluída', 'Média', 'Paulo'),
(5, 'Renderizar Kanban', 'Exibir as tarefas nas colunas do Kanban', 'A Fazer', 'Alta', 'Paulo'),
(6, 'Testar API', 'Verificar se os dados chegam corretamente ao TypeScript', 'A Fazer', 'Baixa', 'Paulo');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `tarefas`
--
ALTER TABLE `tarefas`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `tarefas`
--
ALTER TABLE `tarefas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
