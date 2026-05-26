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