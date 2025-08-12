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

// Cada status de 0 a 6 mapeado para um ícone e cor
export const STATUS_ICONS = [
  { icon: FaSadTear, color: "text-black" },       // 0 - Péssimo
  { icon: FaAngry, color: "text-red-600" },       // 1 - Muito ruim
  { icon: FaFrown, color: "text-orange-500" },    // 2 - Ruim
  { icon: FaMeh, color: "text-yellow-500" },      // 3 - Neutro
  { icon: FaSmile, color: "text-green-500" },     // 4 - Bom
  { icon: FaGrinBeam, color: "text-blue-600" },   // 5 - Excelente
  { icon: FaGrinStars, color: "text-purple-600" } // 6 - Top
];
