import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Switch,
  Typography
} from '@mui/material'
import { CaretDown, CaretUp, DotsSixVertical } from '@phosphor-icons/react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { HOME_BLOCKS } from '../../config/homeBlocks'
import { resolveHomeLayout } from '../../utils/homeLayout'

function Row({ item, index, count, canTurnOff, onToggle, onMove }) {
  const block = HOME_BLOCKS.find((b) => b.id === item.id)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  return (
    <Stack
      ref={setNodeRef}
      direction="row"
      alignItems="center"
      spacing={0.5}
      sx={{
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        position: 'relative',
        zIndex: isDragging ? 1 : 0
      }}
    >
      {/* Arrastar so pela alca: nao briga com a rolagem do celular. */}
      <IconButton
        aria-label={`Arrastar ${block.title}`}
        {...attributes}
        {...listeners}
        sx={{ touchAction: 'none', cursor: 'grab' }}
      >
        <DotsSixVertical size={26} />
      </IconButton>
      <Typography sx={{ flex: 1, fontWeight: 600 }}>{block.title}</Typography>
      <IconButton aria-label={`Subir ${block.title}`} disabled={index === 0} onClick={() => onMove(index, -1)}>
        <CaretUp size={22} />
      </IconButton>
      <IconButton
        aria-label={`Descer ${block.title}`}
        disabled={index === count - 1}
        onClick={() => onMove(index, 1)}
      >
        <CaretDown size={22} />
      </IconButton>
      <Switch
        checked={item.visible}
        disabled={item.visible && !canTurnOff}
        onChange={() => onToggle(item.id)}
        slotProps={{ input: { 'aria-label': block.title } }}
      />
    </Stack>
  )
}

// Edita um rascunho; so grava em "Salvar". "Voltar ao padrao" tambem so mexe no rascunho.
export default function HomeCustomizeDialog({ open, layout, onSave, onClose }) {
  const [draft, setDraft] = useState(layout)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setDraft(layout)
      setError('')
    }
  }, [open, layout])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const visibleCount = draft.filter((i) => i.visible).length

  const move = (index, delta) => setDraft((d) => arrayMove(d, index, index + delta))
  const toggle = (id) => setDraft((d) => d.map((i) => (i.id === id ? { ...i, visible: !i.visible } : i)))
  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    setDraft((d) => {
      const from = d.findIndex((i) => i.id === active.id)
      const to = d.findIndex((i) => i.id === over.id)
      return arrayMove(d, from, to)
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await onSave(draft)
      onClose()
    } catch {
      setError('Não foi possível salvar. Tente novamente.')
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Personalizar tela inicial</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 1 }}>
          Ligue ou desligue os blocos e arraste pela alça (ou use as setas) para mudar a ordem.
        </DialogContentText>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={draft.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <Box>
              {draft.map((item, index) => (
                <Row
                  key={item.id}
                  item={item}
                  index={index}
                  count={draft.length}
                  canTurnOff={visibleCount > 1}
                  onToggle={toggle}
                  onMove={move}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button onClick={() => setDraft(resolveHomeLayout(null, HOME_BLOCKS))}>Voltar ao padrão</Button>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            Salvar
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  )
}
