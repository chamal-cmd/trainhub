export type UserRole = 'admin' | 'user'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url?: string
  department?: string
  created_at: string
}

export interface Subject {
  id: string
  title: string
  description?: string
  cover_color: string
  emoji: string
  created_by?: string
  created_at: string
  updated_at: string
  topics?: Topic[]
  quiz?: Quiz
}

export interface Topic {
  id: string
  subject_id: string
  title: string
  description?: string
  order_index: number
  created_at: string
  steps?: Step[]
}

export interface Step {
  id: string
  topic_id: string
  title: string
  content?: object
  order_index: number
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  subject_id: string
  title: string
  passing_score: number
  created_at: string
  questions?: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false'
  order_index: number
  explanation?: string
  options?: QuizOption[]
}

export interface QuizOption {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
}

export interface Assignment {
  id: string
  subject_id: string
  user_id: string
  assigned_by?: string
  due_date?: string
  created_at: string
  subject?: Subject
  user?: Profile
}

export interface StepProgress {
  id: string
  user_id: string
  step_id: string
  completed_at: string
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_id: string
  score: number
  passed: boolean
  completed_at: string
}

export interface SubjectWithProgress extends Subject {
  totalSteps: number
  completedSteps: number
  progressPercent: number
  quizPassed?: boolean
  dueDate?: string
}
