# Evento "Não definido" (visibilidade restrita a staff)

## Contexto

Um stakeholder relatou que existem muitos eventos que valem a pena entrar no
aplicativo, mas que ainda não têm todas as informações para serem divulgados
aos clientes RPPS. Hoje o cadastro de um evento o torna imediatamente visível
em todas as listagens (Eventos, Realizados, Favoritos e detalhe via URL
direta). Não havia nenhum estado intermediário entre "rascunho" e "publicado".

## Decisão

Adicionar o conceito de evento **"Não definido"** (na UI: "A definir"),
controlado pela coluna booleana `events.is_confirmed` (default `true`).

- `is_confirmed = false` significa que o evento está "a definir": visível
  **apenas para staff**, em todas as listagens (Eventos, Realizados,
  Favoritos) com badge "A definir" e banner no detalhe. Clientes RPPS não
  conseguem lê-lo em nenhum lugar, nem por URL direta.
- `is_confirmed = true` (padrão) significa confirmado/visível para todos.

### Onde a visibilidade é garantida

- **Banco (RLS)**: a política `events_select` passou de `USING (true)` para
  `USING (is_confirmed = true OR public.is_staff())`, com novo helper
  `public.is_staff()` (checa `user_type = 'staff'` no perfil). As views
  `v_past_events`/`v_ongoing_events` são `SECURITY INVOKER` e herdam a
  restrição automaticamente.
- **Frontend**: nenhum filtro extra é necessário para esconder de clientes
  (a RLS já resolve). O badge "A definir" é renderizado quando
  `is_confirmed === false` — nunca chega a um cliente.

### Formulário

- `Switch` "A definir" na seção Identificação, **desmarcado por padrão**
  (evento novo nasce confirmado). Texto de apoio: "O evento não aparecerá
  para clientes até ser confirmado."
- Ao **marcar** "A definir" num evento que já estava confirmado (edição de um
  evento existente, não duplicação), um dialog confirma: "Este evento deixará
  de aparecer para os clientes até ser confirmado." Eventos novos e
  desmarcação não exigem confirmação.
- A duplicação copia `is_confirmed` do original (como os demais campos).

### Campos obrigatórios

- Enquanto o evento está **"A definir"**, apenas o **título** (e a
  configuração de **recorrência**, se o switch estiver ligado — frequência e
  data-fim, não no passado) são obrigatórios. Descrição, link de inscrição,
  categorias, endereço, valor e sessões podem ficar vazios — o evento ainda
  está em definição. Os atributos `required` do formulário ficam condicionais
  a `!form.is_tentative` para o navegador não bloquear o envio.
- Ao **desmarcar** "A definir" (confirmar/publicar), a validação volta a
  exigir todos os campos obrigatórios — evento incompleto não é publicado.
- Não há mudança de schema: `title`/`description` são `NOT NULL`, mas strings
  vazias satisfazem a constraint; `modality` tem valor padrão `presencial`.

### Gestão

- `ManageEvents` ganhou duas abas: "Confirmados" (padrão) e "A definir" (com
  badge de contagem). Nenhuma aba "Todos".

### Caso de borda

Desconfirmar um evento já publicado/favoritado apenas o esconde: o favorito
permanece no banco e o evento volta a aparecer quando re-confirmado. Sem
limpeza ou aviso aos favoritadores.

## Alternativas consideradas

- **Só filtro no frontend**: descartado — um cliente acessaria `/evento/:id`
  por URL direta e as views continuariam expondo o evento via API.
- **Enum `status` (`confirmado`/`a_definir`)**: descartado por enquanto — há
  apenas dois estados e um booleano com default `true` é mais simples. Se
  surgirem mais estados (ex.: "cancelado"), migra-se para enum.
- **Aba "Todos" na Gestão**: descartado — o objetivo é uma fila acionável.

## Consequências

- Clientes nunca veem eventos não definidos, nem por listagem, nem por URL
  direta, nem por favorito/lembrete pendente.
- Staff vê tudo, com sinalização consistente (badge/banner/aba).
- Novo helper `is_staff()` na RLS; `is_super_admin()` permanece para escrita.
- `events.is_confirmed` é copiado na duplicação e preservado no enrich.
