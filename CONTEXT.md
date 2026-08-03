# Radar Lema

Centralizador de eventos para RPPS — um PWA standalone que reúne todos os
eventos do ecossistema (comitês, workshops, lives, palestras, congressos, etc.)
para clientes e staff da Lema.

> Nota: o app foi rebranded de "Lema Discovery" para "Radar Lema". Pasta,
> pacote (`package.json`/`package-lock.json`) e repo do GitHub foram renomeados
> para `radar-lema`, bem como o projeto no Supabase e na Vercel.

## Language

**Evento**:
Agregado principal do domínio. Representa uma ocorrência (encontro, live,
palestra, congresso, etc.) voltada para RPPS, organizada pela Lema ou por
terceiros. Tem título, descrição, modalidade, categoria, valor, endereço,
link externo de inscrição, fotos e múltiplas sessões.
_Avoid_: Atividade, compromisso, agenda

**Sessão**:
Uma data e horário específico dentro de um evento. Eventos de múltiplos dias
têm múltiplas sessões (ex.: dia 1 das 10h às 22h, dia 2 das 10h às 21h).
_Evento recorrente_ gera múltiplas sessões automaticamente a partir de um
modelo de recorrência.
_Avoid_: Data, horário, ocorrência

**Recorrência**:
Configuração que faz o sistema gerar sessões repetidas automaticamente:
semanal, quinzenal ou mensal, até uma data fim obrigatória. Cada sessão
gerada é um registro individual no banco — pode ser editada ou excluída
independentemente com escopo (só esta / esta e as próximas / todas).
_Avoid_: Repetição, _recurrence_ (anglicismo)

**Categoria**:
Tipo do evento (Comitê, Workshop, Live/Webinar, Palestra, Congresso,
Seminário, Curso, Encontro). Lista fixa gerenciável pelo staff Lema em
tela própria. Sem opção "Outro" — novas categorias são adicionadas pelo
gestão de categorias.
_Avoid_: Tipo, tag

**Modalidade**:
Como o evento acontece: Presencial, Online ou Híbrido. Determina se o
endereço e mapa são exibidos.
_Avoid_: Formato

**Endereço**:
Local físico do evento (presencial ou híbrido). Composto por cidade, UF e
logradouro completo. Nulo quando modalidade é Online. Usado como entrada do
mapa embed.
_Avoid_: Local, lugar, venue

**Mapa**:
Embed do Google Maps renderizado a partir do endereço em texto livre. Sem
lat/lng, sem autocomplete. Exibido apenas em modalidade Presencial ou
Híbrido.
_Avoid_: Geolocalização, GPS

**Link de inscrição**:
URL externa para onde o botão "Inscrever-se" direciona. O Radar não
processa inscrições — só redireciona. Campo obrigatório.
_Avoid_: URL, botão

**Foto (capa)**:
Primeira foto do evento (`order = 0` no banco). Aparece sozinha no card da
listagem. Máximo 5 fotos por evento, 3MB cada.
_Avoid_: Thumbnail, imagem principal

**Foto (carrossel)**:
Conjunto de fotos do evento exibido na tela de detalhe, ordenado por
`order`. A primeira é sempre a capa. Navegação por swipe/setas.
_Avoid_: Galeria, slider

**Compartilhar**:
Ação do cliente que usa a Web Share API (mobile) ou copia link para
área de transferência (desktop). Compartilha a URL pública do detalhe do
evento.
_Avoid_: Enviar, exportar

**Valor**:
Custo do evento. Gratuito (toggle no formulário) ou pago com campo "a
partir de R$ X,XX". Eventos gratuitos mostram "Gratuito" no card; pagos
mostram "A partir de R$ X,XX". Sempre "a partir de" — não há valor fixo.
_Avoid_: Preço, custo, taxa

**Staff Lema**:
Funcionários da Lema (comercial, gerência, Lema Edu, etc.) que cadastra,
edita, duplica e exclui eventos. Mapeado para as roles do UNO:
SUPER_ADMIN, ADMIN, BACKOFFICE, COMERCIAL, CONSULTOR_TECNICO.
_Avoid_: Administrador, gestor

**Cliente RPPS**:
Usuários finais que navegam e favoritam eventos. Mapeado para as roles
do UNO: DIRIGENTE, COMITE, CONSELHO. Não podem criar, editar ou excluir.
_Avoid_: Usuário, participante

**Favorito**:
Evento marcado pelo cliente RPPS para acompanhar. Aparece na aba
"Favoritos". Funciona como salvamento para referência futura.
_Avoid_: Saved, bookmark, marcado

**Realizado**:
Evento cujas todas as sessões já passaram. Transição automática da
listagem principal para a página "Realizados", sem intervenção do staff.
_Avoid_: Passado, histórico, arquivado

**Em andamento**:
Evento com ao menos uma sessão passada e ao menos uma sessão futura.
Permanece na listagem principal. Mostra badge "Em andamento" no card.
_Avoid_: Em curso, atual, corrente

**Duplicação**:
Ação do staff que cria um novo evento copiando todos os campos de um
existente — incluindo datas/sessões e o modelo de recorrência com seu
intervalo de datas. **Fotos não são copiadas** — o novo evento nasce sem
fotos e o staff re-uploads antes de salvar. Se a `recurrence_until` copiada
estiver no passado, o formulário warna o staff para ajustar antes de salvar.
_Avoid_: Clonar, copiar

## Roles e Acesso

**Staff Lema** (acesso total): cadastra, edita, duplica, exclui eventos;
gerencia categorias.
**Cliente RPPS** (somente leitura): lista, filtra, favorita, compartilha.

Qualquer staff pode editar/excluir qualquer evento, independentemente de
quem criou. O campo `created_by` é guardado no banco mas não há tela de
auditoria no protótipo.