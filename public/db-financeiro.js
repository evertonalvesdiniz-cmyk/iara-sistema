// db-financeiro.js - Banco de dados local para Financeiro
// Versão 5.0 - HIERÁRQUICO: Venda única com subitens por fornecedor
// Estrutura: Venda (principal) → Produtos (subitens gerenciáveis individualmente)

const DB_FINANCEIRO = {
    STORAGE_KEY: "dbFinanceiro_v5",
    
    carregar() {
        try {
            const dados = localStorage.getItem(this.STORAGE_KEY);
            return dados ? JSON.parse(dados) : { contasPagar: [], contasReceber: [] };
        } catch (erro) {
            console.error("Erro ao carregar dados financeiros:", erro);
            return { contasPagar: [], contasReceber: [] };
        }
    },
    
    salvar(dados) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dados));
            return true;
        } catch (erro) {
            console.error("Erro ao salvar dados financeiros:", erro);
            return false;
        }
    },
    
    parseMoeda(valor) {
        if (typeof valor === 'number') return valor;
        if (!valor) return 0;
        return parseInt(valor.toString().replace(/\D/g, '')) || 0;
    },
    
    gerarId() {
        return 'fin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    // ==================== CONTAS A PAGAR ====================
    
    adicionarContaPagar(conta) {
        if (!conta.credor || !conta.credor.trim()) {
            return { sucesso: false, mensagem: "Credor é obrigatório" };
        }
        
        if (!conta.valor) {
            return { sucesso: false, mensagem: "Valor é obrigatório" };
        }
        
        if (!conta.data) {
            return { sucesso: false, mensagem: "Data de vencimento é obrigatória" };
        }
        
        const dados = this.carregar();
        
        const novaConta = {
            id: this.gerarId(),
            credor: conta.credor.trim(),
            valor: this.parseMoeda(conta.valor),
            data: conta.data,
            status: conta.status || 'pendente',
            origem: conta.origem || 'manual',
            vendaNumero: conta.vendaNumero || null,
            dataCriacao: new Date().toISOString(),
            // NOVO: Subitens por produto/fornecedor
            subitens: conta.subitens || []
        };
        
        dados.contasPagar.push(novaConta);
        
        if (this.salvar(dados)) {
            return { sucesso: true, mensagem: "Conta a pagar adicionada com sucesso" };
        }
        
        return { sucesso: false, mensagem: "Erro ao salvar conta" };
    },
    
    listarContasPagar() {
        const dados = this.carregar();
        return dados.contasPagar;
    },
    
    buscarContasPagar(dataInicio, dataFim, status = 'todos') {
        const dados = this.carregar();
        
        return dados.contasPagar
            .map((conta, indice) => ({ ...conta, indice }))
            .filter(conta => {
                if (dataInicio && conta.data < dataInicio) return false;
                if (dataFim && conta.data > dataFim) return false;
                if (status !== 'todos' && conta.status !== status) return false;
                return true;
            });
    },
    
    /**
     * Marca conta inteira como paga
     */
    marcarContaPaga(indice) {
        const dados = this.carregar();
        
        if (indice < 0 || indice >= dados.contasPagar.length) {
            return { sucesso: false, mensagem: "Conta não encontrada" };
        }
        
        const conta = dados.contasPagar[indice];
        conta.status = 'pago';
        conta.dataPagamento = new Date().toISOString().split('T')[0];
        
        // Marca todos os subitens como pagos também
        if (conta.subitens && conta.subitens.length > 0) {
            conta.subitens.forEach(subitem => {
                subitem.status = 'pago';
                subitem.dataPagamento = conta.dataPagamento;
            });
        }
        
        if (this.salvar(dados)) {
            return { sucesso: true, mensagem: "Conta marcada como paga" };
        }
        
        return { sucesso: false, mensagem: "Erro ao atualizar conta" };
    },
    
    /**
     * NOVO: Marca apenas um subitem (produto/fornecedor) como pago
     */
    marcarSubitemPago(indiceContaPrincipal, indiceSubitem, dataPagamento = null) {
        const dados = this.carregar();
        
        if (indiceContaPrincipal < 0 || indiceContaPrincipal >= dados.contasPagar.length) {
            return { sucesso: false, mensagem: "Conta não encontrada" };
        }
        
        const conta = dados.contasPagar[indiceContaPrincipal];
        
        if (!conta.subitens || indiceSubitem < 0 || indiceSubitem >= conta.subitens.length) {
            return { sucesso: false, mensagem: "Produto não encontrado" };
        }
        
        // Marca subitem como pago
        conta.subitens[indiceSubitem].status = 'pago';
        conta.subitens[indiceSubitem].dataPagamento = dataPagamento || new Date().toISOString().split('T')[0];
        
        // Atualiza status geral da conta
        const todosSubitensPagos = conta.subitens.every(s => s.status === 'pago');
        const algunsSubitensPagos = conta.subitens.some(s => s.status === 'pago');
        
        if (todosSubitensPagos) {
            conta.status = 'pago';
            conta.dataPagamento = conta.subitens[indiceSubitem].dataPagamento;
        } else if (algunsSubitensPagos) {
            conta.status = 'parcial';
        }
        
        if (this.salvar(dados)) {
            const pagosCont = conta.subitens.filter(s => s.status === 'pago').length;
            return { 
                sucesso: true, 
                mensagem: `Produto marcado como pago (${pagosCont}/${conta.subitens.length})` 
            };
        }
        
        return { sucesso: false, mensagem: "Erro ao atualizar" };
    },
    
    /**
     * NOVO: Edita data de pagamento de um subitem específico
     */
    editarDataPagamentoSubitem(indiceContaPrincipal, indiceSubitem, novaData) {
        const dados = this.carregar();
        
        if (indiceContaPrincipal < 0 || indiceContaPrincipal >= dados.contasPagar.length) {
            return { sucesso: false, mensagem: "Conta não encontrada" };
        }
        
        const conta = dados.contasPagar[indiceContaPrincipal];
        
        if (!conta.subitens || indiceSubitem < 0 || indiceSubitem >= conta.subitens.length) {
            return { sucesso: false, mensagem: "Produto não encontrado" };
        }
        
        conta.subitens[indiceSubitem].data = novaData;
        
        if (this.salvar(dados)) {
            return { sucesso: true, mensagem: "Data atualizada com sucesso" };
        }
        
        return { sucesso: false, mensagem: "Erro ao atualizar data" };
    },
    
    removerContaPagar(indice) {
        const dados = this.carregar();
        
        if (indice < 0 || indice >= dados.contasPagar.length) {
            return { sucesso: false, mensagem: "Conta não encontrada" };
        }
        
        dados.contasPagar.splice(indice, 1);
        
        if (this.salvar(dados)) {
            return { sucesso: true, mensagem: "Conta removida com sucesso" };
        }
        
        return { sucesso: false, mensagem: "Erro ao remover conta" };
    },
    
    calcularTotaisContasPagar(dataInicio, dataFim) {
        const contas = this.buscarContasPagar(dataInicio, dataFim);
        
        const totais = {
            pagas: 0,
            pendentes: 0,
            parciais: 0,
            total: 0
        };
        
        contas.forEach(conta => {
            if (conta.status === 'pago') {
                totais.pagas += conta.valor;
            } else if (conta.status === 'parcial') {
                // Soma apenas o que já foi pago dos subitens
                const valorPago = conta.subitens
                    .filter(s => s.status === 'pago')
                    .reduce((sum, s) => sum + s.valor, 0);
                totais.pagas += valorPago;
                totais.parciais += conta.valor - valorPago;
            } else {
                totais.pendentes += conta.valor;
            }
            totais.total += conta.valor;
        });
        
        return totais;
    },
    
    // ==================== CONTAS A RECEBER ====================
    
    /**
     * Sincroniza vendas com contas a receber (HIERÁRQUICO)
     * Cria UMA conta por venda com SUBITENS por produto/fornecedor
     */
    sincronizarContasReceberVendas() {
        if (typeof DB_VENDAS === 'undefined') {
            console.warn('DB_VENDAS não está disponível');
            return [];
        }
        
        const vendas = DB_VENDAS.listarTodas();
        const dados = this.carregar();
        
        // Mapeia vendas para contas a receber hierárquicas
        const contasVendas = vendas.map((venda, indice) => {
            const contaExistente = dados.contasReceber.find(
                c => c.tipo === 'venda' && c.vendaNumero === venda.numero
            );
            
            // Cria subitens para cada produto/fornecedor
            const subitens = venda.produtos.map((produto, pIdx) => {
                const subitemExistente = contaExistente?.subitens?.[pIdx];
                
                return {
                    id: subitemExistente?.id || this.gerarId(),
                    produtoNome: produto.produto || 'Produto',
                    fornecedor: produto.fornecedor || 'N/A',
                    localizador: produto.localizador || '',
                    valorTotal: produto.valorTotal || 0, // Tarifa + Taxa
                    tarifa: produto.valor || 0,
                    taxa: produto.taxa || 0, // Seu lucro
                    status: subitemExistente?.status || 'pendente',
                    formaPagamento: subitemExistente?.formaPagamento || null,
                    dataRecebimento: subitemExistente?.dataRecebimento || null,
                    dataCriacao: subitemExistente?.dataCriacao || new Date().toISOString()
                };
            });
            
            // Calcula status geral baseado nos subitens
            let statusGeral = 'pendente';
            if (subitens.every(s => s.status === 'recebido')) {
                statusGeral = 'recebido';
            } else if (subitens.some(s => s.status === 'recebido')) {
                statusGeral = 'parcial';
            }
            
            return {
                id: contaExistente?.id || this.gerarId(),
                tipo: 'venda',
                vendaNumero: venda.numero,
                vendaIndex: indice,
                devedor: venda.clienteNome,
                devedorIndex: venda.clienteIndex,
                valor: venda.totalValorCliente || 0,
                lucroTotal: venda.totalLucro || 0,
                data: venda.dataCadastro,
                status: statusGeral,
                subitens: subitens, // 🔥 CHAVE: Lista de produtos com status individual
                dataCriacao: contaExistente?.dataCriacao || new Date().toISOString()
            };
        });
        
        // Mantém contas manuais e de repasse de fornecedor
        const contasOutras = dados.contasReceber.filter(c => c.tipo !== 'venda');
        
        // Atualiza storage
        dados.contasReceber = [...contasVendas, ...contasOutras];
        this.salvar(dados);
        
        return dados.contasReceber;
    },
    
    listarContasReceber() {
        this.sincronizarContasReceberVendas();
        const dados = this.carregar();
        return dados.contasReceber;
    },
    
    buscarContasReceber(dataInicio, dataFim, status = 'todos') {
        const contas = this.listarContasReceber();
        
        return contas
            .map((conta, indice) => ({ ...conta, indice }))
            .filter(conta => {
                if (dataInicio && conta.data < dataInicio) return false;
                if (dataFim && conta.data > dataFim) return false;
                if (status !== 'todos' && conta.status !== status) return false;
                return true;
            });
    },
    
    calcularTotaisContasReceber(dataInicio, dataFim) {
        const contas = this.buscarContasReceber(dataInicio, dataFim);
        
        const totais = {
            recebidas: 0,
            pendentes: 0,
            aguardandoRepasse: 0,
            parciais: 0,
            total: 0
        };
        
        contas.forEach(conta => {
            // Para vendas (tipo 'venda'), calcular baseado nos subitens
            if (conta.tipo === 'venda' && conta.subitens) {
                conta.subitens.forEach(subitem => {
                    if (subitem.status === 'recebido') {
                        // PIX: Você recebeu o valor total
                        // Boleto/Cartão: Você recebeu apenas a taxa (já foi creditada via conta de repasse)
                        if (subitem.formaPagamento === 'pix') {
                            totais.recebidas += subitem.valorTotal; // Entrou no caixa
                        }
                        // NÃO soma taxa aqui para boleto/cartão, pois já foi somada na conta de repasse
                    } else if (subitem.status === 'aguardando_repasse') {
                        // Cliente pagou fornecedor, aguardando seu lucro
                        totais.aguardandoRepasse += subitem.taxa;
                    } else {
                        // Pendente
                        if (subitem.formaPagamento === 'pix' || !subitem.formaPagamento) {
                            totais.pendentes += subitem.valorTotal;
                        } else {
                            totais.pendentes += subitem.taxa; // Seu lucro a receber
                        }
                    }
                });
            } 
            // Para contas de repasse (geradas por boleto/cartão)
            else if (conta.tipo === 'repasse') {
                if (conta.status === 'recebido') {
                    totais.recebidas += conta.valor; // Soma o lucro que entrou
                } else if (conta.status === 'pendente') {
                    // Não soma aqui, já está contado no aguardandoRepasse acima
                }
            }
            // Para outras contas
            else if (conta.tipo !== 'venda') {
                if (conta.status === 'recebido') {
                    totais.recebidas += conta.valor;
                } else if (conta.status === 'parcial') {
                    const valorRecebido = conta.subitens
                        .filter(s => s.status === 'recebido')
                        .reduce((sum, s) => sum + s.valorTotal, 0);
                    totais.recebidas += valorRecebido;
                    totais.parciais += conta.valor - valorRecebido;
                } else {
                    totais.pendentes += conta.valor;
                }
            }
        });
        
        totais.total = totais.recebidas + totais.pendentes + totais.aguardandoRepasse + totais.parciais;
        
        return totais;
    },
    
    // ==================== FLUXO MANUAL: RECEBIMENTO POR PRODUTO/FORNECEDOR ====================
    
    /**
     * NOVO: Confirma recebimento de UM produto/fornecedor específico
     * PIX: Cliente pagou você → Cria conta a PAGAR da tarifa deste produto
     * Boleto/Cartão: Cliente pagou fornecedor → Marca como "Aguardando repasse"
     */
    confirmarRecebimentoProduto(vendaNumero, indiceSubitem, formaPagamento) {
        if (!formaPagamento) {
            return { sucesso: false, mensagem: "Forma de pagamento é obrigatória" };
        }
        
        const dados = this.carregar();
        const vendas = DB_VENDAS.listarTodas();
        const venda = vendas.find(v => v.numero === vendaNumero);
        
        if (!venda) {
            return { sucesso: false, mensagem: "Venda não encontrada" };
        }
        
        // Busca conta da venda
        const contaIndex = dados.contasReceber.findIndex(
            c => c.tipo === 'venda' && c.vendaNumero === vendaNumero
        );
        
        if (contaIndex === -1) {
            this.sincronizarContasReceberVendas();
            return this.confirmarRecebimentoProduto(vendaNumero, indiceSubitem, formaPagamento);
        }
        
        const conta = dados.contasReceber[contaIndex];
        
        if (!conta.subitens || indiceSubitem < 0 || indiceSubitem >= conta.subitens.length) {
            return { sucesso: false, mensagem: "Produto não encontrado" };
        }
        
        const subitem = conta.subitens[indiceSubitem];
        const dataAtual = new Date().toISOString().split('T')[0];
        
        // PIX: Cliente pagou VOCÊ
        if (formaPagamento === 'pix') {
            // Marca como recebido (você já tem o dinheiro)
            subitem.status = 'recebido';
            subitem.formaPagamento = formaPagamento;
            subitem.dataRecebimento = dataAtual;
            
            // Atualiza status geral
            const todosRecebidos = conta.subitens.every(s => s.status === 'recebido' || s.status === 'aguardando_repasse');
            const algunsRecebidos = conta.subitens.some(s => s.status === 'recebido' || s.status === 'aguardando_repasse');
            
            if (todosRecebidos) {
                conta.status = 'recebido';
            } else if (algunsRecebidos) {
                conta.status = 'parcial';
            }
            
            // Cria conta a PAGAR automaticamente (você deve pagar o fornecedor)
            const contaPagar = {
                id: this.gerarId(),
                credor: subitem.fornecedor,
                valor: subitem.tarifa,
                data: dataAtual,
                status: 'pendente',
                origem: 'venda_pix',
                vendaNumero: vendaNumero,
                produtoNome: subitem.produtoNome,
                localizador: subitem.localizador,
                dataCriacao: new Date().toISOString(),
                subitens: []
            };
            
            dados.contasPagar.push(contaPagar);
            
            if (this.salvar(dados)) {
                const finalizadosCont = conta.subitens.filter(s => s.status === 'recebido' || s.status === 'aguardando_repasse').length;
                return { 
                    sucesso: true, 
                    mensagem: `✅ PIX Confirmado! (${finalizadosCont}/${conta.subitens.length})\n\n💰 Você recebeu: ${formatarMoedaBR ? formatarMoedaBR(subitem.valorTotal) : subitem.valorTotal}\n   (Tarifa: ${formatarMoedaBR ? formatarMoedaBR(subitem.tarifa) : subitem.tarifa} + Seu lucro: ${formatarMoedaBR ? formatarMoedaBR(subitem.taxa) : subitem.taxa})\n\n📝 Conta a PAGAR criada:\n   Fornecedor: ${subitem.fornecedor}\n   Valor (tarifa): ${formatarMoedaBR ? formatarMoedaBR(subitem.tarifa) : subitem.tarifa}\n\n⚠️ Marque como "Pago" quando transferir para o fornecedor.`
                };
            }
        } 
        
        // BOLETO/CARTÃO: Cliente pagou FORNECEDOR
        else if (formaPagamento === 'boleto' || formaPagamento === 'cartao') {
            // Marca como "aguardando repasse" (você ainda não tem o dinheiro)
            subitem.status = 'aguardando_repasse';
            subitem.formaPagamento = formaPagamento;
            subitem.dataConfirmacaoPagamento = dataAtual; // Data que cliente pagou fornecedor
            
            // Atualiza status geral
            const todosRecebidos = conta.subitens.every(s => s.status === 'recebido' || s.status === 'aguardando_repasse');
            const algunsRecebidos = conta.subitens.some(s => s.status === 'recebido' || s.status === 'aguardando_repasse');
            
            if (todosRecebidos) {
                conta.status = 'recebido';
            } else if (algunsRecebidos) {
                conta.status = 'parcial';
            }
            
            // Cria conta a RECEBER do LUCRO (fornecedor deve repassar sua comissão)
            const contaReceber = {
                id: this.gerarId(),
                tipo: 'repasse',
                vendaNumero: vendaNumero,
                devedor: subitem.fornecedor,
                valor: subitem.taxa, // APENAS SEU LUCRO (taxa = comissão + over)
                data: dataAtual,
                status: 'pendente',
                origem: `venda_${formaPagamento}`,
                produtoNome: subitem.produtoNome,
                localizador: subitem.localizador,
                dataCriacao: new Date().toISOString(),
                subitens: []
            };
            
            dados.contasReceber.push(contaReceber);
            
            if (this.salvar(dados)) {
                const finalizadosCont = conta.subitens.filter(s => s.status === 'recebido' || s.status === 'aguardando_repasse').length;
                return { 
                    sucesso: true, 
                    mensagem: `✅ ${formaPagamento.toUpperCase()} Confirmado! (${finalizadosCont}/${conta.subitens.length})\n\n📝 Cliente pagou fornecedor: ${formatarMoedaBR ? formatarMoedaBR(subitem.valorTotal) : subitem.valorTotal}\n   • Tarifa (fica com fornecedor): ${formatarMoedaBR ? formatarMoedaBR(subitem.tarifa) : subitem.tarifa}\n   • Seu lucro (a receber): ${formatarMoedaBR ? formatarMoedaBR(subitem.taxa) : subitem.taxa}\n\n💰 Conta a RECEBER criada:\n   De: ${subitem.fornecedor}\n   Valor: ${formatarMoedaBR ? formatarMoedaBR(subitem.taxa) : subitem.taxa} (APENAS seu lucro)\n\n⏳ Status: AGUARDANDO REPASSE\n⚠️ Marque como "Recebido" quando fornecedor repassar sua comissão.`
                };
            }
        }
        
        return { sucesso: false, mensagem: "Erro ao processar" };
    },
    
    /**
     * NOVO: Confirma que o fornecedor repassou o lucro (apenas para boleto/cartão)
     */
    confirmarRepasseFornecedor(vendaNumero, indiceSubitem) {
        const dados = this.carregar();
        
        const contaIndex = dados.contasReceber.findIndex(
            c => c.tipo === 'venda' && c.vendaNumero === vendaNumero
        );
        
        if (contaIndex === -1) {
            return { sucesso: false, mensagem: "Conta não encontrada" };
        }
        
        const conta = dados.contasReceber[contaIndex];
        
        if (!conta.subitens || indiceSubitem < 0 || indiceSubitem >= conta.subitens.length) {
            return { sucesso: false, mensagem: "Produto não encontrado" };
        }
        
        const subitem = conta.subitens[indiceSubitem];
        
        if (subitem.status !== 'aguardando_repasse') {
            return { sucesso: false, mensagem: "Produto não está aguardando repasse" };
        }
        
        const dataAtual = new Date().toISOString().split('T')[0];
        
        // Marca como recebido (agora você tem o lucro)
        subitem.status = 'recebido';
        subitem.dataRecebimento = dataAtual;
        
        // Busca e marca a conta de repasse como recebida
        const repasseIndex = dados.contasReceber.findIndex(
            cr => cr.tipo === 'repasse' && 
                  cr.vendaNumero === vendaNumero && 
                  cr.produtoNome === subitem.produtoNome
        );
        
        if (repasseIndex !== -1) {
            dados.contasReceber[repasseIndex].status = 'recebido';
            dados.contasReceber[repasseIndex].dataRecebimento = dataAtual;
        }
        
        if (this.salvar(dados)) {
            return { 
                sucesso: true, 
                mensagem: `✅ Repasse confirmado!\n\n💰 Você recebeu: ${formatarMoedaBR ? formatarMoedaBR(subitem.taxa) : subitem.taxa}\n\nO valor foi creditado no seu caixa.`
            };
        }
        
        return { sucesso: false, mensagem: "Erro ao confirmar repasse" };
    },
    
    /**
     * NOVO: Cancela recebimento de um produto específico
     */
    cancelarRecebimentoProduto(vendaNumero, indiceSubitem) {
        const dados = this.carregar();
        
        const contaIndex = dados.contasReceber.findIndex(
            c => c.tipo === 'venda' && c.vendaNumero === vendaNumero
        );
        
        if (contaIndex === -1) {
            return { sucesso: false, mensagem: "Conta não encontrada" };
        }
        
        const conta = dados.contasReceber[contaIndex];
        
        if (!conta.subitens || indiceSubitem < 0 || indiceSubitem >= conta.subitens.length) {
            return { sucesso: false, mensagem: "Produto não encontrado" };
        }
        
        const subitem = conta.subitens[indiceSubitem];
        
        // Remove contas relacionadas a este produto
        if (subitem.formaPagamento === 'pix') {
            // Remove conta a pagar
            const pagarIndex = dados.contasPagar.findIndex(
                cp => cp.origem === 'venda_pix' && 
                      cp.vendaNumero === vendaNumero && 
                      cp.produtoNome === subitem.produtoNome
            );
            if (pagarIndex !== -1) {
                dados.contasPagar.splice(pagarIndex, 1);
            }
        } else {
            // Remove conta a receber de repasse
            const receberIndex = dados.contasReceber.findIndex(
                cr => cr.tipo === 'repasse' && 
                      cr.vendaNumero === vendaNumero && 
                      cr.produtoNome === subitem.produtoNome
            );
            if (receberIndex !== -1) {
                dados.contasReceber.splice(receberIndex, 1);
            }
        }
        
        // Volta subitem ao estado pendente
        subitem.status = 'pendente';
        subitem.formaPagamento = null;
        subitem.dataRecebimento = null;
        
        // Atualiza status geral
        const todosRecebidos = conta.subitens.every(s => s.status === 'recebido');
        const algunsRecebidos = conta.subitens.some(s => s.status === 'recebido');
        
        if (todosRecebidos) {
            conta.status = 'recebido';
        } else if (algunsRecebidos) {
            conta.status = 'parcial';
        } else {
            conta.status = 'pendente';
        }
        
        if (this.salvar(dados)) {
            return { sucesso: true, mensagem: "Recebimento cancelado. Contas removidas." };
        }
        
        return { sucesso: false, mensagem: "Erro ao cancelar" };
    },
    
    marcarContaRecebida(indice) {
        const dados = this.carregar();
        
        if (indice < 0 || indice >= dados.contasReceber.length) {
            return { sucesso: false, mensagem: "Conta não encontrada" };
        }
        
        dados.contasReceber[indice].status = 'recebido';
        dados.contasReceber[indice].dataRecebimento = new Date().toISOString().split('T')[0];
        
        if (this.salvar(dados)) {
            return { sucesso: true, mensagem: "Conta marcada como recebida" };
        }
        
        return { sucesso: false, mensagem: "Erro ao atualizar" };
    },
    
    // ==================== RESUMO FINANCEIRO ====================
    
    calcularResumoGeral() {
        const totaisReceber = this.calcularTotaisContasReceber();
        const totaisPagar = this.calcularTotaisContasPagar();
        
        // CAIXA REAL = só o que JÁ entrou - o que JÁ saiu
        const caixaReal = totaisReceber.recebidas - totaisPagar.pagas;
        
        return {
            receber: totaisReceber,
            pagar: totaisPagar,
            caixaReal
        };
    },
    
    exportar() {
        const dados = this.carregar();
        return JSON.stringify(dados, null, 2);
    },
    
    importar(jsonString) {
        try {
            const dados = JSON.parse(jsonString);
            
            if (!dados.contasPagar || !Array.isArray(dados.contasPagar)) {
                return { sucesso: false, mensagem: "Formato inválido" };
            }
            
            if (this.salvar(dados)) {
                return { sucesso: true, mensagem: "Dados importados com sucesso" };
            }
            
            return { sucesso: false, mensagem: "Erro ao importar" };
        } catch (erro) {
            return { sucesso: false, mensagem: "Arquivo inválido" };
        }
    },
    
    limparTudo() {
        return this.salvar({ contasPagar: [], contasReceber: [] });
    }
};

// Compatibilidade
let dbFinanceiro = DB_FINANCEIRO.carregar();

function salvarDBFinanceiro() {
    DB_FINANCEIRO.salvar(dbFinanceiro);
}

console.log("✅ db-financeiro.js v5.0 carregado (Hierárquico - Gerenciamento por Produto)");