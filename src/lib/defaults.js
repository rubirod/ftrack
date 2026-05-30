// Предзаполняются при первом запуске, если таблица «Сохранённые блюда» пуста.
// Значения КБЖУ — на типовую порцию.
export const DEFAULT_DISHES = [
  { name: 'Яичница', emoji: '🍳', calories: 200, protein: 14, fat: 15, carbs: 1 },
  { name: 'Овсянка', emoji: '🥣', calories: 280, protein: 9, fat: 6, carbs: 48 },
  { name: 'Куриная грудка', emoji: '🍗', calories: 165, protein: 31, fat: 4, carbs: 0 },
  { name: 'Американо', emoji: '☕', calories: 5, protein: 0, fat: 0, carbs: 1 },
  { name: 'Авокадо', emoji: '🥑', calories: 240, protein: 3, fat: 22, carbs: 12 },
]
