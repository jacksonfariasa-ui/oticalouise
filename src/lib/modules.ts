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
    linhas: [["ORC-2210", "Mariana Souza", "Armação Ray-Ban + Varilux Comfort", "2026-10-15", "2026-10-30", 2579.9, "Pendente"], ["ORC-2209", "Carlos Mendes", "Lentes Stylis 1.67", "2026-10-14", "2026-10-29", 1190, "Aprovado"], ["ORC-2205", "Beatriz Ramos", "Óculos de sol Aviator", "2026-10-02", "2026-10-12", 899, "Expirado"], ["ORC-2201", "Diego Faria", "Armação Oakley + Crizal", "2026-09-28", "2026-10-13", 1339, "Recusado"]],
  },
  "ordens-de-servico": {
    desc: "Acompanhamento de óculos em produção", status: "etapa", valor: "valor",
    campos: [["os", "O.S.", "t"], ["cliente", "Cliente", "t"], ["servico", "Serviço", "t"], ["laboratorio", "Laboratório", "t"], ["previsao", "Previsão", "d"], ["valor", "Valor", "m"], ["etapa", "Etapa", ST_OS]],
    linhas: [["10490", "Juliana Castro", "Multifocal Varilux X", "Essilor Lab", "2026-10-22", 3790, "No laboratório"], ["10482", "Mariana Souza", "Monofocal Crizal", "Lab Visão", "2026-10-17", 590, "Pronta"], ["10471", "Rafael Teixeira", "Montagem armação própria", "Interno", "2026-10-14", 180, "Montagem"], ["10465", "Fernanda Lima", "Multifocal Zeiss", "Zeiss Lab", "2026-10-10", 3290, "Entregue"]],
  },
  vendas: {
    desc: "Vendas realizadas na loja", status: "pagamento", valor: "total",
    campos: [["numero", "Venda", "t"], ["cliente", "Cliente", "t"], ["vendedor", "Vendedor", "t"], ["data", "Data", "d"], ["pagamento", "Pagamento", PAG], ["total", "Total", "m"]],
    linhas: [["V-8841", "Mariana Souza", "Ana Paula", "2026-10-17", "Cartão de crédito", 2579.9], ["V-8840", "Lucas Martins", "Ricardo", "2026-10-17", "PIX", 419.8], ["V-8838", "Carlos Mendes", "Ana Paula", "2026-10-16", "Crediário", 1599], ["V-8835", "Patrícia Gomes", "Ricardo", "2026-10-15", "Dinheiro", 219.9]],
  },
  pedidos: {
    desc: "Pedidos de compra a fornecedores", status: "status", valor: "valor",
    campos: [["numero", "Pedido", "t"], ["fornecedor", "Fornecedor", "t"], ["itens", "Itens", "t"], ["data", "Data", "d"], ["valor", "Valor", "m"], ["status", "Status", ["Enviado", "Em trânsito", "Recebido", "Cancelado"]]],
    linhas: [["PC-512", "Luxottica", "12 armações Ray-Ban", "2026-10-10", 5120.5, "Em trânsito"], ["PC-511", "Johnson & Johnson", "30 cx Acuvue Oasys", "2026-10-08", 3300, "Recebido"], ["PC-510", "Distribuidora Ótica SP", "200 flanelas + 50 estojos", "2026-10-05", 640, "Enviado"]],
  },
  "etapas-os": {
    desc: "Fluxo de produção configurado para as O.S.",
    campos: [["ordem", "Ordem", "n"], ["etapa", "Etapa", "t"], ["responsavel", "Responsável", "t"], ["prazo", "Prazo (dias)", "n"], ["aviso", "Avisar cliente", ["Sim", "Não"]]],
    linhas: [[1, "Aberta", "Vendedor", 0, "Não"], [2, "No laboratório", "Laboratório", 5, "Não"], [3, "Montagem", "Montador", 1, "Não"], [4, "Pronta", "Loja", 0, "Sim"], [5, "Entregue", "Vendedor", 0, "Sim"]],
  },
  "painel-estrategico": {
    desc: "Metas e indicadores do mês", status: "situacao",
    campos: [["meta", "Meta", "t"], ["objetivo", "Objetivo", "t"], ["realizado", "Realizado", "t"], ["situacao", "Situação", ["No caminho", "Atenção", "Atingida"]]],
    linhas: [["Faturamento mensal", "R$ 120.000", "R$ 78.430", "No caminho"], ["Ticket médio", "R$ 900", "R$ 812", "Atenção"], ["Novos clientes", "60", "64", "Atingida"], ["Conversão de orçamentos", "45%", "38%", "Atenção"]],
  },
  cashback: {
    desc: "Saldo de cashback dos clientes", valor: "saldo", status: "status",
    campos: [["cliente", "Cliente", "t"], ["saldo", "Saldo", "m"], ["validade", "Validade", "d"], ["status", "Status", ["Disponível", "Usado", "Expirado"]]],
    linhas: [["Mariana Souza", 128.99, "2027-01-15", "Disponível"], ["Carlos Mendes", 79.95, "2026-12-16", "Disponível"], ["Helena Duarte", 45, "2026-09-30", "Expirado"]],
  },
  "boleto-facil": {
    desc: "Boletos emitidos para clientes", valor: "valor", status: "status",
    campos: [["cliente", "Cliente", "t"], ["vencimento", "Vencimento", "d"], ["valor", "Valor", "m"], ["status", "Status", ["Em aberto", "Pago", "Vencido"]]],
    linhas: [["Fernanda Lima", "2026-10-10", 1240, "Vencido"], ["Roberto Alves", "2026-10-25", 320, "Em aberto"], ["Sandra Nunes", "2026-10-05", 450, "Pago"]],
  },
  agenda: {
    desc: "Exames de vista e retornos agendados", status: "status",
    campos: [["data", "Data", "d"], ["hora", "Hora", "t"], ["cliente", "Cliente", "t"], ["servico", "Serviço", ["Exame de vista", "Adaptação de LC", "Ajuste de armação", "Retirada"]], ["status", "Status", ["Agendado", "Confirmado", "Realizado", "Faltou"]]],
    linhas: [["2026-10-18", "09:00", "Lucas Martins", "Exame de vista", "Confirmado"], ["2026-10-18", "10:30", "Patrícia Gomes", "Adaptação de LC", "Agendado"], ["2026-10-17", "15:00", "Diego Faria", "Ajuste de armação", "Realizado"]],
  },
  "certificado-digital": {
    desc: "Certificados para emissão de notas fiscais", status: "status",
    campos: [["tipo", "Tipo", ["A1", "A3"]], ["titular", "Titular", "t"], ["validade", "Validade", "d"], ["status", "Status", ["Válido", "Vence em breve", "Vencido"]]],
    linhas: [["A1", "Ótica Louise LTDA", "2027-03-12", "Válido"], ["A3", "Filial Centro", "2026-11-02", "Vence em breve"]],
  },
  "plug-chat": {
    desc: "Conversas recebidas pelo chat do site", status: "status",
    campos: [["cliente", "Cliente", "t"], ["canal", "Canal", ["Site", "Instagram", "Facebook"]], ["assunto", "Assunto", "t"], ["status", "Status", ["Novo", "Em atendimento", "Resolvido"]]],
    linhas: [["Bruna Lopes", "Instagram", "Preço de lente multifocal", "Novo"], ["Marcos Vieira", "Site", "Horário de funcionamento", "Resolvido"], ["Tiago Reis", "Facebook", "Status da O.S. 10490", "Em atendimento"]],
  },
  "indicadores-inteligentes": {
    desc: "Indicadores calculados automaticamente", status: "tendencia",
    campos: [["indicador", "Indicador", "t"], ["valor", "Valor", "t"], ["periodo", "Período", "t"], ["tendencia", "Tendência", ["Alta", "Estável", "Queda"]]],
    linhas: [["Taxa de recompra", "34%", "12 meses", "Alta"], ["Tempo médio de entrega", "6 dias", "30 dias", "Estável"], ["Inadimplência", "4,2%", "30 dias", "Queda"]],
  },
  "agente-consultivo": {
    desc: "Recomendações para aumentar vendas", status: "prioridade",
    campos: [["sugestao", "Sugestão", "t"], ["motivo", "Motivo", "t"], ["prioridade", "Prioridade", ["Alta", "Média", "Baixa"]]],
    linhas: [["Ligar para 27 clientes com receita vencida", "Alta chance de nova compra", "Alta"], ["Repor estojos rígidos", "Estoque abaixo do mínimo", "Média"], ["Campanha para aniversariantes", "12 aniversariantes nesta semana", "Média"]],
  },
  "pupilometro-virtual": {
    desc: "Medições de distância pupilar", 
    campos: [["cliente", "Cliente", "t"], ["data", "Data", "d"], ["dp", "DP (mm)", "n"], ["altura", "Altura (mm)", "n"]],
    linhas: [["Mariana Souza", "2026-10-15", 62, 18], ["Juliana Castro", "2026-10-12", 60, 20]],
  },
  "analise-de-credito": {
    desc: "Consultas de crédito para crediário", status: "resultado",
    campos: [["cliente", "Cliente", "t"], ["cpf", "CPF", "t"], ["limite", "Limite sugerido", "m"], ["resultado", "Resultado", ["Aprovado", "Em análise", "Negado"]]],
    linhas: [["Carlos Mendes", "987.654.321-00", 2500, "Aprovado"], ["Bruna Lopes", "111.222.333-44", 0, "Em análise"], ["Tiago Reis", "555.666.777-88", 0, "Negado"]],
  },
  "vitrine-online": {
    desc: "Produtos publicados na loja online", valor: "preco", status: "visivel",
    campos: [["produto", "Produto", "t"], ["preco", "Preço", "m"], ["visualizacoes", "Visualizações", "n"], ["visivel", "Publicado", ["Sim", "Não"]]],
    linhas: [["Óculos Ray-Ban Aviator", 899, 1240, "Sim"], ["Armação Oakley OX8046", 749, 530, "Sim"], ["Acuvue Oasys cx 6", 219.9, 310, "Não"]],
  },
  "venda-mais": {
    desc: "Oportunidades de venda com clientes da base", status: "etapa", valor: "potencial",
    campos: [["cliente", "Cliente", "t"], ["oportunidade", "Oportunidade", "t"], ["potencial", "Potencial", "m"], ["etapa", "Etapa", ["Contatar", "Em negociação", "Ganha", "Perdida"]]],
    linhas: [["Helena Duarte", "Receita vencida há 30 dias", 1200, "Contatar"], ["Marcos Vieira", "Segundo par com 30% OFF", 650, "Em negociação"], ["Ana Beatriz Rocha", "Troca para multifocal", 2800, "Ganha"]],
  },
  marketing: {
    desc: "Campanhas de comunicação com clientes", status: "status",
    campos: [["campanha", "Campanha", "t"], ["canal", "Canal", ["WhatsApp", "E-mail", "SMS", "Instagram"]], ["publico", "Público", "n"], ["envio", "Envio", "d"], ["status", "Status", ["Rascunho", "Agendada", "Enviada"]]],
    linhas: [["Outubro Rosa", "WhatsApp", 820, "2026-10-01", "Enviada"], ["Aniversariantes da semana", "SMS", 12, "2026-10-18", "Agendada"], ["Black Friday", "E-mail", 2140, "2026-11-20", "Rascunho"]],
  },
  relatorios: {
    desc: "Relatórios disponíveis para gerar",
    campos: [["relatorio", "Relatório", "t"], ["categoria", "Categoria", ["Vendas", "Financeiro", "Estoque", "Clientes"]], ["ultima", "Última geração", "d"]],
    linhas: [["Vendas por vendedor", "Vendas", "2026-10-16"], ["DRE simplificado", "Financeiro", "2026-10-01"], ["Curva ABC de produtos", "Estoque", "2026-09-30"], ["Clientes inativos", "Clientes", "2026-10-10"]],
  },
  "contas-a-pagar": {
    desc: "Despesas e fornecedores a pagar", valor: "valor", status: "status",
    campos: [["descricao", "Descrição", "t"], ["fornecedor", "Fornecedor", "t"], ["vencimento", "Vencimento", "d"], ["valor", "Valor", "m"], ["status", "Status", ["Em aberto", "Pago", "Vencido"]]],
    linhas: [["Lentes", "Essilor", "2026-10-20", 6200, "Em aberto"], ["Aluguel", "Imobiliária Centro", "2026-11-05", 4500, "Em aberto"], ["Armações", "Luxottica", "2026-10-14", 5120.5, "Vencido"], ["Energia", "Enel", "2026-10-22", 610, "Em aberto"]],
  },
  "contas-a-receber": {
    desc: "Parcelas e boletos de clientes", valor: "valor", status: "status",
    campos: [["cliente", "Cliente", "t"], ["parcela", "Parcela", "t"], ["vencimento", "Vencimento", "d"], ["valor", "Valor", "m"], ["status", "Status", ["Em aberto", "Recebido", "Atrasado"]]],
    linhas: [["Mariana Souza", "3/6", "2026-10-20", 280, "Em aberto"], ["Carlos Mendes", "1/10", "2026-10-16", 159.9, "Recebido"], ["Fernanda Lima", "Boleto", "2026-10-10", 1240, "Atrasado"]],
  },
  "fluxo-de-caixa": {
    desc: "Entradas e saídas do caixa", valor: "valor", status: "tipo",
    campos: [["data", "Data", "d"], ["descricao", "Descrição", "t"], ["tipo", "Tipo", ["Entrada", "Saída"]], ["valor", "Valor", "m"]],
    linhas: [["2026-10-17", "Vendas do dia", "Entrada", 3219.6], ["2026-10-17", "Compra de material", "Saída", 180], ["2026-10-16", "Vendas do dia", "Entrada", 4870], ["2026-10-16", "Pagamento motoboy", "Saída", 95]],
  },
  "validade-de-produtos": {
    desc: "Produtos com data de validade", status: "situacao",
    campos: [["produto", "Produto", "t"], ["lote", "Lote", "t"], ["validade", "Validade", "d"], ["quantidade", "Qtd.", "n"], ["situacao", "Situação", ["Vencido", "A vencer", "OK"]]],
    linhas: [["Solução Renu 355ml", "L2231", "2026-09-30", 6, "Vencido"], ["Acuvue Oasys cx 6", "AO889", "2026-11-30", 14, "A vencer"], ["Colírio lubrificante", "CL102", "2026-12-15", 20, "A vencer"]],
  },
  "produtos-abaixo-do-minimo": {
    desc: "Itens que precisam de reposição",
    campos: [["produto", "Produto", "t"], ["atual", "Estoque atual", "n"], ["minimo", "Mínimo", "n"], ["fornecedor", "Fornecedor", "t"]],
    linhas: [["Armação Oakley OX8046", 1, 3, "Luxottica"], ["Estojo rígido preto", 4, 20, "Distribuidora Ótica SP"], ["Flanela microfibra", 12, 50, "Distribuidora Ótica SP"]],
  },
  "controle-patrimonial": {
    desc: "Equipamentos e bens da loja", valor: "valor", status: "estado",
    campos: [["bem", "Bem", "t"], ["local", "Local", "t"], ["aquisicao", "Aquisição", "d"], ["valor", "Valor", "m"], ["estado", "Estado", ["Em uso", "Em manutenção", "Baixado"]]],
    linhas: [["Autorrefrator Topcon", "Consultório", "2023-05-10", 38000, "Em uso"], ["Lensômetro digital", "Laboratório", "2022-08-02", 9500, "Em uso"], ["Biseladora automática", "Laboratório", "2021-03-15", 62000, "Em manutenção"], ["Computador caixa", "Balcão", "2020-01-20", 3200, "Baixado"]],
  },
  cadastros: {
    desc: "Fornecedores, vendedores e laboratórios", status: "tipo",
    campos: [["nome", "Nome", "t"], ["tipo", "Tipo", ["Fornecedor", "Vendedor", "Laboratório", "Médico"]], ["telefone", "Telefone", "t"], ["email", "E-mail", "t"]],
    linhas: [["Essilor", "Fornecedor", "(11) 3000-1000", "pedidos@essilor.com.br"], ["Ana Paula", "Vendedor", "(11) 98888-1111", "ana@visaootica.com.br"], ["Lab Visão", "Laboratório", "(11) 3222-4444", "contato@labvisao.com.br"], ["Dr. Paulo Lima", "Médico", "(11) 3555-7777", "dr.paulo@clinica.com.br"]],
  },
  administracao: {
    desc: "Usuários e permissões do sistema", status: "perfil",
    campos: [["nome", "Usuário", "t"], ["email", "E-mail", "t"], ["perfil", "Perfil", ["Administrador", "Gerente", "Vendedor", "Caixa"]], ["acesso", "Último acesso", "d"]],
    linhas: [["Jackson Farias", "jackson@visaootica.com.br", "Administrador", "2026-10-17"], ["Ana Paula", "ana@visaootica.com.br", "Vendedor", "2026-10-17"], ["Ricardo", "ricardo@visaootica.com.br", "Vendedor", "2026-10-16"], ["Cláudia", "claudia@visaootica.com.br", "Caixa", "2026-10-15"]],
  },
};
