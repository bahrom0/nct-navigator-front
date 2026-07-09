export interface NewDbRecord {
  code: string
  specialty_name: string
  university_name: string
  location: string
  education_form: string
  education_type: string
  tuition_fee: string
  language: string
  admission_plan: number
  cluster: number
  education_level: "after_9" | "after_11"
  source_document: string
  source_page: number
}

export interface NewDbDatabase {
  records: NewDbRecord[]
}

export interface PrefilterParams {
  educationLevel?: "after_9" | "after_11" | ""
  studyCity?: string
  clusters?: number[]
  interests?: string[]
  query?: string
}

export const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  after_9: "После 9 класса",
  after_11: "После 11 класса",
}

export const CLUSTER_NAMES: Record<number, string> = {
  1: "Естественные и технические науки",
  2: "Экономика и география",
  3: "Филология, педагогика и искусство",
  4: "Обществознание и право",
  5: "Медицина, биология и спорт",
}

export const CLUSTER_EXAMS: Record<"after_9" | "after_11", Record<number, string[]>> = {
  after_11: {
    1: ["Таджикский язык", "Математика", "Химия", "Физика"],
    2: ["Таджикский язык", "Математика", "География", "Иностранный язык"],
    3: [
      "Таджикский язык",
      "История",
      "Таджикская литература / Русский язык и литература",
      "Иностранный язык",
    ],
    4: ["Таджикский язык", "История", "Право", "Иностранный язык"],
    5: ["Таджикский язык", "Биология", "Химия", "Физика"],
  },
  after_9: {
    1: ["Таджикский язык", "Математика", "Физика"],
    2: ["Таджикский язык", "Математика", "География"],
    3: [
      "Таджикский язык",
      "Таджикская литература / Русский язык",
      "Иностранный язык",
    ],
    4: ["Таджикский язык", "История", "Иностранный язык"],
    5: ["Таджикский язык", "Биология", "Химия"],
  },
}
