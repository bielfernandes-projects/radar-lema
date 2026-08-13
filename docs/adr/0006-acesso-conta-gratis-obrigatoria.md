# Acesso com conta obrigatória (sem navegação anônima)

## Contexto

O hub da Lema é "de graça para todo mundo", o que poderia significar
navegação anônima (ler conteúdo sem login) ou apenas cadastro gratuito. A
navegação anônima exigiria reabrir todas as políticas RLS para a role `anon`
e reestruturar as rotas (hoje tudo redireciona para `/login`).

## Decisão

**Conta grátis obrigatória**: todo o conteúdo do hub exige login, mas criar
conta é livre e instantâneo. Não há leitura anônima nesta fase.

## Alternativas consideradas

- **Navegação anônima**: máxima captação, porém mudança estrutural em RLS,
  rotas e service worker — custo alto para o protótipo, onde o foco é validar
  as seções e os diferenciais com quem já tem conta.

## Consequências

- O público-alvo da captação precisa criar conta antes de ler — atrito
  consciente e aceito nesta fase.
- RLS permanece como está (autenticado), facilitando a evolução para
  anônimo depois, se desejado — é uma mudança fácil de reverter no futuro.
