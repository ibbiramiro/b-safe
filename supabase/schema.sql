-- ============================================================
-- B-SAFE DATABASE SCHEMA
-- Supabase (PostgreSQL)
-- ============================================================

-- 1. BUILDINGS
-- Gedung yang dimonitor (e.g. BINUS @Medan - Gedung Utama)
-- ============================================================
create table public.buildings (
    id uuid not null default gen_random_uuid(),
    name text not null,
    address text,
    created_at timestamptz not null default now(),

    constraint buildings_pkey primary key (id)
);

-- Insert default building
insert into public.buildings (name, address)
values ('BINUS @Medan - Gedung Utama', 'Jl. Medan, Sumatera Utara');


-- 2. PERSONNEL
-- Daftar personel: sweep warden, staf keamanan, medis, dll.
-- ============================================================
create table public.personnel (
    id uuid not null default gen_random_uuid(),
    building_id uuid references public.buildings(id) on delete cascade,
    name text not null,
    role text not null default 'Sweep Warden',
    phone text,
    -- Avatar tidak disimpan: frontend menampilkan inisial nama (e.g. "Ramiro Gunady" -> "RG")
    -- Nomor WhatsApp ternormalisasi (62xxxxxxxxxx) untuk link wa.me / integrasi
    whatsapp_number text generated always as (
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
    ) stored,
    status text not null default 'active',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint personnel_pkey primary key (id),
    constraint personnel_status_check
        check (status in ('active', 'sweeping', 'assistance_req', 'off_duty'))
);

-- Auto-update updated_at saat data personel diedit
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_personnel_updated_at
    before update on public.personnel
    for each row
    execute function public.set_updated_at();

-- Default personnel
insert into public.personnel (building_id, name, role, phone, status)
select 
    b.id,
    p.name,
    p.role,
    p.phone,
    p.status
from public.buildings b
cross join (values
    ('Budi Santoso',  'Sweep Warden',   '+62 812-3456-7890', 'active'),
    ('Siti Rahma',    'Staf Keamanan',  '+62 813-9876-5432', 'sweeping'),
    ('Agus Wijaya',   'Medis',          '+62 811-2233-4455', 'assistance_req'),
    ('Rina Hidayat',  'Sweep Warden',   '+62 855-6677-8899', 'off_duty')
) as p(name, role, phone, status)
where b.name = 'BINUS @Medan - Gedung Utama';


-- 3. FLOORS
-- Lantai per gedung, termasuk warden yang ditugaskan
-- ============================================================
create table public.floors (
    id uuid not null default gen_random_uuid(),
    building_id uuid not null references public.buildings(id) on delete cascade,
    name text not null,
    floor_number int not null,
    warden_id uuid references public.personnel(id) on delete set null,
    count_m int not null default 0,
    count_dk int not null default 0,
    count_oc int not null default 0,
    status text not null default 'clear',
    -- status: 'clear', 'reporting', 'unreported'
    updated_at timestamptz not null default now(),
    created_at timestamptz not null default now(),

    constraint floors_pkey primary key (id)
);

-- Default floors (warden_id will be set after insert)
insert into public.floors (building_id, name, floor_number, count_m, count_dk, count_oc, status)
select 
    b.id,
    f.name,
    f.floor_number,
    f.count_m,
    f.count_dk,
    f.count_oc,
    f.status
from public.buildings b
cross join (values
    ('Floor 9', 9, 10, 2, 0, 'clear'),
    ('Floor 8', 8, 4,  1, 0, 'reporting'),
    ('Floor 7', 7, 0,  0, 0, 'unreported'),
    ('Floor 6', 6, 0,  0, 0, 'clear'),
    ('Floor 5', 5, 0,  0, 0, 'clear')
) as f(name, floor_number, count_m, count_dk, count_oc, status)
where b.name = 'BINUS @Medan - Gedung Utama';

-- Assign wardens to floors
update public.floors set warden_id = (
    select id from public.personnel where name = 'Budi Santoso' limit 1
) where floor_number = 9;

update public.floors set warden_id = (
    select id from public.personnel where name = 'Siti Rahma' limit 1
) where floor_number = 8;

-- Floor 7 intentionally has no warden (unreported)

update public.floors set warden_id = (
    select id from public.personnel where name = 'Agus Wijaya' limit 1
) where floor_number = 6;

update public.floors set warden_id = (
    select id from public.personnel where name = 'Rina Hidayat' limit 1
) where floor_number = 5;


-- 4. INCIDENTS
-- Setiap kali "CREATE NEW INCIDENT" ditekan, snapshot disimpan
-- ============================================================
create table public.incidents (
    id uuid not null default gen_random_uuid(),
    building_id uuid not null references public.buildings(id) on delete cascade,
    total_m int not null default 0,
    total_dk int not null default 0,
    total_oc int not null default 0,
    status text not null default 'active',
    -- status: 'active', 'closed'
    created_at timestamptz not null default now(),
    closed_at timestamptz,

    constraint incidents_pkey primary key (id)
);


-- 5. FLOOR REPORTS
-- Laporan per lantai dari warden via mobile input
-- ============================================================
create table public.floor_reports (
    id uuid not null default gen_random_uuid(),
    incident_id uuid not null references public.incidents(id) on delete cascade,
    floor_id uuid not null references public.floors(id) on delete cascade,
    reported_by uuid references public.personnel(id) on delete set null,
    count_m int not null default 0,
    count_dk int not null default 0,
    count_oc int not null default 0,
    status text not null default 'reporting',
    -- status: 'reporting', 'clear'
    reported_at timestamptz not null default now(),

    constraint floor_reports_pkey primary key (id)
);


-- ============================================================
-- INDEXES
-- ============================================================
create index idx_floors_building on public.floors(building_id);
create index idx_floors_warden on public.floors(warden_id);
create index idx_personnel_building on public.personnel(building_id);
create index idx_incidents_building on public.incidents(building_id);
create index idx_incidents_created on public.incidents(created_at desc);
create index idx_floor_reports_incident on public.floor_reports(incident_id);
create index idx_floor_reports_floor on public.floor_reports(floor_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Untuk saat ini, enable RLS tapi allow semua (public access)
-- Nanti bisa ditambahkan auth policies
-- ============================================================
alter table public.buildings enable row level security;
alter table public.floors enable row level security;
alter table public.personnel enable row level security;
alter table public.incidents enable row level security;
alter table public.floor_reports enable row level security;

-- Policies: allow all for now (public access with anon key)
create policy "Allow all on buildings" on public.buildings for all using (true) with check (true);
create policy "Allow all on floors" on public.floors for all using (true) with check (true);
create policy "Allow all on personnel" on public.personnel for all using (true) with check (true);
create policy "Allow all on incidents" on public.incidents for all using (true) with check (true);
create policy "Allow all on floor_reports" on public.floor_reports for all using (true) with check (true);


-- ============================================================
-- REALTIME
-- Enable realtime untuk floors agar dashboard auto-update
-- saat warden submit laporan dari mobile
-- ============================================================
alter publication supabase_realtime add table public.floors;
alter publication supabase_realtime add table public.floor_reports;
alter publication supabase_realtime add table public.incidents;
alter publication supabase_realtime add table public.personnel;
