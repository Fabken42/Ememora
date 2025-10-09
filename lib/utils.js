import {
  FaSadTear,
  FaAngry,
  FaFrown,
  FaMeh,
  FaSmile,
  FaGrinBeam,
  FaGrinStars
} from "react-icons/fa";

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

export const LIST_ORDER_BY = [
  { value: 'mostLiked', label: 'Mais curtidas' },
  { value: 'bestRating', label: 'Melhor avaliação' },
  { value: 'mostRecent', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigas' },
  { value: 'highestProgress', label: 'Maior progresso', needsAuth: true },
  { value: 'lowestProgress', label: 'Menor progresso', needsAuth: true }
]

export const FILTER_OPTIONS = [
  { value: 'myLists', label: 'Criadas por mim' },
  { value: 'favorited', label: 'Favoritadas' },
  { value: 'liked', label: 'Curtidas' },
]

export const STATUS_ICONS = [
  { icon: FaSadTear, color: "text-blue-400" },    // 0 - Tristeza (Cinza azulado)
  { icon: FaAngry, color: "text-red-500" },        // 1 - Raiva (Vermelho)
  { icon: FaFrown, color: "text-orange-400" },     // 2 - Descontentamento (Laranja)
  { icon: FaMeh, color: "text-yellow-400" },       // 3 - Neutralidade (Amarelo)
  { icon: FaSmile, color: "text-lime-500" },       // 4 - Contentamento (Verde lima)
  { icon: FaGrinBeam, color: "text-emerald-500" }, // 5 - Felicidade (Verde esmeralda)
  { icon: FaGrinStars, color: "text-violet-500" }  // 6 - Euforia (Roxo vibrante)
];

// Função para obter o status clamped e ícone correspondente
export const getStatusInfo = (status) => {
  const statusValue = typeof status === 'number' ? status : 0
  const clamped = Math.max(0, Math.min(STATUS_ICONS.length - 1, statusValue))
  const { icon: StatusIcon, color } = STATUS_ICONS[clamped]

  return {
    clamped,
    StatusIcon,
    color
  }
}

// Função alternativa se preferir separado
export const getClampedStatus = (status) => {
  const statusValue = typeof status === 'number' ? status : 0
  return Math.max(0, Math.min(STATUS_ICONS.length - 1, statusValue))
}

export const getStatusIcon = (status) => {
  const clamped = getClampedStatus(status)
  return STATUS_ICONS[clamped]
}

export function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5)
}

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

export const TERM_PAGE_SIZE = 12; // Número de termos por página na visualização de lista
export const LISTS_PAGE_SIZE = 8; // Número de listas por página na página inicial e de usuário

//lib/utils.js
export const LIMITS = {
  USER_BIO_MAX: 150,
  USER_NAME_MIN: 5,
  USER_NAME_MAX: 50,
  TERM: 100,           // máximo de caracteres por termo
  DEFINITION: 200,       // máximo de caracteres por definição
  TIP: 100,            // máximo de caracteres por dica
  TOTAL_TERMS: 300,     // máximo de termos por lista
  TOTAL_LISTS: 30,     // máximo de listas por usuário
  TITLE: 50,          // máximo para título
  DESCRIPTION: 200        // máximo para descrição
};

export const getDefaultAvatar = () => {
  return '/default-avatar.png'
}

// Funções auxiliares que podem ser extraídas
export const hasMinimumData = (data) => {
  if (!data.title?.trim()) return false;
  const validTerms = (data.terms || []).filter(t => t.term?.trim() && t.definition?.trim());
  return validTerms.length > 0;
};

export const uploadTempImages = async (tempImages, newTerm) => {
  const uploadPromises = [];
  const newTermData = { ...newTerm };

  for (const [field, tempImage] of Object.entries(tempImages)) {
    if (tempImage.file) {
      uploadPromises.push(
        (async () => {
          const formData = new FormData();
          formData.append('file', tempImage.file);

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });

          if (!res.ok) throw new Error((await res.json()).error);

          const data = await res.json();
          newTermData[field] = data.url;
        })()
      );
    }
  }

  await Promise.all(uploadPromises);
  return newTermData;
};

export const getPageNumbers = (page, totalPages) => {
  const currentPage = page;
  const total = totalPages;
  const delta = 2; // Número de páginas para mostrar antes e depois da atual
  const range = [];
  const rangeWithDots = [];

  // Gerar array com todas as páginas visíveis
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      range.push(i);
    }
  }

  // Adicionar ellipsis onde necessário
  let prev = 0;
  for (let i of range) {
    if (i - prev > 1) {
      rangeWithDots.push('...');
    }
    rangeWithDots.push(i);
    prev = i;
  }

  return rangeWithDots;
};
