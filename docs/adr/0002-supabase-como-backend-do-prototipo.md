# Supabase como backend do protótipo

Decidimos usar Supabase como backend completo do protótipo: PostgreSQL
gerenciado, Storage para fotos de eventos, e Edge Functions se necessário.
Sem backend Node.js/Express próprio.

A alternativa seria construir um backend Node.js + Express + PostgreSQL do
zero (mesma stack do UNO) ou usar SQLite local. O Supabase foi escolhido
porque elimina boa parte do backend automaticamente (API, storage, auth),
acelerando o protótipo. O time de dev pode migrar para Express/PostgreSQL
próprio ou manter no Supabase ao assumir o projeto.