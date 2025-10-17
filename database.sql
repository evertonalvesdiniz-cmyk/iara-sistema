<artifact identifier="database-sql" type="application/vnd.ant.code" language="sql" title="database.sql">
-- Banco de Dados IARA Turismo
-- Execute este script no MySQL para criar todas as tabelas
CREATE DATABASE IF NOT EXISTS iara_turismo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iara_turismo;
-- Tabela de Clientes
CREATE TABLE clientes (
id INT AUTO_INCREMENT PRIMARY KEY,
nome VARCHAR(255) NOT NULL,
nascimento VARCHAR(10),
cpf VARCHAR(14),
rg VARCHAR(20),
passaporte VARCHAR(20),
validade VARCHAR(10),
email VARCHAR(255),
telefone VARCHAR(20),
enderecoCEP VARCHAR(10),
enderecoRua VARCHAR(255),
enderecoNumero VARCHAR(10),
enderecoComplemento VARCHAR(100),
enderecoBairro VARCHAR(100),
enderecoCidade VARCHAR(100),
enderecoEstado VARCHAR(2),
contatoEmergencial TEXT,
dataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
dataAtualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
INDEX idx_nome (nome),
INDEX idx_cpf (cpf)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Tabela de Fornecedores
CREATE TABLE fornecedores (
id INT AUTO_INCREMENT PRIMARY KEY,
nome VARCHAR(255) NOT NULL,
site VARCHAR(255),
contatos TEXT,
usuario VARCHAR(100) NOT NULL,
senha VARCHAR(255) NOT NULL,
emergencial VARCHAR(255),
link VARCHAR(255),
dataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
dataAtualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
INDEX idx_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Tabela de Vendas
CREATE TABLE vendas (
id INT AUTO_INCREMENT PRIMARY KEY,
numero VARCHAR(10) NOT NULL UNIQUE,
clienteId INT NOT NULL,
clienteNome VARCHAR(255),
totalValorCliente INT NOT NULL DEFAULT 0,
totalLucro INT NOT NULL DEFAULT 0,
dataCadastro DATE NOT NULL,
dataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
dataAtualizacao DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE RESTRICT,
INDEX idx_numero (numero),
INDEX idx_cliente (clienteId),
INDEX idx_data (dataCadastro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Tabela de Produtos da Venda
CREATE TABLE venda_produtos (
id INT AUTO_INCREMENT PRIMARY KEY,
vendaId INT NOT NULL,
produto VARCHAR(255) NOT NULL,
destino VARCHAR(50) DEFAULT 'Nacional',
dataEmbarque VARCHAR(10),
dataRetorno VARCHAR(10),
valor INT NOT NULL DEFAULT 0,
comissao INT DEFAULT 0,
taxa INT DEFAULT 0,
over INT DEFAULT 0,
lucro INT DEFAULT 0,
valorTotal INT DEFAULT 0,
intermediario VARCHAR(255),
dataEmissao VARCHAR(10),
fornecedor VARCHAR(255),
localizador VARCHAR(100),
FOREIGN KEY (vendaId) REFERENCES vendas(id) ON DELETE CASCADE,
INDEX idx_venda (vendaId),
INDEX idx_fornecedor (fornecedor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Tabela de Contas a Pagar
CREATE TABLE contas_pagar (
id INT AUTO_INCREMENT PRIMARY KEY,
credor VARCHAR(255) NOT NULL,
valor INT NOT NULL DEFAULT 0,
data DATE NOT NULL,
status VARCHAR(20) DEFAULT 'pendente',
origem VARCHAR(50) DEFAULT 'manual',
vendaNumero VARCHAR(10),
produtoNome VARCHAR(255),
localizador VARCHAR(100),
dataPagamento DATE,
dataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
INDEX idx_data (data),
INDEX idx_status (status),
INDEX idx_venda (vendaNumero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Tabela de Contas a Receber
CREATE TABLE contas_receber (
id INT AUTO_INCREMENT PRIMARY KEY,
tipo VARCHAR(20) DEFAULT 'venda',
vendaNumero VARCHAR(10),
vendaId INT,
devedor VARCHAR(255) NOT NULL,
devedorId INT,
valor INT NOT NULL DEFAULT 0,
lucroTotal INT DEFAULT 0,
data DATE NOT NULL,
status VARCHAR(20) DEFAULT 'pendente',
origem VARCHAR(50),
produtoNome VARCHAR(255),
localizador VARCHAR(100),
formaPagamento VARCHAR(20),
dataRecebimento DATE,
dataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
INDEX idx_data (data),
INDEX idx_status (status),
INDEX idx_venda (vendaNumero),
INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Tabela de Agenda
CREATE TABLE agenda (
id INT AUTO_INCREMENT PRIMARY KEY,
titulo VARCHAR(255) NOT NULL,
data DATE NOT NULL,
hora TIME,
prioridade VARCHAR(20) DEFAULT 'media',
descricao TEXT,
concluido BOOLEAN DEFAULT FALSE,
dataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
INDEX idx_data (data),
INDEX idx_concluido (concluido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Dados iniciais (opcional - você pode pular isso)
-- INSERT INTO clientes (nome, email) VALUES ('Cliente Teste', 'teste@example.com');
</artifact>
Passo 6: Criar o servidor (server.js)
Este é o arquivo mais importante - crie server.js:
<artifact identifier="server-js-simple" type="application/vnd.ant.code" language="javascript" title="server.js - Servidor Completo">
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;
// Configurações
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));
// Conexão com MySQL
const pool = mysql.createPool({
host: process.env.DB_HOST || 'localhost',
user: process.env.DB_USER || 'root',
password: process.env.DB_PASSWORD || '',
database: process.env.DB_NAME || 'iara_turismo',
waitForConnections: true,
connectionLimit: 10,
queueLimit: 0
});
// Teste de conexão
pool.getConnection()
.then(connection => {
console.log('✅ Conectado ao banco MySQL!');
connection.release();
})
.catch(err => {
console.error('❌ Erro ao conectar no banco:', err.message);
});
// ==================== CLIENTES ====================
app.get('/api/clientes', async (req, res) => {
try {
const [rows] = await pool.query('SELECT * FROM clientes ORDER BY id DESC');
res.json(rows);
} catch (error) {
console.error(error);
res.status(500).json({ error: 'Erro ao buscar clientes' });
}
});
app.get('/api/clientes/:id', async (req, res) => {
try {
const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
if (rows.length === 0) {
return res.status(404).json({ error: 'Cliente não encontrado' });
}
res.json(rows[0]);
} catch (error) {
res.status(500).json({ error: 'Erro ao buscar cliente' });
}
});
app.post('/api/clientes', async (req, res) => {
try {
const { nome, nascimento, cpf, rg, passaporte, validade, email, telefone,
enderecoCEP, enderecoRua, enderecoNumero, enderecoComplemento,
enderecoBairro, enderecoCidade, enderecoEstado, contatoEmergencial } = req.body;
    const [result] = await pool.query(
        `INSERT INTO clientes (nome, nascimento, cpf, rg, passaporte, validade, email, telefone,
         enderecoCEP, enderecoRua, enderecoNumero, enderecoComplemento, enderecoBairro, 
         enderecoCidade, enderecoEstado, contatoEmergencial) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nome, nascimento, cpf, rg, passaporte, validade, email, telefone,
         enderecoCEP, enderecoRua, enderecoNumero, enderecoComplemento, enderecoBairro,
         enderecoCidade, enderecoEstado, contatoEmergencial]
    );
    
    res.status(201).json({ 
        sucesso: true, 
        mensagem: 'Cliente adicionado com sucesso',
        id: result.insertId 
    });
} catch (error) {
    console.error(error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao adicionar cliente' });
}
});
app.put('/api/clientes/:id', async (req, res) => {
try {
const { nome, nascimento, cpf, rg, passaporte, validade, email, telefone,
enderecoCEP, enderecoRua, enderecoNumero, enderecoComplemento,
enderecoBairro, enderecoCidade, enderecoEstado, contatoEmergencial } = req.body;
    await pool.query(
        `UPDATE clientes SET nome=?, nascimento=?, cpf=?, rg=?, passaporte=?, validade=?,
         email=?, telefone=?, enderecoCEP=?, enderecoRua=?, enderecoNumero=?, 
         enderecoComplemento=?, enderecoBairro=?, enderecoCidade=?, enderecoEstado=?, 
         contatoEmergencial=? WHERE id=?`,
        [nome, nascimento, cpf, rg, passaporte, validade, email, telefone,
         enderecoCEP, enderecoRua, enderecoNumero, enderecoComplemento, enderecoBairro,
         enderecoCidade, enderecoEstado, contatoEmergencial, req.params.id]
    );
    
    res.json({ sucesso: true, mensagem: 'Cliente atualizado com sucesso' });
} catch (error) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar cliente' });
}
});
app.delete('/api/clientes/:id', async (req, res) => {
try {
await pool.query('DELETE FROM clientes WHERE id = ?', [req.params.id]);
res.json({ sucesso: true, mensagem: 'Cliente removido com sucesso' });
} catch (error) {
res.status(500).json({ sucesso: false, mensagem: 'Erro ao remover cliente' });
}
});
// ==================== FORNECEDORES ====================
app.get('/api/fornecedores', async (req, res) => {
try {
const [rows] = await pool.query('SELECT * FROM fornecedores ORDER BY id DESC');
res.json(rows);
} catch (error) {
res.status(500).json({ error: 'Erro ao buscar fornecedores' });
}
});
app.post('/api/fornecedores', async (req, res) => {
try {
const { nome, site, contatos, usuario, senha, emergencial, link } = req.body;
    const [result] = await pool.query(
        `INSERT INTO fornecedores (nome, site, contatos, usuario, senha, emergencial, link)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nome, site, contatos, usuario, senha, emergencial, link]
    );
    
    res.status(201).json({ 
        sucesso: true, 
        mensagem: 'Fornecedor adicionado com sucesso',
        id: result.insertId 
    });
} catch (error) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao adicionar fornecedor' });
}
});
app.put('/api/fornecedores/:id', async (req, res) => {
try {
const { nome, site, contatos, usuario, senha, emergencial, link } = req.body;
    await pool.query(
        `UPDATE fornecedores SET nome=?, site=?, contatos=?, usuario=?, senha=?, 
         emergencial=?, link=? WHERE id=?`,
        [nome, site, contatos, usuario, senha, emergencial, link, req.params.id]
    );
    
    res.json({ sucesso: true, mensagem: 'Fornecedor atualizado com sucesso' });
} catch (error) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar fornecedor' });
}
});
app.delete('/api/fornecedores/:id', async (req, res) => {
try {
await pool.query('DELETE FROM fornecedores WHERE id = ?', [req.params.id]);
res.json({ sucesso: true, mensagem: 'Fornecedor removido com sucesso' });
} catch (error) {
res.status(500).json({ sucesso: false, mensagem: 'Erro ao remover fornecedor' });
}
});
// ==================== AGENDA ====================
app.get('/api/agenda', async (req, res) => {
try {
const [rows] = await pool.query('SELECT * FROM agenda ORDER BY data, hora');
res.json(rows);
} catch (error) {
res.status(500).json({ error: 'Erro ao buscar agenda' });
}
});
app.post('/api/agenda', async (req, res) => {
try {
const { titulo, data, hora, prioridade, descricao } = req.body;
    const [result] = await pool.query(
        `INSERT INTO agenda (titulo, data, hora, prioridade, descricao, concluido)
         VALUES (?, ?, ?, ?, ?, FALSE)`,
        [titulo, data, hora, prioridade, descricao]
    );
    
    res.status(201).json({ 
        sucesso: true, 
        mensagem: 'Compromisso adicionado com sucesso',
        id: result.insertId 
    });
} catch (error) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao adicionar compromisso' });
}
});
app.put('/api/agenda/:id', async (req, res) => {
try {
const { titulo, data, hora, prioridade, descricao } = req.body;
    await pool.query(
        `UPDATE agenda SET titulo=?, data=?, hora=?, prioridade=?, descricao=? WHERE id=?`,
        [titulo, data, hora, prioridade, descricao, req.params.id]
    );
    
    res.json({ sucesso: true, mensagem: 'Compromisso atualizado com sucesso' });
} catch (error) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar compromisso' });
}
});
app.delete('/api/agenda/:id', async (req, res) => {
try {
await pool.query('DELETE FROM agenda WHERE id = ?', [req.params.id]);
res.json({ sucesso: true, mensagem: 'Compromisso removido com sucesso' });
} catch (error) {
res.status(500).json({ sucesso: false, mensagem: 'Erro ao remover compromisso' });
}
});
app.patch('/api/agenda/:id/concluir', async (req, res) => {
try {
await pool.query(
'UPDATE agenda SET concluido = NOT concluido WHERE id = ?',
[req.params.id]
);
res.json({ sucesso: true, mensagem: 'Status atualizado' });
} catch (error) {
res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar status' });
}
});
// Iniciar servidor
app.listen(PORT, () => {
console.log(🚀 Servidor rodando na porta ${PORT});
console.log(📍 Acesse: http://localhost:${PORT});
});
</artifact>