const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Configurações
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Rota raiz
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Conexão com MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'iara_turismo',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000,
    ssl: isProduction ? { rejectUnauthorized: false } : false
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

app.get('/api/fornecedores/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM fornecedores WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar fornecedor' });
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

app.get('/api/agenda/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM agenda WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Compromisso não encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar compromisso' });
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
    console.log('🚀 Servidor rodando na porta', PORT);
    console.log('📍 Acesse: http://localhost:' + PORT);
});