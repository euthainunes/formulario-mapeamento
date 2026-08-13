import { BeezzPost } from "@/types/content";
import { seededRandom } from "@/lib/utils";
import { isoDate, REFERENCE_TODAY } from "@/lib/date-range";
import { MOCK_COLLABORATORS } from "./audience.mock";

const BEEZZ_TITLES = [
  "Obrigado time, fechamos o mês com chave de ouro! 🐝",
  "Bastidores da nossa reunião de squad",
  "Aniversário de casa: 3 anos de BeeHome!",
  "Compartilhando uma conquista do time de Vendas",
  "Dica rápida: como organizei minha semana",
  "Momento gratidão pelo apoio do time de RH",
  "Nosso primeiro Beezz em vídeo!",
  "Recebendo o novo colaborador do time",
  "Compartilhando aprendizados do treinamento",
  "Um agradecimento especial à liderança",
  "Foto do dia: nosso escritório renovado",
  "Reflexão sobre colaboração em equipe",
  "Celebrando a entrega do projeto X",
  "Compartilhando a cultura BeeHome com orgulho",
  "Bastidores do evento de integração",
  "Uma homenagem a quem faz a diferença",
  "Dica de produtividade para o time",
  "Compartilhando resultados do trimestre",
  "Momento leve: pausa para o café",
  "Conquista pessoal que quero compartilhar",
  "Um recado para quem está começando aqui",
  "Compartilhando a alegria da nossa equipe",
  "Reconhecimento para o time de Suporte",
  "Foto especial da confraternização",
  "Aprendizados de um projeto desafiador",
  "Compartilhando orgulho do nosso Pod",
  "Um agradecimento aos parceiros de projeto",
  "Bastidores da gravação do podcast interno",
  "Celebrando mais um trimestre juntos",
  "Compartilhando a rotina do time remoto",
];

function buildBeezz(): BeezzPost[] {
  const rnd = seededRandom(33);
  return BEEZZ_TITLES.map((title, idx) => {
    const daysAgo = Math.floor(rnd() * 90);
    const date = new Date(REFERENCE_TODAY);
    date.setDate(date.getDate() - daysAgo);
    const author = MOCK_COLLABORATORS[Math.floor(rnd() * MOCK_COLLABORATORS.length)];
    const likes = 5 + Math.floor(rnd() * 180);
    const comments = Math.floor(likes * (0.05 + rnd() * 0.3));
    return {
      id: `beezz-${idx + 1}`,
      title,
      author: author.name,
      createdAt: isoDate(date),
      likes,
      comments,
    } satisfies BeezzPost;
  });
}

export const MOCK_BEEZZ: BeezzPost[] = buildBeezz();
