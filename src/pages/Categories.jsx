import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { supabase } from '../lib/supabase'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, category: null })

  const fetchCategories = async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (fetchError) {
      setError('Erro ao carregar categorias.')
    } else {
      setCategories(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const trimmed = name.trim()
    if (!trimmed) return

    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ name: trimmed })
          .eq('id', editingId)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('categories')
          .insert({ name: trimmed })
        if (insertError) throw insertError
      }

      setName('')
      setEditingId(null)
      await fetchCategories()
    } catch (err) {
      setError(err.message || 'Erro ao salvar categoria.')
    }
  }

  const handleEdit = (category) => {
    setName(category.name)
    setEditingId(category.id)
  }

  const handleDelete = async () => {
    const category = deleteDialog.category
    if (!category) return

    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id)

    if (deleteError) {
      setError('Erro ao excluir categoria. Verifique se ela não está em uso.')
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== category.id))
    }

    setDeleteDialog({ open: false, category: null })
  }

  const cancelEdit = () => {
    setName('')
    setEditingId(null)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Categorias
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Nome da categoria"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" variant="contained">
            {editingId ? 'Salvar' : 'Adicionar'}
          </Button>
          {editingId && (
            <Button variant="outlined" onClick={cancelEdit}>
              Cancelar
            </Button>
          )}
        </Stack>
      </Box>

      {categories.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          Nenhuma categoria cadastrada.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {categories.map((category) => (
            <Card key={category.id} variant="outlined">
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6">{category.name}</Typography>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      onClick={() => handleEdit(category)}
                      aria-label="Editar"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        setDeleteDialog({ open: true, category })
                      }
                      color="error"
                      aria-label="Excluir"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, category: null })}
      >
        <DialogTitle>Excluir categoria</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir {deleteDialog.category?.name}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, category: null })}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
