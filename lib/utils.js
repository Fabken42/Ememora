export const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'languages', label: 'Idiomas' },
  { value: 'entertainment', label: 'Entretenimento' },
  { value: 'science', label: 'Ciências' },
  { value: 'history_geography', label: 'História & Geografia' },
  { value: 'technology_programming', label: 'Tecnologia & Programação' },
  { value: 'business_economy', label: 'Negócios & Economia' },
  { value: 'exams', label: 'Concursos & Vestibulares' },
  { value: 'hobbies', label: 'Hobbies & Vida Prática' },
  { value: 'others', label: 'Outros' }
];

export const LIST_ORDER_BY=[
  { value: 'mostLiked', label: 'Mais curtidas' },
  { value: 'mostRecent', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigas' },
  { value: 'bestRating', label: 'Melhor avaliação' },
  { value: 'highestProgress', label: 'Maior progresso', needsAuth: true },
  { value: 'lowestProgress', label: 'Menor progresso', needsAuth: true }
]

// utils/statusIcons.js
import {
  FaSadTear,
  FaAngry,
  FaFrown,
  FaMeh,
  FaSmile,
  FaGrinBeam,
  FaGrinStars
} from "react-icons/fa";


export const STATUS_ICONS = [
  { icon: FaSadTear, color: "text-slate-400" },    // 0 - Tristeza (Cinza azulado)
  { icon: FaAngry, color: "text-red-500" },        // 1 - Raiva (Vermelho)
  { icon: FaFrown, color: "text-orange-400" },     // 2 - Descontentamento (Laranja)
  { icon: FaMeh, color: "text-yellow-400" },       // 3 - Neutralidade (Amarelo)
  { icon: FaSmile, color: "text-lime-500" },       // 4 - Contentamento (Verde lima)
  { icon: FaGrinBeam, color: "text-emerald-500" }, // 5 - Felicidade (Verde esmeralda)
  { icon: FaGrinStars, color: "text-violet-500" }  // 6 - Euforia (Roxo vibrante)
];

export function computeProgressPct(list, viewerUid) {
  const totalTerms = list?.terms?.length || 0
  const max = totalTerms * 6
  if (max === 0) return 0

  const current = (list.terms || []).reduce((acc, term) => {
    const status =
      term.myStatus ??
      term.progress?.find(p => String(p.userId) === String(viewerUid))?.status ??
      0
    return acc + (typeof status === 'number' ? status : 0)
  }, 0)

  return Math.round((current / max) * 100)
}

export const TERM_PAGE_SIZE = 2;
export const LISTS_PAGE_SIZE = 2;

export const getDefaultAvatar = () => {
  return '/default-avatar.png'
}