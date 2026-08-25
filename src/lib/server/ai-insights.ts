import OpenAI from "openai";
import { InsightsFactsheet } from "@/lib/server/insights-data";

/**
 * Camada de IA de Insights — regras definidas explicitamente pela usuária
 * (25/08/2026), aplicadas aqui como instrução de sistema, não como sugestão:
 *
 * A IA nunca inventa, presume ou completa informação ausente na fonte.
 * Toda informação deve ter origem comprovável no `factsheet` recebido, ou
 * ser resultado de cálculo/cruzamento feito exclusivamente a partir dele.
 * Quando não houver dado suficiente, a IA declara isso explicitamente em
 * vez de tentar preencher — "é melhor dizer que não há dado suficiente do
 * que apresentar informação incorreta".
 *
 * Nenhum dado bruto da BeeHome chega direto à IA: o `factsheet` (ver
 * insights-data.ts) já foi calculado pelos mesmos mapeadores determinísticos
 * usados nas telas — a IA só narra/cruza números que o código já validou,
 * nunca faz conta grande sozinha (modelo de linguagem não é calculadora
 * confiável em volume).
 */

const SYSTEM_PROMPT = `Você é a camada de análise de dados da plataforma "Gestão da Comunicação + Inteligência da Intranet BeeHome". Siga estas regras sem exceção:

REGRAS OBRIGATÓRIAS:
- Nunca invente, presuma ou complete informação que não esteja no JSON de dados fornecido.
- Nunca crie valores estimados sem que isso esteja claramente sinalizado como estimativa derivada de um cálculo explícito sobre os dados fornecidos.
- Nunca preencha campos com suposição.
- Nunca interprete uma informação como outra sem evidência suficiente no JSON.
- Nunca use conhecimento externo (sobre a empresa, sobre BeeHome, sobre o mercado) para completar dados ausentes.
- Nunca apresente informação fictícia como se fosse real.
- Nunca esconda a ausência de dado — declare explicitamente quando um dado não estiver disponível.

VOCÊ PODE:
- Organizar os dados recebidos.
- Classificar informações quando houver evidência suficiente no JSON.
- Cruzar diferentes campos do JSON fornecido.
- Fazer cálculos matemáticos simples sobre os dados disponíveis (variação percentual, comparação, ranking, soma, média) — sempre mostrando de qual campo cada número veio.
- Identificar padrões efetivamente presentes nos dados.
- Informar que um indicador não pode ser calculado quando faltar dado.

O campo "unavailable" do JSON lista quais fontes falharam nesta consulta — nunca tente compensar uma fonte ausente com estimativa ou conhecimento geral.

Responda SEMPRE em JSON válido, no formato exato pedido em cada instrução de usuário, em português do Brasil.`;

function client(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não está definido.");
  return new OpenAI({ apiKey });
}

export interface GeneratedInsight {
  text: string;
  sourceFields: string[];
}

export interface AutoInsightsResult {
  insights: GeneratedInsight[];
  insufficientData: { reason: string; missingFields: string[] } | null;
}

const AUTO_INSTRUCTIONS = `Tarefa: gerar até 4 observações curtas (1 frase cada) sobre os dados de comunicação interna abaixo, em português, para uma administradora de comunicação interna.

Cada observação precisa citar, no próprio texto, de qual dado ela veio (ex: "com base em views de topNews"). Se o JSON não tiver dado suficiente para nenhuma observação útil, devolva "insights": [] e preencha "insufficientData".

Formato de resposta OBRIGATÓRIO (JSON):
{
  "insights": [ { "text": "...", "sourceFields": ["audience.activeUsers", ...] } ],
  "insufficientData": null | { "reason": "...", "missingFields": ["..."] }
}`;

export async function generateAutoInsights(factsheet: InsightsFactsheet): Promise<AutoInsightsResult> {
  const completion = await client().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `${AUTO_INSTRUCTIONS}\n\nDADOS (JSON):\n${JSON.stringify(factsheet)}` },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Resposta vazia do modelo.");
  const parsed = JSON.parse(raw) as Partial<AutoInsightsResult>;
  return {
    insights: Array.isArray(parsed.insights) ? parsed.insights : [],
    insufficientData: parsed.insufficientData ?? null,
  };
}

export interface AskResult {
  answer: string | null;
  sourceFields: string[];
  calculation: string | null;
  insufficientData: { reason: string; missingFields: string[] } | null;
}

const ASK_INSTRUCTIONS = `Tarefa: responder à pergunta da usuária usando exclusivamente o JSON de dados abaixo.

Se a pergunta puder ser respondida com o que está no JSON (diretamente ou por cálculo/cruzamento simples entre campos), responda e cite os campos usados. Se não puder — porque o dado não está no JSON, ou porque está listado em "unavailable" — devolva "answer": null e preencha "insufficientData" com o motivo e quais dados seriam necessários.

Formato de resposta OBRIGATÓRIO (JSON):
{
  "answer": "..." | null,
  "sourceFields": ["audience.activeUsers", ...],
  "calculation": "descrição de como o número foi calculado, se houve cálculo" | null,
  "insufficientData": null | { "reason": "...", "missingFields": ["..."] }
}`;

export async function answerQuestion(question: string, factsheet: InsightsFactsheet): Promise<AskResult> {
  const completion = await client().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `${ASK_INSTRUCTIONS}\n\nPERGUNTA: ${question}\n\nDADOS (JSON):\n${JSON.stringify(factsheet)}` },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Resposta vazia do modelo.");
  const parsed = JSON.parse(raw) as Partial<AskResult>;
  return {
    answer: parsed.answer ?? null,
    sourceFields: Array.isArray(parsed.sourceFields) ? parsed.sourceFields : [],
    calculation: parsed.calculation ?? null,
    insufficientData: parsed.insufficientData ?? null,
  };
}
