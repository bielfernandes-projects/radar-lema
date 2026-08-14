-- Decodifica entidades HTML numericas (decimais) em noticias ja ingeridas,
-- corrigindo descricoes/titulos armazenados antes da correcao do news-ingest
-- (a funcao passou a decodificar `&#NNN;` e `&#xHH;`; o upsert ignoreDuplicates
-- nao reescreve URLs existentes, por isso o ajuste e feito aqui em lote).
CREATE OR REPLACE FUNCTION radar_decode_html_entities(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  t text := input;
  m text[];
BEGIN
  IF t IS NULL THEN
    RETURN NULL;
  END IF;
  LOOP
    m := regexp_match(t, '&#(\d+);');
    EXIT WHEN m IS NULL;
    t := regexp_replace(t, '&#\d+;', chr(m[1]::int));
  END LOOP;
  RETURN t;
END $$;

UPDATE news
SET description = radar_decode_html_entities(description),
    title       = radar_decode_html_entities(title)
WHERE description ~ '&#\d+;' OR title ~ '&#\d+;';
