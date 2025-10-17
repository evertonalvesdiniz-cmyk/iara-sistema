// db-clientes.js - Banco de dados local para Clientes
// Versão refatorada e limpa

const DB_CLIENTES = {
    STORAGE_KEY: "dbClientes_v2",
    
    /**
     * Carrega clientes do localStorage
     * @returns {Array} Array de clientes
     */
    carregar() {
        try {
            const dados = localStorage.getItem(this.STORAGE_KEY);
            return dados ? JSON.parse(dados) : [];
        } catch (erro) {
            console.error("Erro ao carregar clientes:", erro);
            return [];
        }
    },
    
    /**
     * Salva clientes no localStorage
     * @param {Array} clientes - Array de clientes
     * @returns {boolean} True se salvou com sucesso
     */
    salvar(clientes) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(clientes));
            return true;
        } catch (erro) {
            console.error("Erro ao salvar clientes:", erro);
            return false;
        }
    },
    
    /**
     * Retorna todos os clientes
     * @returns {Array} Array de clientes
     */
    listarTodos() {
        return this.carregar();
    },
    
    /**
     * Adiciona novo cliente
     * @param {Object} cliente - Dados do cliente
     * @returns {Object} { sucesso: boolean, mensagem: string, indice: number }
     */
    adicionar(cliente) {
        const clientes = this.carregar();
        
        // Validação básica
        if (!cliente.nome || !cliente.nome.trim()) {
            return { sucesso: false, mensagem: "Nome é obrigatório" };
        }
        
        // Adiciona timestamp de criação
        cliente.dataCriacao = new Date().toISOString();
        cliente.dataAtualizacao = new Date().toISOString();
        
        clientes.push(cliente);
        
        if (this.salvar(clientes)) {
            return { 
                sucesso: true, 
                mensagem: "Cliente adicionado com sucesso",
                indice: clientes.length - 1
            };
        }
        
        return { sucesso: false, mensagem: "Erro ao salvar cliente" };
    },
    
    /**
     * Busca cliente por índice
     * @param {number} indice - Índice do cliente
     * @returns {Object|null} Cliente encontrado ou null
     */
    buscarPorIndice(indice) {
        const clientes = this.carregar();
        return clientes[indice] || null;
    },
    
    /**
     * Busca clientes por campo específico
     * @param {string} campo - Nome do campo (nome, cpf, email, etc)
     * @param {string} valor - Valor a buscar
     * @returns {Array} Array de clientes encontrados com seus índices
     */
    buscar(campo, valor) {
        if (!valor || !valor.trim()) return [];
        
        const clientes = this.carregar();
        const valorBusca = valor.toLowerCase().trim();
        
        return clientes
            .map((cliente, indice) => ({ ...cliente, indice }))
            .filter(cliente => {
                const valorCampo = (cliente[campo] || "").toLowerCase();
                return valorCampo.includes(valorBusca);
            });
    },
    
    /**
     * Atualiza cliente existente
     * @param {number} indice - Índice do cliente
     * @param {Object} dadosAtualizados - Novos dados
     * @returns {Object} { sucesso: boolean, mensagem: string }
     */
    atualizar(indice, dadosAtualizados) {
        const clientes = this.carregar();
        
        if (indice < 0 || indice >= clientes.length) {
            return { sucesso: false, mensagem: "Cliente não encontrado" };
        }
        
        if (!dadosAtualizados.nome || !dadosAtualizados.nome.trim()) {
            return { sucesso: false, mensagem: "Nome é obrigatório" };
        }
        
        // Mantém data de criação original
        dadosAtualizados.dataCriacao = clientes[indice].dataCriacao;
        dadosAtualizados.dataAtualizacao = new Date().toISOString();
        
        clientes[indice] = dadosAtualizados;
        
        if (this.salvar(clientes)) {
            return { sucesso: true, mensagem: "Cliente atualizado com sucesso" };
        }
        
        return { sucesso: false, mensagem: "Erro ao atualizar cliente" };
    },
    
    /**
     * Remove cliente
     * @param {number} indice - Índice do cliente
     * @returns {Object} { sucesso: boolean, mensagem: string }
     */
    remover(indice) {
        const clientes = this.carregar();
        
        if (indice < 0 || indice >= clientes.length) {
            return { sucesso: false, mensagem: "Cliente não encontrado" };
        }
        
        clientes.splice(indice, 1);
        
        if (this.salvar(clientes)) {
            return { sucesso: true, mensagem: "Cliente removido com sucesso" };
        }
        
        return { sucesso: false, mensagem: "Erro ao remover cliente" };
    },
    
    /**
     * Valida dados do cliente antes de salvar
     * @param {Object} cliente - Dados do cliente
     * @returns {Object} { valido: boolean, erros: Array }
     */
    validar(cliente) {
        const erros = [];
        
        // Nome obrigatório
        if (!cliente.nome || !cliente.nome.trim()) {
            erros.push("Nome é obrigatório");
        }
        
        // Valida CPF se preenchido
        if (cliente.cpf && cliente.cpf.trim() && typeof validarCPF === 'function') {
            if (!validarCPF(cliente.cpf)) {
                erros.push("CPF inválido");
            }
        }
        
        // Valida email se preenchido
        if (cliente.email && cliente.email.trim() && typeof validarEmail === 'function') {
            if (!validarEmail(cliente.email)) {
                erros.push("Email inválido");
            }
        }
        
        // Valida data de nascimento se preenchida
        if (cliente.nascimento && cliente.nascimento.trim() && typeof validarData === 'function') {
            if (!validarData(cliente.nascimento)) {
                erros.push("Data de nascimento inválida");
            }
        }
        
        // Valida validade do passaporte se preenchida
        if (cliente.validade && cliente.validade.trim() && typeof validarData === 'function') {
            if (!validarData(cliente.validade)) {
                erros.push("Data de validade do passaporte inválida");
            }
        }
        
        return {
            valido: erros.length === 0,
            erros
        };
    },
    
    /**
     * Exporta todos os clientes para backup
     * @returns {string} JSON string dos clientes
     */
    exportar() {
        const clientes = this.carregar();
        return JSON.stringify(clientes, null, 2);
    },
    
    /**
     * Importa clientes de backup
     * @param {string} jsonString - JSON string dos clientes
     * @returns {Object} { sucesso: boolean, mensagem: string }
     */
    importar(jsonString) {
        try {
            const clientes = JSON.parse(jsonString);
            
            if (!Array.isArray(clientes)) {
                return { sucesso: false, mensagem: "Formato inválido" };
            }
            
            if (this.salvar(clientes)) {
                return { 
                    sucesso: true, 
                    mensagem: `${clientes.length} cliente(s) importado(s) com sucesso` 
                };
            }
            
            return { sucesso: false, mensagem: "Erro ao importar" };
        } catch (erro) {
            return { sucesso: false, mensagem: "Arquivo inválido" };
        }
    },
    
    /**
     * Limpa todos os clientes (usar com cuidado!)
     * @returns {boolean} True se limpou com sucesso
     */
    limparTudo() {
        return this.salvar([]);
    }
};

// Mantém compatibilidade com código antigo
let dbClientes = {
    clientes: DB_CLIENTES.carregar()
};

function salvarDBClientes() {
    DB_CLIENTES.salvar(dbClientes.clientes);
}

function buscarClientePorIndex(index) {
    return DB_CLIENTES.buscarPorIndice(index);
}

console.log("✓ db-clientes.js carregado");