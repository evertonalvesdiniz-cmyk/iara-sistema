// db-fornecedores.js - Banco de dados local para Fornecedores
// Versão refatorada e limpa (removida duplicação)

const DB_FORNECEDORES = {
    STORAGE_KEY: "dbFornecedores_v2",
    
    /**
     * Carrega fornecedores do localStorage
     * @returns {Array} Array de fornecedores
     */
    carregar() {
        try {
            const dados = localStorage.getItem(this.STORAGE_KEY);
            return dados ? JSON.parse(dados) : [];
        } catch (erro) {
            console.error("Erro ao carregar fornecedores:", erro);
            return [];
        }
    },
    
    /**
     * Salva fornecedores no localStorage
     * @param {Array} fornecedores - Array de fornecedores
     * @returns {boolean} True se salvou com sucesso
     */
    salvar(fornecedores) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(fornecedores));
            return true;
        } catch (erro) {
            console.error("Erro ao salvar fornecedores:", erro);
            return false;
        }
    },
    
    /**
     * Retorna todos os fornecedores
     * @returns {Array} Array de fornecedores
     */
    listarTodos() {
        return this.carregar();
    },
    
    /**
     * Adiciona novo fornecedor
     * @param {Object} fornecedor - Dados do fornecedor
     * @returns {Object} { sucesso: boolean, mensagem: string, indice: number }
     */
    adicionar(fornecedor) {
        const fornecedores = this.carregar();
        
        // Validação básica
        if (!fornecedor.nome || !fornecedor.nome.trim()) {
            return { sucesso: false, mensagem: "Nome do fornecedor é obrigatório" };
        }
        
        if (!fornecedor.usuario || !fornecedor.usuario.trim()) {
            return { sucesso: false, mensagem: "Usuário de login é obrigatório" };
        }
        
        if (!fornecedor.senha || !fornecedor.senha.trim()) {
            return { sucesso: false, mensagem: "Senha é obrigatória" };
        }
        
        // Adiciona timestamp
        fornecedor.dataCriacao = new Date().toISOString();
        fornecedor.dataAtualizacao = new Date().toISOString();
        
        // Gera ID único
        fornecedor.id = this.gerarId();
        
        fornecedores.push(fornecedor);
        
        if (this.salvar(fornecedores)) {
            return { 
                sucesso: true, 
                mensagem: "Fornecedor adicionado com sucesso",
                indice: fornecedores.length - 1
            };
        }
        
        return { sucesso: false, mensagem: "Erro ao salvar fornecedor" };
    },
    
    /**
     * Busca fornecedor por índice
     * @param {number} indice - Índice do fornecedor
     * @returns {Object|null} Fornecedor encontrado ou null
     */
    buscarPorIndice(indice) {
        const fornecedores = this.carregar();
        return fornecedores[indice] || null;
    },
    
    /**
     * Busca fornecedor por ID
     * @param {string} id - ID do fornecedor
     * @returns {Object|null} Fornecedor encontrado ou null
     */
    buscarPorId(id) {
        const fornecedores = this.carregar();
        return fornecedores.find(f => f.id === id) || null;
    },
    
    /**
     * Busca fornecedores por campo específico
     * @param {string} campo - Nome do campo (nome, site, usuario, etc)
     * @param {string} valor - Valor a buscar
     * @returns {Array} Array de fornecedores encontrados com seus índices
     */
    buscar(campo, valor) {
        if (!valor || !valor.trim()) return [];
        
        const fornecedores = this.carregar();
        const valorBusca = valor.toLowerCase().trim();
        
        return fornecedores
            .map((fornecedor, indice) => ({ ...fornecedor, indice }))
            .filter(fornecedor => {
                const valorCampo = (fornecedor[campo] || "").toLowerCase();
                return valorCampo.includes(valorBusca);
            });
    },
    
    /**
     * Atualiza fornecedor existente
     * @param {number} indice - Índice do fornecedor
     * @param {Object} dadosAtualizados - Novos dados
     * @returns {Object} { sucesso: boolean, mensagem: string }
     */
    atualizar(indice, dadosAtualizados) {
        const fornecedores = this.carregar();
        
        if (indice < 0 || indice >= fornecedores.length) {
            return { sucesso: false, mensagem: "Fornecedor não encontrado" };
        }
        
        // Validação
        if (!dadosAtualizados.nome || !dadosAtualizados.nome.trim()) {
            return { sucesso: false, mensagem: "Nome do fornecedor é obrigatório" };
        }
        
        if (!dadosAtualizados.usuario || !dadosAtualizados.usuario.trim()) {
            return { sucesso: false, mensagem: "Usuário de login é obrigatório" };
        }
        
        if (!dadosAtualizados.senha || !dadosAtualizados.senha.trim()) {
            return { sucesso: false, mensagem: "Senha é obrigatória" };
        }
        
        // Mantém dados originais
        dadosAtualizados.id = fornecedores[indice].id;
        dadosAtualizados.dataCriacao = fornecedores[indice].dataCriacao;
        dadosAtualizados.dataAtualizacao = new Date().toISOString();
        
        fornecedores[indice] = dadosAtualizados;
        
        if (this.salvar(fornecedores)) {
            return { sucesso: true, mensagem: "Fornecedor atualizado com sucesso" };
        }
        
        return { sucesso: false, mensagem: "Erro ao atualizar fornecedor" };
    },
    
    /**
     * Remove fornecedor
     * @param {number} indice - Índice do fornecedor
     * @returns {Object} { sucesso: boolean, mensagem: string }
     */
    remover(indice) {
        const fornecedores = this.carregar();
        
        if (indice < 0 || indice >= fornecedores.length) {
            return { sucesso: false, mensagem: "Fornecedor não encontrado" };
        }
        
        fornecedores.splice(indice, 1);
        
        if (this.salvar(fornecedores)) {
            return { sucesso: true, mensagem: "Fornecedor removido com sucesso" };
        }
        
        return { sucesso: false, mensagem: "Erro ao remover fornecedor" };
    },
    
    /**
     * Valida dados do fornecedor
     * @param {Object} fornecedor - Dados do fornecedor
     * @returns {Object} { valido: boolean, erros: Array }
     */
    validar(fornecedor) {
        const erros = [];
        
        if (!fornecedor.nome || !fornecedor.nome.trim()) {
            erros.push("Nome do fornecedor é obrigatório");
        }
        
        if (!fornecedor.usuario || !fornecedor.usuario.trim()) {
            erros.push("Usuário de login é obrigatório");
        }
        
        if (!fornecedor.senha || !fornecedor.senha.trim()) {
            erros.push("Senha é obrigatória");
        }
        
        return {
            valido: erros.length === 0,
            erros
        };
    },
    
    /**
     * Gera ID único para fornecedor
     * @returns {string} ID único
     */
    gerarId() {
        return 'forn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    /**
     * Exporta todos os fornecedores para backup
     * @returns {string} JSON string dos fornecedores
     */
    exportar() {
        const fornecedores = this.carregar();
        return JSON.stringify(fornecedores, null, 2);
    },
    
    /**
     * Importa fornecedores de backup
     * @param {string} jsonString - JSON string dos fornecedores
     * @returns {Object} { sucesso: boolean, mensagem: string }
     */
    importar(jsonString) {
        try {
            const fornecedores = JSON.parse(jsonString);
            
            if (!Array.isArray(fornecedores)) {
                return { sucesso: false, mensagem: "Formato inválido" };
            }
            
            if (this.salvar(fornecedores)) {
                return { 
                    sucesso: true, 
                    mensagem: `${fornecedores.length} fornecedor(es) importado(s) com sucesso` 
                };
            }
            
            return { sucesso: false, mensagem: "Erro ao importar" };
        } catch (erro) {
            return { sucesso: false, mensagem: "Arquivo inválido" };
        }
    },
    
    /**
     * Limpa todos os fornecedores
     * @returns {boolean} True se limpou com sucesso
     */
    limparTudo() {
        return this.salvar([]);
    }
};

// Mantém compatibilidade com código antigo
let dbFornecedores = {
    fornecedores: DB_FORNECEDORES.carregar()
};

function salvarDBFornecedores() {
    DB_FORNECEDORES.salvar(dbFornecedores.fornecedores);
}

function getFornecedores() {
    return DB_FORNECEDORES.listarTodos();
}

function addFornecedor(f) {
    const resultado = DB_FORNECEDORES.adicionar(f);
    if (resultado.sucesso) {
        dbFornecedores.fornecedores = DB_FORNECEDORES.carregar();
    }
    return resultado;
}

function updateFornecedor(index, f) {
    const resultado = DB_FORNECEDORES.atualizar(index, f);
    if (resultado.sucesso) {
        dbFornecedores.fornecedores = DB_FORNECEDORES.carregar();
    }
    return resultado;
}

function deleteFornecedor(index) {
    const resultado = DB_FORNECEDORES.remover(index);
    if (resultado.sucesso) {
        dbFornecedores.fornecedores = DB_FORNECEDORES.carregar();
    }
    return resultado;
}

console.log("✓ db-fornecedores.js carregado");