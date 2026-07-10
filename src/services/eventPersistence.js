import { supabase } from '../lib/supabase'

export async function uploadPhotos(eventId, photos, removedPhotoIds) {
  const photoFiles = photos.filter((p) => p.file)

  if (photoFiles.length === 0) return

  const results = await Promise.all(
    photoFiles.map(async (photo, i) => {
      const ext = photo.file.name.split('.').pop()
      const path = `events/${eventId}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(path, photo.file)

      if (uploadError) {
        throw new Error(`Erro ao enviar foto: ${uploadError.message}`)
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from('event-photos').getPublicUrl(path)

      return {
        event_id: eventId,
        storage_path: path,
        public_url: publicUrl,
        sort_order: i + photos.filter((p) => p.id).length
      }
    })
  )

  const { error: insertError } = await supabase
    .from('event_photos')
    .insert(results)
  if (insertError) throw insertError
}

export async function saveSessions(eventId, sessionsToSave) {
  const existingIds = sessionsToSave
    .filter((s) => s.id)
    .map((s) => s.id)

  const { data: existingSessions } = await supabase
    .from('event_sessions')
    .select('id')
    .eq('event_id', eventId)

  const toDelete = (existingSessions || [])
    .filter((s) => !existingIds.includes(s.id))
    .map((s) => s.id)

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('event_sessions')
      .delete()
      .in('id', toDelete)
    if (deleteError) throw deleteError
  }

  for (const session of sessionsToSave) {
    const payload = {
      event_id: eventId,
      start_date: session.start_date,
      start_time: session.start_time,
      end_date: session.end_date,
      end_time: session.end_time,
      recurrence_instance: session.recurrence_instance ?? false
    }

    if (session.id) {
      const { error: updateError } = await supabase
        .from('event_sessions')
        .update(payload)
        .eq('id', session.id)
      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase
        .from('event_sessions')
        .insert(payload)
      if (insertError) throw insertError
    }
  }
}

export async function persistEvent({
  form,
  sessionsToSave,
  eventId,
  isEdit,
  isDuplicate,
  user,
  photos,
  removedPhotoIds
}) {
  const eventPayload = {
    title: form.title.trim(),
    description: form.description.trim(),
    modality: form.modality,
    category_id: form.category_id,
    is_free: form.is_free,
    price_from: form.is_free ? null : Number(form.price_from),
    city: form.modality === 'online' ? null : form.city.trim() || null,
    state: form.modality === 'online' ? null : form.state.trim() || null,
    address: form.modality === 'online' ? null : form.address.trim() || null,
    url: form.url.trim(),
    is_recurring: form.is_recurring,
    recurrence_freq: form.is_recurring ? form.recurrence_freq : null,
    recurrence_until: form.is_recurring ? form.recurrence_until : null,
    created_by: user.id
  }

  let savedEventId = eventId

  if (isEdit && !isDuplicate) {
    const { error: updateError } = await supabase
      .from('events')
      .update(eventPayload)
      .eq('id', eventId)
    if (updateError) throw updateError
  } else {
    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert(eventPayload)
      .select('id')
      .single()
    if (insertError) throw insertError
    savedEventId = newEvent.id
  }

  if (removedPhotoIds.length > 0) {
    const { data: removedPhotos } = await supabase
      .from('event_photos')
      .select('storage_path')
      .in('id', removedPhotoIds)

    await supabase.from('event_photos').delete().in('id', removedPhotoIds)

    const paths = removedPhotos?.map((p) => p.storage_path).filter(Boolean) || []
    if (paths.length > 0) {
      await supabase.storage.from('event-photos').remove(paths)
    }
  }

  await uploadPhotos(savedEventId, photos, removedPhotoIds)
  await saveSessions(savedEventId, sessionsToSave)

  return savedEventId
}
