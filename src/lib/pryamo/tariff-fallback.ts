import type { Tariff } from '@/lib/pryamo/types'

/**
 * Канонический фолбэк тарифов — используется, когда API /api/tariffs
 * недоступен (статик-прод на GitHub Pages, офлайн-режим MVP).
 * Значения синхронизированы с тарифной офертой ПРЯМО (7 тарифов).
 */
export const TARIFF_FALLBACK: Tariff[] = [
  { id: 'eco', name: 'Прямой', description: 'Такси как есть: фикс-цена до конца поездки, честная машина без украшений.', multiplier: 1.0, baseFare: 79, perKm: 14, perMin: 6, carClass: 'Kia Rio, Hyundai Solaris, VW Polo, Lada Vesta · до 5 лет', sortOrder: 1 },
  { id: 'comfort', name: 'Ладный', description: 'Всё работает и всё ладно: климат-контроль, свежие машины до 4 лет.', multiplier: 1.35, baseFare: 129, perKm: 18, perMin: 7, carClass: 'Toyota Corolla, Skoda Octavia, Kia Cerato · до 4 лет', sortOrder: 2 },
  { id: 'comfort-plus', name: 'Привольный', description: 'Простор для ног и мыслей: вода, зарядки USB-C, мягкий ход.', multiplier: 1.7, baseFare: 169, perKm: 21, perMin: 8, carClass: 'Toyota Camry, Kia K5, Skoda Superb · до 3 лет', sortOrder: 3 },
  { id: 'business', name: 'Барин', description: 'Едешь как хозяин: дресс-код водителя, встреча с табличкой, тишина.', multiplier: 2.4, baseFare: 299, perKm: 30, perMin: 12, carClass: 'Mercedes E, BMW 5, Audi A6 · до 2 лет', sortOrder: 4 },
  { id: 'van', name: 'Артель', description: 'Вся ватага в одной машине: до шести мест, кресла без доплаты.', multiplier: 1.5, baseFare: 149, perKm: 19, perMin: 8, carClass: 'VW Caravelle, Hyundai H-1, Lada Largus 7 мест · до 4 лет', sortOrder: 5 },
  { id: 'intercity', name: 'Дальняк', description: 'Между городами: цена за всю машину целиком, фикс до конца маршрута.', multiplier: 1.0, baseFare: 500, perKm: 20, perMin: 0, carClass: 'Любой класс от Ладного · до 4 лет', sortOrder: 6 },
  { id: 'cargo', name: 'Хомяк', description: 'Тащит больше, чем видно: грузы, переезды, доставка рассады.', multiplier: 1.2, baseFare: 299, perKm: 28, perMin: 0, carClass: 'Газель, Ford Transit, VW Transporter · до 5 лет', sortOrder: 7 },
]
