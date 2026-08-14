import { Box } from '@mui/material'

function colWidth(columns, gap = 16) {
  return `calc(${100 / columns}% - ${(gap * (columns - 1)) / columns}px)`
}

export default function HorizontalScroller({
  children,
  columns = { md: 3, lg: 3 }
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        pb: 1,
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        overflowX: { xs: 'auto', md: 'hidden' },
        flexWrap: { md: 'wrap' },
        '& > *': {
          flex: '0 0 auto',
          scrollSnapAlign: 'start',
          width: {
            xs: '80%',
            sm: 320,
            md: colWidth(columns.md),
            lg: colWidth(columns.lg)
          }
        },
        '&::-webkit-scrollbar': { display: 'none' }
      }}
    >
      {children}
    </Box>
  )
}
