// db-vendas.js - Banco de dados local para Vendas
// CORREÇÃO: Lucro = Taxa (não somar comissão + over + taxa novamente)

const DB_VENDAS = {
    STORAGE_KEY: "dbVendas_v2",
    STORAGE_KEY_OLD: "dbVendas",
    
    migrarDadosAntigos() {
        const dadosNovos = localStorage.getItem(this.STORAGE_KEY);
        if (dadosNovos) return;
        
        const dadosAntigos = localStorage.getItem(this.STORAGE_KEY_OLD);
        if (!dadosAntigos) return;
        
        try {
            const dbAntigo = JSON.parse(dadosAntigos);
            if (dbAntigo && dbAntigo.vendas && Array.isArray(dbAntigo.vendas)) {
                console.log(`Migrando ${dbAntigo.vendas.length} vendas do storage antigo...`);
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dbAntigo.vendas));
                console.log('Migração concluída!');
            }
        } catch (erro) {
            console.error('Erro ao migrar dados antigos:', erro);
        }
    },
    
    carregar() {
        this.migrarDadosAntigos();
        
        try {
            const dados = localStorage.getItem(this.STORAGE_KEY);
            return dados ? JSON.parse(dados) : [];
        } catch (erro) {
            console.error("Erro ao carregar vendas:", erro);
            return [];
        }
    },
    
    salvar(vendas) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(vendas));
            return true;
        } catch (erro) {
            console.error("Erro ao salvar vendas:", erro);
            return false;
        }
    },
    
    listarTodas() {
        return this.carregar();
    },
    
    parseMoeda(valor) {
        if (typeof valor === 'number') return valor;
        if (!valor) return 0;
        return parseInt(valor.toString().replace(/\D/g, '')) || 0;
    },
    
    /**
     * Processa produto com cálculo CORRETO
     * TAXA = comissão + over (já vem calculada do frontend)
     * LUCRO = TAXA (não somar de novo!)
     * VALOR TOTAL = tarifa + taxa
     */
    processarProduto(produto) {
        const tarifa = this.parseMoeda(produto.valor);
        const comissao = this.parseMoeda(produto.comissao);
        const taxa = this.parseMoeda(produto.taxa);
        const over = this.parseMoeda(produto.over);
        
        // TAXA já vem calculada do frontend (comissão + over)
        // Não recalcular aqui para evitar duplicação
        const tarifaValor = tarifa;
        const taxaValor = taxa; // Já calculada
        
        // LUCRO = Taxa (que JÁ É comissão + over)
        const lucro = taxaValor;
        
        // VALOR TOTAL = tarifa + taxa
        const valorTotal = tarifaValor + taxaValor;
        
        return {
            produto: produto.produto || '',
            destino: produto.destino || 'Nacional',
            dataEmbarque: produto.dataEmbarque || '',
            dataRetorno: produto.dataRetorno || '',
            valor: tarifaValor,      // Tarifa = custo fornecedor
            comissao: comissao,      // Para referência
            taxa: taxaValor,         // Taxa (já calculada)
            over: over,              // Para referência
            lucro: lucro,            // SEU LUCRO = taxa
            valorTotal: valorTotal,  // Cliente paga
            intermediario: produto.intermediario || '',
            dataEmissao: produto.dataEmissao || '',
            fornecedor: produto.fornecedor || '',
            localizador: produto.localizador || ''
        };
    },
    
    gerarNumero() {
        const vendas = this.carregar();
        return String(vendas.length + 1).padStart(4, '0');
    },
    
    adicionar(venda) {
        if (!venda.clienteIndex && venda.clienteIndex !== 0) {
            return { sucesso: false, mensagem: "Cliente é obrigatório" };
        }
        
        if (!venda.produtos || venda.produtos.length === 0) {
            return { sucesso: false, mensagem: "Adicione pelo menos um produto" };
        }
        
        const vendas = this.carregar();
        
        // Busca nome do cliente
        let clienteNome = 'N/A';
        if (typeof DB_CLIENTES !== 'undefined' && DB_CLIENTES.buscarPorIndice) {
            const cliente = DB_CLIENTES.buscarPorIndice(venda.clienteIndex);
            clienteNome = cliente ? cliente.nome : 'N/A';
        } else if (typeof buscarClientePorIndex === 'function') {
            const cliente = buscarClientePorIndex(venda.clienteIndex);
            clienteNome = cliente ? cliente.nome : 'N/A';
        } else if (typeof dbClientes !== 'undefined' && dbClientes.clientes) {
            const cliente = dbClientes.clientes[venda.clienteIndex];
            clienteNome = cliente ? cliente.nome : 'N/A';
        }
        
        // Processa produtos e calcula totais
        const produtosProcessados = venda.produtos.map(p => this.processarProduto(p));
        
        let totalValorCliente = 0;  // O que o cliente paga (tarifa + taxa)
        let totalLucro = 0;          // O que VOCÊ ganha (taxa)
        
        produtosProcessados.forEach(p => {
            totalValorCliente += p.valorTotal;
            totalLucro += p.lucro;
        });
        
        const vendaNova = {
            numero: venda.numero || this.gerarNumero(),
            clienteIndex: venda.clienteIndex,
            clienteNome: clienteNome,
            produtos: produtosProcessados,
            totalValorCliente: totalValorCliente,
            totalLucro: totalLucro,
            dataCadastro: venda.dataCadastro || new Date().toISOString().split('T')[0],
            dataCriacao: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString()
        };
        
        vendas.push(vendaNova);
        
        if (this.salvar(vendas)) {
            return { 
                sucesso: true, 
                mensagem: "Venda cadastrada com sucesso",
                indice: vendas.length - 1
            };
        }
        
        return { sucesso: false, mensagem: "Erro ao salvar venda" };
    },
    
    buscarPorIndice(indice) {
        const vendas = this.carregar();
        return vendas[indice] || null;
    },
    
    buscarPorCliente(clienteIndex) {
        const vendas = this.carregar();
        return vendas
            .map((venda, indice) => ({ ...venda, indice }))
            .filter(venda => venda.clienteIndex === clienteIndex);
    },
    
    buscarPorPeriodo(dataInicio, dataFim) {
        const vendas = this.carregar();
        return vendas
            .map((venda, indice) => ({ ...venda, indice }))
            .filter(venda => {
                if (dataInicio && venda.dataCadastro < dataInicio) return false;
                if (dataFim && venda.dataCadastro > dataFim) return false;
                return true;
            });
    },
    
    atualizar(indice, vendaAtualizada) {
        const vendas = this.carregar();
        
        if (indice < 0 || indice >= vendas.length) {
            return { sucesso: false, mensagem: "Venda não encontrada" };
        }
        
        if (!vendaAtualizada.clienteIndex && vendaAtualizada.clienteIndex !== 0) {
            return { sucesso: false, mensagem: "Cliente é obrigatório" };
        }
        
        if (!vendaAtualizada.produtos || vendaAtualizada.produtos.length === 0) {
            return { sucesso: false, mensagem: "Adicione pelo menos um produto" };
        }
        
        // Busca nome do cliente
        let clienteNome = 'N/A';
        if (typeof DB_CLIENTES !== 'undefined' && DB_CLIENTES.buscarPorIndice) {
            const cliente = DB_CLIENTES.buscarPorIndice(vendaAtualizada.clienteIndex);
            clienteNome = cliente ? cliente.nome : 'N/A';
        } else if (typeof buscarClientePorIndex === 'function') {
            const cliente = buscarClientePorIndex(vendaAtualizada.clienteIndex);
            clienteNome = cliente ? cliente.nome : 'N/A';
        } else if (typeof dbClientes !== 'undefined' && dbClientes.clientes) {
            const cliente = dbClientes.clientes[vendaAtualizada.clienteIndex];
            clienteNome = cliente ? cliente.nome : 'N/A';
        }
        
        const vendaOriginal = vendas[indice];
        
        // Processa produtos e calcula totais
        const produtosProcessados = vendaAtualizada.produtos.map(p => this.processarProduto(p));
        
        let totalValorCliente = 0;
        let totalLucro = 0;
        
        produtosProcessados.forEach(p => {
            totalValorCliente += p.valorTotal;
            totalLucro += p.lucro;
        });
        
        vendas[indice] = {
            numero: vendaOriginal.numero,
            clienteIndex: vendaAtualizada.clienteIndex,
            clienteNome: clienteNome,
            produtos: produtosProcessados,
            totalValorCliente: totalValorCliente,
            totalLucro: totalLucro,
            dataCadastro: vendaOriginal.dataCadastro,
            dataCriacao: vendaOriginal.dataCriacao,
            dataAtualizacao: new Date().toISOString()
        };
        
        if (this.salvar(vendas)) {
            return { sucesso: true, mensagem: "Venda atualizada com sucesso" };
        }
        
        return { sucesso: false, mensagem: "Erro ao atualizar venda" };
    },
    
    remover(indice) {
        const vendas = this.carregar();
        
        if (indice < 0 || indice >= vendas.length) {
            return { sucesso: false, mensagem: "Venda não encontrada" };
        }
        
        vendas.splice(indice, 1);
        
        if (this.salvar(vendas)) {
            return { sucesso: true, mensagem: "Venda removida com sucesso" };
        }
        
        return { sucesso: false, mensagem: "Erro ao remover venda" };
    },
    
    calcularTotais(dataInicio, dataFim) {
        const vendas = this.buscarPorPeriodo(dataInicio, dataFim);
        
        const totais = {
            quantidade: vendas.length,
            totalValorCliente: 0,
            totalLucro: 0
        };
        
        vendas.forEach(venda => {
            totais.totalValorCliente += venda.totalValorCliente || 0;
            totais.totalLucro += venda.totalLucro || 0;
        });
        
        return totais;
    },
    
    exportar() {
        const vendas = this.carregar();
        return JSON.stringify(vendas, null, 2);
    },
    
    importar(jsonString) {
        try {
            const vendas = JSON.parse(jsonString);
            
            if (!Array.isArray(vendas)) {
                return { sucesso: false, mensagem: "Formato inválido" };
            }
            
            if (this.salvar(vendas)) {
                return { 
                    sucesso: true, 
                    mensagem: `${vendas.length} venda(s) importada(s) com sucesso` 
                };
            }
            
            return { sucesso: false, mensagem: "Erro ao importar" };
        } catch (erro) {
            return { sucesso: false, mensagem: "Arquivo inválido" };
        }
    },
    
    limparTudo() {
        return this.salvar([]);
    }
};

// Mantém compatibilidade
let dbVendas = {
    vendas: DB_VENDAS.carregar()
};

function salvarDBVendas() {
    DB_VENDAS.salvar(dbVendas.vendas);
}

function adicionarVenda(venda) {
    const resultado = DB_VENDAS.adicionar(venda);
    if (resultado.sucesso) {
        dbVendas.vendas = DB_VENDAS.carregar();
    }
    return resultado;
}

function editarVenda(index, venda) {
    const resultado = DB_VENDAS.atualizar(index, venda);
    if (resultado.sucesso) {
        dbVendas.vendas = DB_VENDAS.carregar();
    }
    return resultado;
}

function excluirVenda(index) {
    const resultado = DB_VENDAS.remover(index);
    if (resultado.sucesso) {
        dbVendas.vendas = DB_VENDAS.carregar();
    }
    return resultado;
}

function resetDBVendas() {
    DB_VENDAS.limparTudo();
    dbVendas.vendas = [];
}

console.log("✓ db-vendas.js carregado (Bug do lucro duplicado CORRIGIDO)");