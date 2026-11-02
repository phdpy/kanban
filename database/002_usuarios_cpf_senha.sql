-- Atualização para bancos que já possuem a tabela usuarios.
-- Execute uma única vez, após importar o banco original.
-- Os campos permitem NULL para preservar usuários antigos.
-- O backend exige CPF e senha nos novos cadastros.

ALTER TABLE usuarios
    ADD COLUMN cpf CHAR(11) NULL,
    ADD COLUMN senha_hash VARCHAR(255) NULL,
    ADD CONSTRAINT uq_usuarios_cpf UNIQUE (cpf);