import { supabase as _supabase } from '../lib/supabase'

export async function fetchMaterials({ supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('materials')
    .select('id, title, description, visibility, file_name, file_size, file_type, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchMaterialById(id, { supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error('Material não encontrado.')
  return data
}

export async function saveMaterial(payload, { supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase
    .from('materials')
    .upsert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMaterial(id, { supabase } = { supabase: _supabase }) {
  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) throw error
}

export async function uploadMaterialFile(file, { supabase } = { supabase: _supabase }) {
  const path = `${crypto.randomUUID()}`
  const { error } = await supabase.storage
    .from('materials')
    .upload(path, file)
  if (error) throw error
  return path
}

export async function getMaterialUrl(storagePath, { supabase } = { supabase: _supabase }) {
  const { data, error } = await supabase.storage
    .from('materials')
    .createSignedUrl(storagePath, 3600)
  if (error) throw error
  return data?.signedUrl
}

export async function deleteMaterialFile(storagePath, { supabase } = { supabase: _supabase }) {
  const { error } = await supabase.storage
    .from('materials')
    .remove([storagePath])
  if (error) throw error
}
