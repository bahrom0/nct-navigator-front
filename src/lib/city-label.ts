const CITY_RU: Record<string, string> = {
  "душанбе": "Душанбе",
  "dushanbe": "Душанбе",
  "дюшанбе": "Душанбе",
  "худжанд": "Худжанд",
  "khujand": "Худжанд",
  "khojand": "Худжанд",
  "bohtar": "Бохтар",
  "bokhtar": "Бохтар",
  "бохтар": "Бохтар",
  "куляб": "Куляб",
  "kulyab": "Куляб",
  "kulob": "Куляб",
  "турсунзаде": "Турсунзаде",
  "tursunzade": "Турсунзаде",
  "tursunzoda": "Турсунзаде",
  "истаравшан": "Истаравшан",
  "istaravshan": "Истаравшан",
  "ура-тюбе": "Истаравшан",
  "ura-tyube": "Истаравшан",
  "канибадам": "Канибадам",
  "kanibadam": "Канибадам",
  "konibodom": "Канибадам",
  "пенджикент": "Пенджикент",
  "penjikent": "Пенджикент",
  "panjakent": "Пенджикент",
  "исфара": "Исфара",
  "isfara": "Исфара",
  "вахдат": "Вахдат",
  "vahdat": "Вахдат",
  "гиссар": "Гиссар",
  "gissar": "Гиссар",
  "hisor": "Гиссар",
  "нурек": "Нурек",
  "nurek": "Нурек",
  "norak": "Нурек",
  "дангара": "Дангара",
  "dangara": "Дангара",
  "хорог": "Хорог",
  "khorog": "Хорог",
  "khorugh": "Хорог",
  "рогун": "Рогун",
  "rogun": "Рогун",
  "rogoun": "Рогун",
}

/**
 * Города из локальной базы НЦТ приходят в разной транслитерации
 * (чаще латиницей: "Khujand"), а интерфейс на русском.
 */
export function cityLabel(city: string): string {
  const trimmed = city.trim()
  if (!trimmed) return trimmed

  const direct = CITY_RU[trimmed.toLowerCase()]
  if (direct) return direct

  const inner = trimmed
    .split(/[\s,.]+/)
    .map((word) => CITY_RU[word.toLowerCase()])
    .find(Boolean)
  return inner ?? trimmed
}
