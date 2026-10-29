// Fontes usadas no app (página /fontes). Manter em sincronia com as Edge Functions
// news-ingest, blog-ingest e articles-ingest.
export const SOURCES = [
  {
    group: 'Notícias',
    items: [
      { name: 'Investimentos RPPS', url: 'https://www.investimentosrpps.com.br' },
      { name: 'Investidor Institucional (categoria RPPS)', url: 'https://investidorinstitucional.com.br' },
      { name: 'ABIPEM', url: 'https://www.abipem.org.br' },
      { name: 'Banco Central do Brasil', url: 'https://www.bcb.gov.br', note: 'Só notícias sobre RPPS.' },
      { name: 'Ministério da Previdência Social', url: 'https://www.gov.br/previdencia', note: 'Só notícias sobre RPPS.' }
    ]
  },
  {
    group: 'Artigos',
    items: [
      { name: 'Blog da LEMA Consultoria', url: 'https://www.lemaef.com.br/blog/' },
      { name: 'Panorama RPPS', url: 'https://panoramarpps.com.br' }
    ]
  }
]
