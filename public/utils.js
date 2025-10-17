// utils.js - Funções utilitárias centralizadas
// Importar este arquivo em todos os HTMLs: <script src="utils.js"></script>

// ==================== FORMATAÇÃO DE MOEDA ====================

/**
 * Formata valor em centavos para moeda brasileira (R$ 0,00)
 * @param {number|string} valor - Valor em centavos ou string
 * @returns {string} Valor formatado (ex: "R$ 1.234,56")
 */
function formatarMoedaBR(valor) {
    if (valor === null || valor === undefined) return "R$ 0,00";
    
    // Se for string, converte para centavos primeiro
    if (typeof valor === "string") {
        valor = parseInt(valor.replace(/\D/g, '')) || 0;
    }
    
    if (isNaN(valor)) valor = 0;
    
    return (valor / 100).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

/**
 * Converte valor monetário para centavos
 * @param {string} valor - Valor formatado ou não
 * @returns {number} Valor em centavos
 */
function parseMoedaToCentavos(valor) {
    if (!valor) return 0;
    return parseInt(valor.toString().replace(/\D/g, '')) || 0;
}

/**
 * Aplica máscara de moeda em tempo real em um input
 * @param {HTMLInputElement} input - Elemento input
 */
function aplicarMascaraMoeda(input) {
    input.addEventListener('input', (e) => {
        const pos = input.selectionStart;
        const valorAntes = input.value;
        
        input.value = formatarMoedaBR(input.value);
        
        const diff = input.value.length - valorAntes.length;
        input.setSelectionRange(pos + diff, pos + diff);
    });
}

// ==================== FORMATAÇÃO DE DATA ====================

/**
 * Aplica máscara DD/MM/AAAA em um input
 * @param {HTMLInputElement} input - Elemento input
 */
function aplicarMascaraData(input) {
    input.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 8);
        
        if (v.length >= 5) {
            e.target.value = v.replace(/(\d{2})(\d{2})(\d{0,4})/, "$1/$2/$3");
        } else if (v.length >= 3) {
            e.target.value = v.replace(/(\d{2})(\d{0,2})/, "$1/$2");
        } else {
            e.target.value = v;
        }
    });
}

/**
 * Valida se a data está no formato correto e é válida
 * @param {string} data - Data no formato DD/MM/AAAA
 * @returns {boolean} True se válida
 */
function validarData(data) {
    if (!data) return false;
    
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = data.match(regex);
    
    if (!match) return false;
    
    const [, dia, mes, ano] = match.map(Number);
    
    // Validações básicas
    if (mes < 1 || mes > 12) return false;
    if (dia < 1 || dia > 31) return false;
    if (ano < 1900 || ano > 2100) return false;
    
    // Valida dias por mês
    const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Verifica ano bissexto
    if ((ano % 4 === 0 && ano % 100 !== 0) || (ano % 400 === 0)) {
        diasPorMes[1] = 29;
    }
    
    if (dia > diasPorMes[mes - 1]) return false;
    
    return true;
}

/**
 * Compara duas datas no formato DD/MM/AAAA
 * @param {string} data1 - Primeira data
 * @param {string} data2 - Segunda data
 * @returns {number} -1 se data1 < data2, 0 se igual, 1 se data1 > data2
 */
function compararDatas(data1, data2) {
    const [d1, m1, a1] = data1.split('/').map(Number);
    const [d2, m2, a2] = data2.split('/').map(Number);
    
    const date1 = new Date(a1, m1 - 1, d1);
    const date2 = new Date(a2, m2 - 1, d2);
    
    if (date1 < date2) return -1;
    if (date1 > date2) return 1;
    return 0;
}

/**
 * Verifica se data2 é maior ou igual a data1
 * @param {string} dataInicio - Data inicial
 * @param {string} dataFim - Data final
 * @returns {boolean} True se dataFim >= dataInicio
 */
function dataFimMaiorQueInicio(dataInicio, dataFim) {
    return compararDatas(dataInicio, dataFim) <= 0;
}

// ==================== VALIDAÇÃO DE DOCUMENTOS ====================

/**
 * Valida CPF (com ou sem formatação)
 * @param {string} cpf - CPF a validar
 * @returns {boolean} True se válido
 */
function validarCPF(cpf) {
    if (!cpf) return false;
    
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

/**
 * Aplica máscara de CPF: 000.000.000-00
 * @param {HTMLInputElement} input - Elemento input
 */
function aplicarMascaraCPF(input) {
    input.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
        
        if (v.length >= 10) {
            v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
        } else if (v.length >= 7) {
            v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
        } else if (v.length >= 4) {
            v = v.replace(/(\d{3})(\d{0,3})/, "$1.$2");
        }
        
        e.target.value = v;
    });
}

/**
 * Valida email
 * @param {string} email - Email a validar
 * @returns {boolean} True se válido
 */
function validarEmail(email) {
    if (!email) return false;
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Aplica máscara de telefone: (00) 00000-0000 ou (00) 0000-0000
 * @param {HTMLInputElement} input - Elemento input
 */
function aplicarMascaraTelefone(input) {
    input.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 11);
        
        if (v.length >= 11) {
            v = v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        } else if (v.length >= 10) {
            v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
        } else if (v.length >= 6) {
            v = v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
        } else if (v.length >= 2) {
            v = v.replace(/(\d{2})/, "($1) ");
        }
        
        e.target.value = v;
    });
}

/**
 * Aplica máscara de CEP: 00000-000
 * @param {HTMLInputElement} input - Elemento input
 */
function aplicarMascaraCEP(input) {
    input.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 8);
        
        if (v.length >= 6) {
            v = v.replace(/(\d{5})(\d{0,3})/, "$1-$2");
        }
        
        e.target.value = v;
    });
}

// ==================== SISTEMA DE NOTIFICAÇÕES ====================

/**
 * Mostra notificação toast na tela
 * @param {string} mensagem - Mensagem a exibir
 * @param {string} tipo - 'success', 'error', 'warning', 'info'
 * @param {number} duracao - Duração em ms (padrão: 3000)
 */
function mostrarNotificacao(mensagem, tipo = 'info', duracao = 3000) {
    // Cria container de toasts se não existir
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    
    // Define cores por tipo
    const cores = {
        success: { bg: '#48bb78', icon: '✓' },
        error: { bg: '#e53e3e', icon: '✕' },
        warning: { bg: '#ed8936', icon: '⚠' },
        info: { bg: '#4299e1', icon: 'ℹ' }
    };
    
    const config = cores[tipo] || cores.info;
    
    // Cria toast
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${config.bg};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 250px;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    
    toast.innerHTML = `
        <span style="font-size: 20px; font-weight: bold;">${config.icon}</span>
        <span style="flex: 1;">${mensagem}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            line-height: 1;
        ">×</button>
    `;
    
    container.appendChild(toast);
    
    // Remove automaticamente
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, duracao);
}

// Adiciona CSS da animação
if (!document.getElementById('toast-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-animation-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ==================== BUSCA DE CEP ====================

/**
 * Busca CEP na API ViaCEP e preenche campos
 * @param {HTMLInputElement} inputCEP - Input do CEP
 * @param {HTMLInputElement} inputRua - Input da rua
 * @param {HTMLInputElement} inputBairro - Input do bairro
 * @param {HTMLInputElement} inputCidade - Input da cidade
 * @param {HTMLInputElement} inputEstado - Input do estado
 * @returns {Promise<boolean>} True se encontrou o CEP
 */
async function buscarCEP(inputCEP, inputRua, inputBairro, inputCidade, inputEstado) {
    const cep = inputCEP.value.replace(/\D/g, '');
    
    if (!cep || cep.length !== 8) {
        mostrarNotificacao('Digite um CEP válido com 8 dígitos', 'warning');
        return false;
    }
    
    try {
        mostrarNotificacao('Buscando CEP...', 'info', 1500);
        
        const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await resp.json();
        
        if (data.erro) {
            mostrarNotificacao('CEP não encontrado', 'error');
            return false;
        }
        
        inputRua.value = data.logradouro || "";
        inputBairro.value = data.bairro || "";
        inputCidade.value = data.localidade || "";
        inputEstado.value = data.uf || "";
        
        mostrarNotificacao('CEP encontrado com sucesso!', 'success');
        return true;
        
    } catch (e) {
        mostrarNotificacao('Erro ao buscar CEP. Verifique sua conexão.', 'error');
        console.error('Erro na busca de CEP:', e);
        return false;
    }
}

// ==================== VALIDAÇÃO DE PASSAPORTE ====================

/**
 * Verifica se o passaporte vence em menos de 1 ano e retorna aviso
 * @param {string} dataValidade - Data de validade no formato DD/MM/AAAA
 * @returns {object} { venceEmBreve: boolean, diasRestantes: number, mensagem: string }
 */
function verificarValidadePassaporte(dataValidade) {
    if (!dataValidade || !validarData(dataValidade)) {
        return { venceEmBreve: false, diasRestantes: null, mensagem: "" };
    }
    
    const [dia, mes, ano] = dataValidade.split('/').map(Number);
    const dataPassaporte = new Date(ano, mes - 1, dia);
    const hoje = new Date();
    
    const diffMs = dataPassaporte - hoje;
    const diasRestantes = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) {
        return {
            venceEmBreve: true,
            diasRestantes,
            mensagem: "⚠ PASSAPORTE VENCIDO!"
        };
    }
    
    if (diasRestantes <= 365) {
        return {
            venceEmBreve: true,
            diasRestantes,
            mensagem: `⚠ Vence em ${diasRestantes} dias (menos de 1 ano)!`
        };
    }
    
    return { venceEmBreve: false, diasRestantes, mensagem: "" };
}

// ==================== UTILITÁRIOS GERAIS ====================

/**
 * Gera ID único simples
 * @param {string} prefixo - Prefixo do ID
 * @returns {string} ID único
 */
function gerarId(prefixo = 'id') {
    return `${prefixo}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce para otimizar chamadas de funções
 * @param {Function} func - Função a executar
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função com debounce
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Sanitiza string para evitar XSS básico
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizada
 */
function sanitizarString(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==================== EXPORTAR FUNÇÕES ====================
// Todas as funções já estão globais automaticamente
console.log('✓ utils.js carregado com sucesso!');