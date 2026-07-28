export function segmentDuration(
  end: number | null | undefined,
  previousMilestones: ReadonlyArray<number | null | undefined>,
  fromMatchStart = false,
) {
  if (end == null || !Number.isFinite(end) || end <= 0) return null
  const validPrevious = previousMilestones.filter(
    (time): time is number =>
      time != null && Number.isFinite(time) && time >= 0 && time < end,
  )
  const start = fromMatchStart
    ? 0
    : validPrevious.length > 0
      ? Math.max(...validPrevious)
      : null
  if (start == null || end <= start) return null
  return end - start
}
