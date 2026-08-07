import { Box, Skeleton } from '@mui/material'

export default function PageSkeleton({ lines = 5 }) {
  return (
    <Box sx={{ py: 1 }}>
      <Skeleton variant="text" width={220} height={44} />
      <Skeleton variant="rounded" height={300} sx={{ my: 2 }} />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} variant="text" width="100%" />
      ))}
      <Skeleton variant="text" width="60%" />
    </Box>
  )
}
