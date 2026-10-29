import { Link as MuiLink } from '@mui/material'

export default function MailLink({ email }) {
  return <MuiLink href={`mailto:${email}`}>{email}</MuiLink>
}
