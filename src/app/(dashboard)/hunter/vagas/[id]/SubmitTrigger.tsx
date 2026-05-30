'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import SubmitCandidateForm from '@/components/submissions/SubmitCandidateForm'

interface SubmitTriggerProps {
  jobId: string
  jobTitle: string
  recruiterId: string
  remainingSlots: number
}

/**
 * Botão que abre modal com o SubmitCandidateForm.
 * Substitui o form inline gigante na página de detalhe da vaga.
 */
export default function SubmitTrigger({
  jobId,
  jobTitle,
  recruiterId,
  remainingSlots,
}: SubmitTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg">
        Enviar candidato pra esta vaga →
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Enviar candidato`}
        subtitle={`${jobTitle} · ${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} disponíve${remainingSlots === 1 ? 'l' : 'is'}`}
        maxWidth={760}
      >
        <SubmitCandidateForm
          jobId={jobId}
          recruiterId={recruiterId}
          remainingSlots={remainingSlots}
        />
      </Modal>
    </>
  )
}
