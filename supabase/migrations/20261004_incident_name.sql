-- ============================================================
-- MIGRATION: Incident name label
-- Date: 2026-10-04
--
-- Perubahan:
--   1. Tambah kolom incident_name pada tabel incidents
--      (label nama kejadian yang bisa diisi/diedit admin di Incident Logs)
--   2. CHECK constraint: maksimal 100 karakter, tidak boleh string kosong/spasi
--      (NULL = belum diberi nama)
--
-- Jalankan di Supabase SQL Editor untuk database yang SUDAH ada.
-- Untuk setup baru, cukup gunakan supabase/schema.sql.
-- Data insiden lama tidak berubah (incident_name = NULL).
-- ============================================================

begin;

alter table public.incidents
    add column if not exists incident_name text;

alter table public.incidents
    drop constraint if exists incidents_name_check;
alter table public.incidents
    add constraint incidents_name_check
    check (
        incident_name is null
        or (char_length(btrim(incident_name)) between 1 and 100)
    );

commit;
