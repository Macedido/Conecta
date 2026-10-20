export type DemoMessage = {
  id: string
  author: string
  avatar: string
  text: string
  time: string
}

type CommunityContent = {
  geral: [string, string]
  duvidas: [string, string]
  estudos: [string, string]
}

const AUTHORS = [
  { name: 'Marina Alves', avatar: 'MA' },
  { name: 'Lucas Ribeiro', avatar: 'LR' },
] as const

const CONTENT: Record<string, CommunityContent> = {
  matematica: {
    geral: [
      'Alguém mais está revisando funções para a prova desta semana?',
      'Estou sim. Fiz um resumo com domínio, imagem e os principais tipos de gráfico.',
    ],
    duvidas: [
      'Por que a raiz quadrada de 49 pode ser usada para encontrar o lado de um quadrado?',
      'Porque a área é lado ao quadrado. Fazendo a operação inversa, a raiz de 49 resulta em lado igual a 7.',
    ],
    estudos: [
      'Minha meta de hoje é resolver dez exercícios de porcentagem e cinco de regra de três.',
      'Boa estratégia. Depois vale revisar os erros e anotar qual raciocínio faltou em cada questão.',
    ],
  },
  portugues: {
    geral: [
      'Terminei a leitura do conto indicado. O narrador muda bastante a forma como entendemos o final.',
      'Também percebi isso. As pistas aparecem aos poucos e ganham outro sentido na última parte.',
    ],
    duvidas: [
      'Qual é a diferença prática entre metáfora e comparação?',
      'A comparação costuma usar um conectivo, como “tal qual”. Na metáfora, a aproximação acontece de forma implícita.',
    ],
    estudos: [
      'Hoje vou treinar uma introdução de redação com repertório e tese bem definida.',
      'Depois confira se os dois argumentos anunciados podem ser desenvolvidos separadamente.',
    ],
  },
  historia: {
    geral: [
      'Estou montando uma linha do tempo para não confundir os períodos do Brasil República.',
      'Ajuda muito separar República Velha, Era Vargas e República Populista por cores e acontecimentos-chave.',
    ],
    duvidas: [
      'A Revolução Industrial aconteceu apenas por causa das máquinas?',
      'Não. Também envolveram capital acumulado, mão de obra, matérias-primas, mercados consumidores e mudanças sociais.',
    ],
    estudos: [
      'Separei fontes históricas sobre a abolição para comparar diferentes pontos de vista.',
      'Ótimo. Identificar autor, época e intenção de cada fonte deixa a análise mais completa.',
    ],
  },
  fisica: {
    geral: [
      'O experimento de movimento uniforme ficou mais claro quando transformei os dados em gráfico.',
      'No gráfico de posição pelo tempo, a inclinação da reta mostra diretamente a velocidade.',
    ],
    duvidas: [
      'Se um objeto está parado, significa que nenhuma força atua sobre ele?',
      'Não necessariamente. Ele pode estar em equilíbrio, com forças de mesma intensidade se anulando.',
    ],
    estudos: [
      'Vou revisar as unidades do Sistema Internacional antes de começar a lista de mecânica.',
      'É uma boa ideia. Converter tudo para metro, segundo e quilograma evita muitos erros de cálculo.',
    ],
  },
  quimica: {
    geral: [
      'Organizei a tabela periódica por famílias e ficou mais fácil lembrar propriedades semelhantes.',
      'Também ajuda observar a tendência do raio atômico e da eletronegatividade ao longo dos períodos.',
    ],
    duvidas: [
      'Como sei se uma equação química está balanceada corretamente?',
      'Conte os átomos de cada elemento nos dois lados. As quantidades precisam ser iguais, sem alterar os índices das fórmulas.',
    ],
    estudos: [
      'A meta de hoje é praticar cálculo de massa molar e depois avançar para estequiometria.',
      'Começar pela massa molar facilita bastante a conversão entre massa, mol e número de partículas.',
    ],
  },
  biologia: {
    geral: [
      'A animação sobre divisão celular me ajudou a diferenciar mitose e meiose.',
      'A principal pista é observar o número de divisões e a quantidade de cromossomos nas células resultantes.',
    ],
    duvidas: [
      'Qual é a função das mitocôndrias nas células?',
      'Elas participam da respiração celular e da produção de ATP, que fornece energia para diversas atividades celulares.',
    ],
    estudos: [
      'Estou criando cartões de revisão com organelas na frente e funções no verso.',
      'Funciona bem. Tente misturar perguntas de identificação com situações em que cada organela é necessária.',
    ],
  },
}

export const DEMO_MESSAGES: Record<string, DemoMessage[]> = Object.fromEntries(
  Object.entries(CONTENT).flatMap(([communityId, channels]) =>
    Object.entries(channels).map(([channelId, texts]) => [
      `${communityId}::${channelId}`,
      texts.map((text, index) => ({
        id: `demo-${communityId}-${channelId}-${index}`,
        author: AUTHORS[index].name,
        avatar: AUTHORS[index].avatar,
        text,
        time: index === 0 ? '09:15' : '09:18',
      })),
    ]),
  ),
)

export function getDemoMessages(channelKey: string): DemoMessage[] {
  return DEMO_MESSAGES[channelKey] ?? []
}
