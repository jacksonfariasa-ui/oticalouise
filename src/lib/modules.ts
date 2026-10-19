// Configuração dos módulos genéricos (tabela + cadastro). Dados de exemplo fictícios.
export type FieldType = "t" | "m" | "d" | "n" | string[];
export type Field = [key: string, label: string, type: FieldType];
export type Mod = { desc: string; campos: Field[]; linhas: (string | number)[][]; status?: string; valor?: string };

const ST_OS = ["Aberta", "No laboratório", "Montagem", "Pronta", "Entregue"];
const PAG = ["Dinheiro", "PIX", "Cartão de crédito", "Cartão de débito", "Boleto", "Crediário"];

export const MODULES: Record<string, Mod> = {
  orcamentos: {
    desc: "Propostas enviadas aos clientes", status: "status", valor: "valor",
    campos: [["numero", "Nº", "t"], ["cliente", "Cliente", "t"], ["itens", "Itens", "t"], ["data", "Data", "d"], ["validade", "Validade", "d"], ["valor", "Valor", "m"], ["status", "Status", ["Pendente", "Aprovado", "Recusado", "Expirado"]]],
    linhas: [],
  },
  "ordens-de-servico": {
    desc: "Acompanhamento de óculos em produção", status: "etapa", valor: "valor",
    campos: [["os", "O.S.", "t"], ["cliente", "Cliente", "t"], ["servico", "Serviço", "t"], ["laboratorio", "Laboratório", "t"], ["previsao", "Previsão", "d"], ["valor", "Valor", "m"], ["etapa", "Etapa", ST_OS]],
    linhas: [],
  },
  vendas: {
    desc: "Vendas realizadas na loja", status: "pagamento", valor: "total",
    campos: [["numero", "Venda", "t"], ["cliente", "Cliente", "t"], ["vendedor", "Vendedor", "t"], ["data", "Data", "d"], ["pagamento", "Pagamento", PAG], ["total", "Total", "m"]],
    linhas: [],
  },
  pedidos: {
    desc: "Pedidos de compra a fornecedores", status: "status", valor: "valor",
    campos: [["numero", "Pedido", "t"], ["fornecedor", "Fornecedor", "t"], ["itens", "Itens", "t"], ["data", "Data", "d"], ["valor", "Valor", "m"], ["status", "Status", ["Enviado", "Em trânsito", "Recebido", "Cancelado"]]],
    linhas: [],
  },
  "etapas-os": {
    desc: "Fluxo de produção configurado para as O.S.",
    campos: [["ordem", "Ordem", "n"], ["etapa", "Etapa", "t"], ["responsavel", "Responsável", "t"], ["prazo", "Prazo (dias)", "n"], ["aviso", "Avisar cliente", ["Sim", "Não"]]],
    linhas: [],
  },
  "painel-estrategico": {
    desc: "Metas e indicadores do mês", status: "situacao",
    campos: [["meta", "Meta", "t"], ["objetivo", "Objetivo", "t"], ["realizado", "Realizado", "t"], ["situacao", "Situação", ["No caminho", "Atenção", "Atingida"]]],
    linhas: [],
  },
  cashback: {
    desc: "Saldo de cashback dos clientes", valor: "saldo", status: "status",
    campos: [["cliente", "Cliente", "t"], ["saldo", "Saldo", "m"], ["validade", "Validade", "d"], ["status", "Status", ["Disponível", "Usado", "Expirado"]]],
    linhas: [],
  },
  "boleto-facil": {
    desc: "Boletos emitidos para clientes", valor: "valor", status: "status",
    campos: [["cliente", "Cliente", "t"], ["vencimento", "Vencimento", "d"], ["valor", "Valor", "m"], ["status", "Status", ["Em aberto", "Pago", "Vencido"]]],
    linhas: [],
  },
  agenda: {
    desc: "Exames de vista e retornos agendados", status: "status",
    campos: [["data", "Data", "d"], ["hora", "Hora", "t"], ["cliente", "Cliente", "t"], ["servico", "Serviço", ["Exame de vista", "Adaptação de LC", "Ajuste de armação", "Retirada"]], ["status", "Status", ["Agendado", "Confirmado", "Realizado", "Faltou"]]],
    linhas: [],
  },
  "certificado-digital": {
    desc: "Certificados para emissão de notas fiscais", status: "status",
    campos: [["tipo", "Tipo", ["A1", "A3"]], ["titular", "Titular", "t"], ["validade", "Validade", "d"], ["status", "Status", ["Válido", "Vence em breve", "Vencido"]]],
    linhas: [],
  },
  "plug-chat": {
    desc: "Conversas recebidas pelo chat do site", status: "status",
    campos: [["cliente", "Cliente", "t"], ["canal", "Canal", ["Site", "Instagram", "Facebook"]], ["assunto", "Assunto", "t"], ["status", "Status", ["Novo", "Em atendimento", "Resolvido"]]],
    linhas: [],
  },
  "indicadores-inteligentes": {
    desc: "Indicadores calculados automaticamente", status: "tendencia",
    campos: [["indicador", "Indicador", "t"], ["valor", "Valor", "t"], ["periodo", "Período", "t"], ["tendencia", "Tendência", ["Alta", "Estável", "Queda"]]],
    linhas: [],
  },
  "agente-consultivo": {
    desc: "Recomendações para aumentar vendas", status: "prioridade",
    campos: [["sugestao", "Sugestão", "t"], ["motivo", "Motivo", "t"], ["prioridade", "Prioridade", ["Alta", "Média", "Baixa"]]],
    linhas: [],
  },
  "pupilometro-virtual": {
    desc: "Medições de distância pupilar", 
    campos: [["cliente", "Cliente", "t"], ["data", "Data", "d"], ["dp", "DP (mm)", "n"], ["altura", "Altura (mm)", "n"]],
    linhas: [],
  },
  "analise-de-credito": {
    desc: "Consultas de crédito para crediário", status: "resultado",
    campos: [["cliente", "Cliente", "t"], ["cpf", "CPF", "t"], ["limite", "Limite sugerido", "m"], ["resultado", "Resultado", ["Aprovado", "Em análise", "Negado"]]],
    linhas: [],
  },
  "vitrine-online": {
    desc: "Produtos publicados na loja online", valor: "preco", status: "visivel",
    campos: [["produto", "Produto", "t"], ["preco", "Preço", "m"], ["visualizacoes", "Visualizações", "n"], ["visivel", "Publicado", ["Sim", "Não"]]],
    linhas: [],
  },
  "venda-mais": {
    desc: "Oportunidades de venda com clientes da base", status: "etapa", valor: "potencial",
    campos: [["cliente", "Cliente", "t"], ["oportunidade", "Oportunidade", "t"], ["potencial", "Potencial", "m"], ["etapa", "Etapa", ["Contatar", "Em negociação", "Ganha", "Perdida"]]],
    linhas: [],
  },
  marketing: {
    desc: "Campanhas de comunicação com clientes", status: "status",
    campos: [["campanha", "Campanha", "t"], ["canal", "Canal", ["WhatsApp", "E-mail", "SMS", "Instagram"]], ["publico", "Público", "n"], ["envio", "Envio", "d"], ["status", "Status", ["Rascunho", "Agendada", "Enviada"]]],
    linhas: [],
  },
  relatorios: {
    desc: "Relatórios disponíveis para gerar",
    campos: [["relatorio", "Relatório", "t"], ["categoria", "Categoria", ["Vendas", "Financeiro", "Estoque", "Clientes"]], ["ultima", "Última geração", "d"]],
    linhas: [],
  },
  "contas-a-pagar": {
    desc: "Despesas e fornecedores a pagar", valor: "valor", status: "status",
    campos: [["descricao", "Descrição", "t"], ["fornecedor", "Fornecedor", "t"], ["vencimento", "Vencimento", "d"], ["valor", "Valor", "m"], ["status", "Status", ["Em aberto", "Pago", "Vencido"]]],
    linhas: [],
  },
  "contas-a-receber": {
    desc: "Parcelas e boletos de clientes", valor: "valor", status: "status",
    campos: [["cliente", "Cliente", "t"], ["parcela", "Parcela", "t"], ["vencimento", "Vencimento", "d"], ["valor", "Valor", "m"], ["status", "Status", ["Em aberto", "Recebido", "Atrasado"]]],
    linhas: [],
  },
  "fluxo-de-caixa": {
    desc: "Entradas e saídas do caixa", valor: "valor", status: "tipo",
    campos: [["data", "Data", "d"], ["descricao", "Descrição", "t"], ["tipo", "Tipo", ["Entrada", "Saída"]], ["valor", "Valor", "m"]],
    linhas: [],
  },
  "validade-de-produtos": {
    desc: "Produtos com data de validade", status: "situacao",
    campos: [["produto", "Produto", "t"], ["lote", "Lote", "t"], ["validade", "Validade", "d"], ["quantidade", "Qtd.", "n"], ["situacao", "Situação", ["Vencido", "A vencer", "OK"]]],
    linhas: [],
  },
  "produtos-abaixo-do-minimo": {
    desc: "Itens que precisam de reposição",
    campos: [["produto", "Produto", "t"], ["atual", "Estoque atual", "n"], ["minimo", "Mínimo", "n"], ["fornecedor", "Fornecedor", "t"]],
    linhas: [],
  },
  "controle-patrimonial": {
    desc: "Equipamentos e bens da loja", valor: "valor", status: "estado",
    campos: [["bem", "Bem", "t"], ["local", "Local", "t"], ["aquisicao", "Aquisição", "d"], ["valor", "Valor", "m"], ["estado", "Estado", ["Em uso", "Em manutenção", "Baixado"]]],
    linhas: [],
  },
  cadastros: {
    desc: "Fornecedores, vendedores e laboratórios", status: "tipo",
    campos: [["nome", "Nome", "t"], ["tipo", "Tipo", ["Fornecedor", "Vendedor", "Laboratório", "Médico"]], ["telefone", "Telefone", "t"], ["email", "E-mail", "t"]],
    linhas: [],
  },
  administracao: {
    desc: "Usuários e permissões do sistema", status: "perfil",
    campos: [["nome", "Usuário", "t"], ["email", "E-mail", "t"], ["perfil", "Perfil", ["Administrador", "Gerente", "Vendedor", "Caixa"]], ["acesso", "Último acesso", "d"]],
    linhas: [],
  },
};
