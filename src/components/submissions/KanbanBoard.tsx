import type { SubmissionStatus } from '@/types/database'
import KanbanColumn, { type ColumnAccent } from './KanbanColumn'
import type { KanbanCardData } from './KanbanCard'

export interface KanbanSubmission extends KanbanCardData {
  status: SubmissionStatus
}

interface ColumnConfig {
  title: string
  accent: ColumnAccent
  statuses: SubmissionStatus[]
  emptyLine: string
}

const COLUMNS: ColumnConfig[] = [
  {
    title: 'Recebidos',
    accent: 'yellow',
    statuses: ['submitted', 'ai_analyzed'],
    emptyLine: 'Sem chegadas no momento.',
  },
  {
    title: 'Curadoria HR',
    accent: 'mint',
    statuses: ['hr_approved'],
    emptyLine: 'Nada esperando aprovação.',
  },
  {
    title: 'Com cliente',
    accent: 'blue',
    statuses: ['sent_to_client'],
    emptyLine: 'Nenhum perfil sob avaliação.',
  },
  {
    title: 'Cliente aprovou',
    accent: 'green',
    statuses: ['client_approved'],
    emptyLine: 'Nenhuma aprovação ainda.',
  },
  {
    title: 'Entrevista',
    accent: 'blue',
    statuses: ['interview_scheduled'],
    emptyLine: 'Sem entrevistas marcadas.',
  },
  {
    title: 'Contratado',
    accent: 'dark',
    statuses: ['hired'],
    emptyLine: 'Aguardando o primeiro hire.',
  },
]

interface KanbanBoardProps {
  submissions: KanbanSubmission[]
  showJob?: boolean
}

export default function KanbanBoard({ submissions, showJob }: KanbanBoardProps) {
  const cardsByStatus = new Map<SubmissionStatus, KanbanSubmission[]>()
  for (const sub of submissions) {
    const list = cardsByStatus.get(sub.status) ?? []
    list.push(sub)
    cardsByStatus.set(sub.status, list)
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '12px',
        scrollSnapType: 'x mandatory',
      }}
    >
      {COLUMNS.map(col => {
        const cards = col.statuses.flatMap(s => cardsByStatus.get(s) ?? [])
        return (
          <div
            key={col.title}
            style={{
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            <KanbanColumn
              title={col.title}
              accent={col.accent}
              cards={cards}
              emptyLine={col.emptyLine}
              showJob={showJob}
            />
          </div>
        )
      })}
    </div>
  )
}
