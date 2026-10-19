// Tabela Essilor Varilux (multifocais) transcrita das imagens enviadas. Preços em pares, R$.
type Linha = [variante: string, faixa: string, precos: (number | null)[]];
type Bloco = { familia: string; colunas: string[]; linhas: Linha[] };

const A = ["Crizal Prevencia", "Crizal Sapphire HR", "Crizal Rock", "Crizal Easy Pro", "Optifog"];
const SOL = ["Crizal Sapphire HR Face Interna", "Optifog", "Verniz HC"];
const COR = ["Verniz HC"];
const _ = null;

const OR = "Orma", AW = "Airwear", S67 = "Stylis 1.67", S74 = "Stylis 1.74";
const TG = " Transitions Gen S", TE = " Transitions Extractive", BU = " Blue UV";
const XP = " Xperio cinza/marrom", CP = " Coloração padrão", CE = " Coloração especial";
const f10 = "-10,00 a +6,00", f12 = "-12,00 a +9,00", f14 = "-14,00 a +13,00";
const g11 = "-11,00 a +7,00", g12 = "-12,00 a +7,00", g14 = "-14,00 a +10,00", g1412 = "-14,00 a +12,00";

const BLOCOS: Bloco[] = [
  { familia: "Varilux XR pro", colunas: A, linhas: [
    [OR, f10, [10510, 10510, _, _, 9999]], [OR + TG, f10, [11960, 11960, _, _, 11449]], [OR + TE, f10, [12010, 12010, _, _, 11499]],
    [AW, f10, [10909, 10909, _, _, 10398]], [AW + TG, f10, [12359, 12359, _, _, 11848]], [AW + TE, f10, [12409, 12409, _, _, 11898]],
    [S67, f12, [13555, 13555, _, _, 13044]], [S67 + TG, f12, [15005, 15005, _, _, 14494]], [S67 + TE, f12, [15055, 15055, _, _, 14544]],
    [S74, f14, [_, 15340, _, _, _]], [S74 + TG, f14, [_, 16790, _, _, _]],
  ] },
  { familia: "Varilux XR pro Solares", colunas: SOL, linhas: [[OR + XP, f10, [10951, 10918, 10064]], [AW + XP, f10, [11350, 11317, 10463]]] },
  { familia: "Varilux XR pro Coloração", colunas: COR, linhas: [[OR + CP, f10, [9674]], [OR + CE, f10, [9784]], [AW + CP, f10, [10073]], [AW + CE, f10, [10183]]] },
  { familia: "Varilux XR track", colunas: A, linhas: [
    [OR, f10, [6455, 6455, 6085, 5619, 5944]], [OR + TG, f10, [7905, 7905, 7535, 7069, 7394]], [OR + TE, f10, [7955, 7955, 7585, 7119, 7444]],
    [AW, f10, [6854, 6854, 6484, 6018, 6343]], [AW + TG, f10, [8304, 8304, 7934, 7468, 7793]], [AW + TE, f10, [8354, 8354, 7984, 7518, 7843]],
    [S67, f12, [9500, 9500, 9130, 8664, 8989]], [S67 + TG, f12, [10950, 10950, 10580, 10114, 10439]], [S67 + TE, f12, [11000, 11000, 10630, 10164, 10489]],
    [S74, f14, [_, 11285, _, _, _]], [S74 + TG, f14, [_, 12735, _, _, _]],
  ] },
  { familia: "Varilux XR track Solares", colunas: SOL, linhas: [[OR + XP, f10, [6896, 6863, 6009]], [AW + XP, f10, [7295, 7262, 6408]]] },
  { familia: "Varilux XR track Coloração", colunas: COR, linhas: [[OR + CP, f10, [5619]], [OR + CE, f10, [5729]], [AW + CP, f10, [6018]], [AW + CE, f10, [6128]]] },
  { familia: "Varilux XR track Lite", colunas: A, linhas: [
    [OR, f10, [6185, 6185, 5815, 5349, 5674]], [OR + TG, f10, [7635, 7635, 7265, 6799, 7124]], [OR + TE, f10, [7685, 7685, 7315, 6849, 7174]],
    [AW, f10, [6584, 6584, 6214, 5748, 6073]], [AW + TG, f10, [8034, 8034, 7664, 7198, 7523]], [AW + TE, f10, [8084, 8084, 7714, 7248, 7573]],
    [S67, f12, [9230, 9230, 8860, 8394, 8719]], [S67 + TG, f12, [10730, 10730, 10360, 9894, 10219]], [S67 + TE, f12, [10680, 10680, 10310, 9844, 10169]],
    [S74, f14, [_, 11015, _, _, _]], [S74 + TG, f14, [_, 12465, _, _, _]],
  ] },
  { familia: "Varilux XR track Lite Solares", colunas: SOL, linhas: [[OR + XP, f10, [6626, 6593, 5739]], [AW + XP, f10, [7025, 6992, 6138]]] },
  { familia: "Varilux XR track Lite Coloração", colunas: COR, linhas: [[OR + CP, f10, [5349]], [OR + CE, f10, [5459]], [AW + CP, f10, [5748]], [AW + CE, f10, [5858]]] },
  { familia: "Varilux XR design", colunas: A, linhas: [
    [OR, f10, [5625, 5625, 5255, 4789, 5114]], [OR + TG, f10, [7075, 7075, 6705, 6239, 6564]], [OR + TE, f10, [7125, 7125, 6755, 6289, 6614]],
    [AW, f10, [6024, 6024, 5654, 5188, 5513]], [AW + TG, f10, [7474, 7474, 7104, 6638, 6963]], [AW + TE, f10, [7524, 7524, 7154, 6688, 7013]],
    [S67, f12, [8670, 8670, 8300, 7834, 8159]], [S67 + TG, f12, [10120, 10120, 9750, 9284, 9609]], [S67 + TE, f12, [10170, 10170, 9800, 9334, 9659]],
    [S74, f14, [_, 10455, _, _, _]], [S74 + TG, f14, [_, 11905, _, _, _]],
  ] },
  { familia: "Varilux Physio extensee track", colunas: A, linhas: [
    [OR, g11, [5115, 5115, 4745, 4279, 4604]], [OR + BU, g11, [5336, 5336, 4966, 4500, 4825]], [OR + TG, g11, [6565, 6565, 6195, 5729, 6054]],
    [AW, g12, [5735, 5735, 5365, 4899, 5224]], [AW + TG, g12, [6964, 6964, 6594, 6128, 6453]], [AW + TE, g12, [7014, 7014, 6644, 6178, 6503]],
    [S67, g14, [8381, 8381, 8011, 7545, 7870]], [S67 + TG, g14, [9610, 9610, 9240, 8774, 9099]],
    [S74, g1412, [9945, 9945, 9575, 9109, 9434]],
  ] },
  { familia: "Varilux Physio extensee track Coloração", colunas: COR, linhas: [[OR + CP, g11, [4279]], [OR + CE, g11, [4389]], [AW + CP, g12, [4678]], [AW + CE, g12, [4788]]] },
  { familia: "Varilux Physio extensee", colunas: A, linhas: [
    [OR, g11, [4605, 4605, 4235, 3769, 4094]], [OR + BU, g11, [4826, 4826, 4456, 3990, 4315]], [OR + TG, g11, [6055, 6055, 5685, 5219, 5544]], [OR + TE, g11, [6105, 6105, 5735, 5269, 5594]],
    [AW, g12, [5225, 5225, 4855, 4389, 4714]], [AW + TG, g12, [6454, 6454, 6084, 5618, 5943]], [AW + TE, g12, [6504, 6504, 6134, 5668, 5993]],
    [S67, g14, [7871, 7871, 7501, 7035, 7360]], [S67 + TG, g14, [9100, 9100, 8730, 8264, 8589]],
    [S74, g1412, [9435, 9435, 9065, 8599, 8924]],
  ] },
  { familia: "Varilux Physio extensee Coloração", colunas: COR, linhas: [[OR + CP, g11, [3769]], [OR + CE, g11, [3879]], [AW + CP, g12, [4168]], [AW + CE, g12, [4278]]] },
  { familia: "Varilux Comfort Max", colunas: [...A, "Trio Easy Clean", "Verniz HC"], linhas: [
    [OR, g11, [3465, 3465, 3095, 2629, 2954, 2389, 2100]], [OR + BU, g11, [3686, 3686, 3316, 2850, 3175, 2610, 2321]],
    [OR + TG, g11, [4915, 4915, 4545, 4079, 4404, 3839, 3550]], [OR + TE, g11, [4965, 4965, 4595, 4129, 4454, 3889, 3600]],
    [AW, g12, [3864, 3864, 3494, 3028, 3353, 2788, 2499]], [AW + TG, g12, [5314, 5314, 4944, 4478, 4803, 4238, 3949]], [AW + TE, g12, [5364, 5364, 4994, 4528, 4853, 4288, 3999]],
    [S67, g14, [6510, 6510, 6140, 5674, 5999, _, _]], [S67 + TG, g14, [7960, 7960, 7590, 7124, 7449, _, _]],
  ] },
  { familia: "Varilux Comfort Max Solares", colunas: SOL, linhas: [[OR + XP, g11, [3906, 3873, 3019]], [AW + XP, g12, [4305, 4272, 3418]]] },
  { familia: "Varilux Comfort Max Coloração", colunas: COR, linhas: [[OR + CP, g11, [2629]], [OR + CE, g11, [2739]], [AW + CP, g12, [3028]], [AW + CE, g12, [3138]]] },
  { familia: "Varilux Comfort", colunas: [...A, "Trio Easy Clean", "Sem AR"], linhas: [
    [OR, f10, [3465, 3465, 3095, 2629, 2954, 2389, 2100]], [OR + TG, f10, [4915, 4915, 4545, 4079, 4404, 3839, 3550]],
    [AW, f10, [3864, 3864, 3494, 3028, 3353, 2788, 2499]], [AW + TG, f10, [5314, 5314, 4944, 4478, 4803, 4238, 3949]],
  ] },
  { familia: "Varilux Comfort Coloração", colunas: COR, linhas: [[OR + CP, f10, [2599]], [OR + CE, f10, [2709]], [AW + CP, f10, [2998]], [AW + CE, f10, [3108]]] },
];

const indice = (v: string) => (v.startsWith("Orma") ? "1.50" : v.startsWith("Airwear") ? "1.59" : v.startsWith("Stylis 1.74") ? "1.74" : "1.67");
const material = (v: string) => (v.startsWith("Orma") ? "Orma" : v.startsWith("Airwear") ? "Airwear Polypower" : v.slice(0, 11));

export type LenteBase = { fornecedor: string; nome: string; material: string; indice: string; faixa: string; custo: number; preco: number };

export const VARILUX: LenteBase[] = BLOCOS.flatMap((b) => b.linhas.flatMap(([v, faixa, precos]) =>
  precos.flatMap((p, i) => (p == null ? [] : [{
    fornecedor: "Essilor", nome: `${b.familia} ${v} + ${b.colunas[i]}`, material: material(v), indice: indice(v), faixa, custo: 0, preco: p,
  }]))));
