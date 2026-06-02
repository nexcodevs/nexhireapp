export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function getJobStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Rascunho',
    pending_hr_review: 'Aguardando revisão',
    open_for_hunters: 'Aberta para hunters',
    submission_closed: 'Envios encerrados',
    in_hr_curation: 'Em curadoria',
    sent_to_client: 'Enviada ao cliente',
    interviewing: 'Em entrevistas',
    offer: 'Proposta',
    hired: 'Contratado',
    closed: 'Encerrada',
    cancelled: 'Cancelada',
  }
  return labels[status] || status
}

export function formatDaysSince(iso: string): string {
  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  )
  if (days <= 0) return 'hoje'
  if (days === 1) return 'ontem'
  return `há ${days}d`
}

export function getJobStatusVariant(status: string): 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'dark' {
  const variants: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'dark'> = {
    draft: 'gray',
    pending_hr_review: 'yellow',
    open_for_hunters: 'green',
    submission_closed: 'gray',
    in_hr_curation: 'blue',
    sent_to_client: 'blue',
    interviewing: 'blue',
    offer: 'dark',
    hired: 'dark',
    closed: 'gray',
    cancelled: 'red',
  }
  return variants[status] || 'gray'
}

export function getSubmissionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    submitted: 'Aguardando curadoria',
    ai_analyzed: 'Em análise IA',
    hr_approved: 'Aprovado pelo HR',
    hr_rejected: 'Reprovado pelo HR',
    sent_to_client: 'Com o cliente',
    client_approved: 'Cliente aprovou',
    client_rejected: 'Cliente recusou',
    interview_scheduled: 'Em entrevista',
    offer: 'Em proposta',
    hired: 'Contratado',
    not_hired: 'Não contratado',
    duplicate: 'Duplicado',
  }
  return labels[status] || status
}

export function getSubmissionStatusVariant(
  status: string,
): 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'dark' {
  const variants: Record<string, 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'dark'> = {
    submitted: 'yellow',
    ai_analyzed: 'blue',
    hr_approved: 'green',
    hr_rejected: 'red',
    sent_to_client: 'blue',
    client_approved: 'green',
    client_rejected: 'red',
    interview_scheduled: 'blue',
    offer: 'dark',
    hired: 'dark',
    not_hired: 'gray',
    duplicate: 'gray',
  }
  return variants[status] || 'gray'
}