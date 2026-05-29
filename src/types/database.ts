export type UserRole = 'admin' | 'hr_manager' | 'company_user' | 'recruiter' | 'candidate'

export type JobStatus =
  | 'draft'
  | 'pending_hr_review'
  | 'open_for_hunters'
  | 'submission_closed'
  | 'in_hr_curation'
  | 'sent_to_client'
  | 'interviewing'
  | 'offer'
  | 'hired'
  | 'closed'
  | 'cancelled'

export type SubmissionStatus =
  | 'submitted'
  | 'ai_analyzed'
  | 'hr_approved'
  | 'hr_rejected'
  | 'sent_to_client'
  | 'client_approved'
  | 'client_rejected'
  | 'interview_scheduled'
  | 'offer'
  | 'hired'
  | 'not_hired'
  | 'duplicate'

export type RecruiterLevel = 'beginner' | 'specialist' | 'top_hunter'
export type RecruiterStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Company {
  id: string
  name: string
  website: string | null
  industry: string | null
  size: string | null
  billing_model: string
  feedback_sla_days: number
  guarantee_days: number
  created_at: string
}

export interface Job {
  id: string
  company_id: string
  title: string
  description: string | null
  seniority: string | null
  location: string | null
  work_model: string | null
  employment_type: string | null
  salary_min: number | null
  salary_max: number | null
  status: JobStatus
  visibility_type: string
  max_submissions_per_recruiter: number
  submission_deadline: string | null
  created_by: string | null
  created_at: string
}

export interface Recruiter {
  id: string
  user_id: string
  status: RecruiterStatus
  level: RecruiterLevel
  specialties: string[] | null
  linkedin_url: string | null
  score: number
  created_at: string
}

export interface Candidate {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  linkedin_url: string | null
  current_title: string | null
  location: string | null
  cv_url: string | null
  created_at: string
}

export interface Submission {
  id: string
  job_id: string
  candidate_id: string
  recruiter_id: string
  status: SubmissionStatus
  interview_summary: string | null
  jd_priorities: string | null
  hunter_score: number | null
  hunter_score_rationale: string | null
  ai_score: number | null
  ai_summary: string | null
  submitted_at: string
}