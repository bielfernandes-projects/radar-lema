import { Fragment } from 'react'
import { Box, Link, Typography } from '@mui/material'
import { markdownToBlocks, parseInline } from '../utils/markdown'
import { safeUrl } from '../utils/safeUrl'

function Inline({ nodes }) {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'bold':
        return <strong key={index}>{node.text}</strong>
      case 'italic':
        return <em key={index}>{node.text}</em>
      case 'code':
        return (
          <Box
            component="code"
            key={index}
            sx={{
              bgcolor: 'grey.200',
              borderRadius: 0.5,
              px: 0.5,
              py: 0.25,
              fontFamily: 'monospace'
            }}
          >
            {node.text}
          </Box>
        )
      case 'link': {
        const href = safeUrl(node.href)
        return href ? (
          <Link key={index} href={href} target="_blank" rel="noopener noreferrer">
            {node.text}
          </Link>
        ) : (
          <span key={index}>{node.text}</span>
        )
      }
      default:
        return <Fragment key={index}>{node.text}</Fragment>
    }
  })
}

export default function Markdown({ content }) {
  const blocks = markdownToBlocks(content)

  return (
    <Box>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return (
              <Typography
                key={index}
                variant={block.level === 1 ? 'h5' : block.level === 2 ? 'h6' : 'subtitle1'}
                sx={{ mt: 2, mb: 1, fontWeight: 700 }}
              >
                {block.text}
              </Typography>
            )
          case 'paragraph':
            return (
              <Typography key={index} paragraph sx={{ whiteSpace: 'pre-line' }}>
                <Inline nodes={block.content} />
              </Typography>
            )
          case 'list':
            return block.ordered ? (
              <Box component="ol" sx={{ pl: 3, mb: 2 }} key={index}>
                {block.items.map((item, i) => (
                  <li key={i}>
                    <Inline nodes={parseInline(item)} />
                  </li>
                ))}
              </Box>
            ) : (
              <Box component="ul" sx={{ pl: 3, mb: 2 }} key={index}>
                {block.items.map((item, i) => (
                  <li key={i}>
                    <Inline nodes={parseInline(item)} />
                  </li>
                ))}
              </Box>
            )
          case 'code':
            return (
              <Box
                component="pre"
                key={index}
                sx={{
                  bgcolor: 'grey.900',
                  color: 'grey.100',
                  borderRadius: 1,
                  p: 2,
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 14
                }}
              >
                {block.code}
              </Box>
            )
          case 'blockquote':
            return (
              <Box
                key={index}
                sx={{
                  borderLeft: 4,
                  borderColor: 'primary.main',
                  bgcolor: 'grey.100',
                  pl: 2,
                  py: 0.5,
                  my: 1,
                  borderRadius: 0.5
                }}
              >
                <Typography variant="body1">
                  <Inline nodes={block.content} />
                </Typography>
              </Box>
            )
          case 'hr':
            return <Box key={index} sx={{ borderTop: 1, borderColor: 'divider', my: 2 }} />
          default:
            return null
        }
      })}
    </Box>
  )
}
