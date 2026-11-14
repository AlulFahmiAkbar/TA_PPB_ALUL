-- Jalankan di Supabase > SQL Editor
create table users (id uuid primary key default gen_random_uuid(), name varchar not null, email varchar unique not null,
  password text not null, role varchar default 'user', phone varchar, created_at timestamptz default now());
create table kos (id uuid primary key default gen_random_uuid(), name varchar not null, description text, address text,
  area varchar, latitude decimal, longitude decimal, kos_type varchar check (kos_type in ('Putra','Putri','Campur')),
  owner_name varchar, owner_phone varchar, image_url text, created_at timestamptz default now());
create table rooms (id uuid primary key default gen_random_uuid(), kos_id uuid references kos(id) on delete cascade,
  room_name varchar, price decimal not null, size varchar, description text, availability boolean default true);
create table facilities (id uuid primary key default gen_random_uuid(), name varchar unique not null, icon varchar);
create table kos_facilities (id uuid primary key default gen_random_uuid(), kos_id uuid references kos(id) on delete cascade,
  facility_id uuid references facilities(id) on delete cascade);
create table room_images (id uuid primary key default gen_random_uuid(), room_id uuid references rooms(id) on delete cascade, image_url text);
create table favorites (id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete cascade,
  kos_id uuid references kos(id) on delete cascade, created_at timestamptz default now(), unique (user_id, kos_id));
create table reviews (id uuid primary key default gen_random_uuid(), user_id uuid references users(id) on delete cascade,
  kos_id uuid references kos(id) on delete cascade, rating int check (rating between 1 and 5), comment text, created_at timestamptz default now());

-- Nonaktifkan Row Level Security (RLS) agar backend API bebas baca/tulis tanpa terblokir izin client
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE kos DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE kos_facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE room_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- ===== Data awal (area Semarang) =====
insert into facilities(name) values ('WiFi'),('AC'),('Kamar Mandi Dalam'),('Parkir'),('Dapur Bersama'),('Laundry');
insert into kos(name,description,address,area,kos_type,owner_name,owner_phone,image_url) values
('Kos Mawar Tembalang','Kos nyaman 5 menit dari kampus, lingkungan tenang.','Jl. Banjarsari Barat No. 6, Tembalang','Tembalang','Putri','Bu Sari','6281234567801','https://picsum.photos/seed/kos1/600/400'),
('Kos Gapura Banyumanik','Kos modern dengan fasilitas lengkap dan parkir luas.','Jl. Ngesrep Timur No. 12, Banyumanik','Banyumanik','Putra','Pak Budi','6281234567802','https://picsum.photos/seed/kos2/600/400'),
('Kos Bendungan Sekaran','Dekat gerbang kampus, harga ramah mahasiswa.','Jl. Sekaran Raya No. 3, Gunungpati','Gunungpati','Campur','Bu Rina','6281234567803','https://picsum.photos/seed/kos3/600/400'),
('Kos Melati Tembalang','Kamar luas ber-AC, bersih, dan aman.','Jl. Tirto Agung No. 21, Tembalang','Tembalang','Putra','Pak Joko','6281234567804','https://picsum.photos/seed/kos4/600/400');
insert into rooms(kos_id,room_name,price,size,availability)
select k.id,v.n,v.p,v.s,v.a from (values
 ('Kos Mawar Tembalang','A1',850000,'3x3 m',true),('Kos Mawar Tembalang','A2',1000000,'3x4 m',false),
 ('Kos Gapura Banyumanik','B1',1200000,'3x4 m',true),('Kos Gapura Banyumanik','B2',1500000,'4x4 m',true),
 ('Kos Bendungan Sekaran','C1',650000,'3x3 m',true),('Kos Bendungan Sekaran','C2',750000,'3x3 m',true),
 ('Kos Melati Tembalang','D1',1100000,'3x4 m',true),('Kos Melati Tembalang','D2',1300000,'4x4 m',false)
) v(kos,n,p,s,a) join kos k on k.name=v.kos;
insert into kos_facilities(kos_id,facility_id)
select k.id,f.id from (values
 ('Kos Mawar Tembalang','WiFi'),('Kos Mawar Tembalang','Kamar Mandi Dalam'),('Kos Mawar Tembalang','Parkir'),
 ('Kos Gapura Banyumanik','WiFi'),('Kos Gapura Banyumanik','AC'),('Kos Gapura Banyumanik','Parkir'),('Kos Gapura Banyumanik','Laundry'),
 ('Kos Bendungan Sekaran','WiFi'),('Kos Bendungan Sekaran','Dapur Bersama'),
 ('Kos Melati Tembalang','WiFi'),('Kos Melati Tembalang','AC'),('Kos Melati Tembalang','Kamar Mandi Dalam')
) v(kos,fac) join kos k on k.name=v.kos join facilities f on f.name=v.fac;
-- Jadikan akun admin setelah register:  update users set role='admin' where email='emailkamu@mail.com';
