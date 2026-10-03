-- ============================================================
-- MIGRATION: Personnel initials avatar + edit support
-- Date: 2026-10-03
--
-- Perubahan:
--   1. Hapus kolom avatar_url (avatar kini dari inisial nama di frontend)
--   2. Tambah kolom updated_at + trigger auto-update saat edit
--   3. Tambah CHECK constraint untuk status personel
--   4. Normalisasi nomor telepon untuk link WhatsApp (kolom generated)
--
-- Jalankan di Supabase SQL Editor untuk database yang SUDAH ada.
-- Untuk setup baru, cukup gunakan supabase/schema.sql.
-- ============================================================

begin;

-- 1. Drop avatar_url
--    PERHATIAN: data URL foto lama akan hilang permanen.
--    Backup dulu jika masih dibutuhkan:
--    create table public.personnel_avatar_backup as
--        select id, avatar_url from public.personnel;
alter table public.personnel
    drop column if exists avatar_url;


-- 2. updated_at + trigger
alter table public.personnel
    add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_personnel_updated_at on public.personnel;
create trigger trg_personnel_updated_at
    before update on public.personnel
    for each row
    execute function public.set_updated_at();


-- 3. Status constraint
--    Rapikan data lama yang statusnya di luar daftar sebelum constraint dipasang
update public.personnel
    set status = 'active'
    where status not in ('active', 'sweeping', 'assistance_req', 'off_duty');

alter table public.personnel
    drop constraint if exists personnel_status_check;
alter table public.personnel
    add constraint personnel_status_check
    check (status in ('active', 'sweeping', 'assistance_req', 'off_duty'));


-- 4. Nomor WhatsApp ternormalisasi (format 62xxxxxxxxxx, tanpa +/spasi/-)
--    Berguna untuk query/integrasi backend (mis. notifikasi WA).
--    Frontend tetap menormalisasi sendiri via lib/personnel.js.
alter table public.personnel
    drop column if exists whatsapp_number;
alter table public.personnel
    add column whatsapp_number text generated always as (
        case
            when regexp_replace(coalesce(phone, ''), '\D', '', 'g') = '' then null
            when regexp_replace(phone, '\D', '', 'g') like '00%'
                then substring(regexp_replace(phone, '\D', '', 'g') from 3)
            when regexp_replace(phone, '\D', '', 'g') like '0%'
                then '62' || substring(regexp_replace(phone, '\D', '', 'g') from 2)
            when regexp_replace(phone, '\D', '', 'g') like '8%'
                then '62' || regexp_replace(phone, '\D', '', 'g')
            else regexp_replace(phone, '\D', '', 'g')
        end
    ) stored;


-- 5. Realtime untuk personnel (agar edit/hapus tersinkron di semua client)
do $$
begin
    if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'personnel'
    ) then
        alter publication supabase_realtime add table public.personnel;
    end if;
end;
$$;

commit;
