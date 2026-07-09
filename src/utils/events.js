export function enrichEvents(events, photos, sessions, pastIds, ongoingIds) {
  return events.map((event) => {
    const eventSessions = sessions?.filter((s) => s.event_id === event.id) || []
    const dates = eventSessions.map((s) => s.start_date).filter(Boolean).sort()
    const cover = photos?.find((p) => p.event_id === event.id)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return {
      ...event,
      cover_photo: cover,
      min_date: dates[0] || null,
      max_date: dates[dates.length - 1] || null,
      next_date:
        eventSessions
          .filter(
            (s) =>
              new Date(`${s.start_date}T00:00:00`).getTime() >= today.getTime()
          )
          .sort(
            (a, b) =>
              new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          )[0]?.start_date || dates[0] || null,
      is_past: pastIds?.has(event.id) || false,
      is_ongoing: ongoingIds?.has(event.id) || false,
      sessions: eventSessions
    }
  })
}
