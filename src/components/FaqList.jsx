import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import { CaretDown } from '@phosphor-icons/react'
import { FAQ } from '../config/faq'

// Lista de perguntas frequentes (acordeão), usada na landing e na página Ajuda.
export default function FaqList() {
  return FAQ.map(([question, answer]) => (
    <Accordion
      key={question}
      disableGutters
      elevation={0}
      square
      sx={{
        bgcolor: 'transparent', borderBottom: 1, borderColor: 'divider', '&:before': { display: 'none' },
        '&.Mui-expanded': { bgcolor: 'background.paper' }
      }}
    >
      <AccordionSummary
        expandIcon={<CaretDown size={20} aria-hidden="true" />}
        sx={{ px: 2, py: 0.5, '& .MuiAccordionSummary-content': { my: 1.5 } }}
      >
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600 }}>
          {question}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pb: 2.5 }}>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '60ch' }}>
          {answer}
        </Typography>
      </AccordionDetails>
    </Accordion>
  ))
}
