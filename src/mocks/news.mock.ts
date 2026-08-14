import { ContentItem, ContentType } from "@/types/content";
import { seededRandom } from "@/lib/utils";
import { isoDate, REFERENCE_TODAY } from "@/lib/date-range";
import { COMMUNICATION_TEAM } from "./team.mock";

const TITLES: { title: string; type: ContentType }[] = [
  { title: "Novo plano de saúde entra em vigor em setembro", type: "noticia" },
  { title: "Conheça os bastidores da campanha de fim de ano", type: "video" },
  { title: "Enquete: qual tema você quer no próximo evento?", type: "enquete" },
  { title: "Álbum: confraternização do time de Tecnologia", type: "photobook" },
  { title: "Como a Comunicação Interna apoia a cultura BeeHome", type: "blog" },
  { title: "Podcast BeeHome #12: liderança em tempos de mudança", type: "podcast" },
  { title: "Resultados do trimestre são apresentados a todos", type: "noticia" },
  { title: "Tour em vídeo pelo novo escritório de SP", type: "video" },
  { title: "Enquete: horário preferido para lives internas", type: "enquete" },
  { title: "Álbum: Semana da Diversidade 2026", type: "photobook" },
  { title: "5 dicas de comunicação assertiva no dia a dia", type: "blog" },
  { title: "Podcast BeeHome #13: bem-estar no trabalho híbrido", type: "podcast" },
  { title: "Programa de indicação de talentos é atualizado", type: "noticia" },
  { title: "Bastidores do Beezz do mês: conheça os vencedores", type: "video" },
  { title: "Enquete: avalie o novo layout da intranet", type: "enquete" },
  { title: "Álbum: hackathon interno de inovação", type: "photobook" },
  { title: "Guia rápido: como usar os novos Pods", type: "blog" },
  { title: "Podcast BeeHome #14: carreira e desenvolvimento", type: "podcast" },
  { title: "Campanha de vacinação chega às unidades", type: "noticia" },
  { title: "Vídeo institucional 2026 já está no ar", type: "video" },
  { title: "Enquete: prioridades para o próximo ano", type: "enquete" },
  { title: "Álbum: confraternização do time Comercial", type: "photobook" },
  { title: "Comunicação não-violenta: por onde começar", type: "blog" },
  { title: "Podcast BeeHome #15: histórias de quem começou aqui", type: "podcast" },
  { title: "Atualização da política de home office", type: "noticia" },
  { title: "Vídeo: um dia na vida do time de Operações", type: "video" },
  { title: "Enquete: qual Beezz mais representa nossa cultura?", type: "enquete" },
  { title: "Álbum: aniversário de 10 anos da empresa", type: "photobook" },
  { title: "Como funciona o novo canal de feedback", type: "blog" },
  { title: "Podcast BeeHome #16: inovação vinda de dentro", type: "podcast" },
  { title: "Reforço de segurança da informação para todos", type: "noticia" },
  { title: "Making of da campanha de comunicação interna", type: "video" },
  { title: "Enquete: melhor formato para treinamentos", type: "enquete" },
  { title: "Álbum: visita técnica do time de Tecnologia", type: "photobook" },
  { title: "3 aprendizados do último ciclo de metas", type: "blog" },
  { title: "Podcast BeeHome #17: comunicação em crise", type: "podcast" },
  { title: "Nova política de reconhecimento é lançada", type: "noticia" },
  { title: "Vídeo: bastidores do evento anual", type: "video" },
  { title: "Enquete: qual conteúdo você quer ver mais?", type: "enquete" },
  { title: "Álbum: ação social do Dia das Crianças", type: "photobook" },
];

function buildNews(): ContentItem[] {
  const rnd = seededRandom(21);
  return TITLES.map((t, idx) => {
    const daysAgo = Math.floor(rnd() * 90);
    const date = new Date(REFERENCE_TODAY);
    date.setDate(date.getDate() - daysAgo);
    const views = 200 + Math.floor(rnd() * 3200);
    const likes = Math.floor(views * (0.05 + rnd() * 0.25));
    const comments = Math.floor(likes * (0.1 + rnd() * 0.4));
    const perfRoll = rnd();
    const performance = perfRoll > 0.66 ? "acima_media" : perfRoll > 0.33 ? "na_media" : "abaixo_media";
    return {
      id: `content-${idx + 1}`,
      title: t.title,
      type: t.type,
      publishedAt: isoDate(date),
      author: COMMUNICATION_TEAM[idx % COMMUNICATION_TEAM.length].name,
      views,
      likes,
      comments,
      performance,
    } satisfies ContentItem;
  });
}

export const MOCK_CONTENT: ContentItem[] = buildNews();
