-- =========================================================
-- Pet Feeder — data contoh untuk demo
-- Jalankan SETELAH schema.sql. Aman dijalankan ulang: semua data perangkat dihapus
-- (akun login tetap ada, tapi sambungan akun ↔ perangkat ikut lepas).
--
-- Dua perangkat, keduanya BELUM punya pemilik. Hubungkan lewat dashboard
-- (masuk → isi ID perangkat):
--   ID 1  Feeder Ruang Tamu  (pet Mochi, nafsu makan sedang turun)
--   ID 2  Feeder Kamar       (pet Kopi, normal)
--
-- API key alat demo (dipakai simulator / requests.http di Fase 4–5):
--   ID 1: pf_demo_7c1e0a2f9b4d4e8a8f3c6b5a1d2e0f9c
--   ID 2: pf_demo_2b8d4f1a6c3e4a9b8e7d5c4b3a2f1e0d
-- Yang disimpan di DB hanya hash SHA-256-nya. Ganti lewat halaman Perangkat
-- ("Buat key baru") sebelum dipakai serius.
-- =========================================================

do $$
declare
  v_i      int;
  v_dev    bigint;
  v_pet    bigint;
  v_today  date := (now() at time zone 'Asia/Jakarta')::date;
  v_s      record;
  v_d      int;
  v_t      timestamptz;
  v_disp   numeric;
  v_ratio  numeric;
  v_done   boolean;
  v_last   record;
begin
  -- public.users tidak dikosongkan: barisnya milik akun Supabase Auth
  truncate public.feedings, public.feeding_schedule, public.pets, public.devices
    restart identity cascade;

  for v_i in 1..2 loop
  insert into public.devices (name, api_key_hash, paired_at, last_seen_at,
                              hopper_capacity_g, hopper_refilled_at, hopper_level_pct, hopper_read_at)
  values ((array['Feeder Ruang Tamu', 'Feeder Kamar'])[v_i],
          encode(sha256(((array['pf_demo_7c1e0a2f9b4d4e8a8f3c6b5a1d2e0f9c',
                                'pf_demo_2b8d4f1a6c3e4a9b8e7d5c4b3a2f1e0d'])[v_i])::bytea), 'hex'),
          now() - interval '30 days', now(),
          2000, now() - interval '16 days', (array[22, 70])[v_i], now())
  returning id into v_dev;

  insert into public.pets (device_id, name) values (v_dev, (array['Mochi', 'Kopi'])[v_i]) returning id into v_pet;

  insert into public.feeding_schedule (device_id, feed_time)
  values (v_dev, '07:00'), (v_dev, '12:00'), (v_dev, '17:00'), (v_dev, '21:00');

  -- 21 hari riwayat; berat yang jatuh acak 15–35 g, normalnya dimakan 86–98%
  for v_d in reverse 21..0 loop
    for v_s in select id, feed_time from public.feeding_schedule where device_id = v_dev order by feed_time loop
      v_t := ((v_today - v_d) + v_s.feed_time) at time zone 'Asia/Jakarta';
      continue when v_t > now();

      v_done  := now() - v_t >= interval '30 minutes';
      v_disp  := round((15 + random() * 20)::numeric, 1);
      v_ratio := 0.86 + random() * 0.12;
      if v_i = 1 and v_d = 9 and v_s.feed_time = '17:00' then
        v_ratio := 0.38;                                   -- satu kejadian "Parah"
      end if;

      insert into public.feedings (device_id, pet_id, schedule_id, scheduled_at, dispensed_g, leftover_g, synced_at)
      values (v_dev, v_pet, v_s.id, v_t, v_disp,
              case when v_done then round(v_disp * (1 - v_ratio), 1) end,
              v_t + case when v_done then interval '30 minutes 5 seconds' else interval '5 seconds' end);
    end loop;
  end loop;

  -- 6 sesi selesai terakhir: nafsu makan turun (urutan lama → baru: 80, 74, 62, 60, 58, 66 %)
  -- hanya perangkat 1, supaya dua dashboard terlihat berbeda
  if v_i = 1 then
  with last6 as (
    select id, row_number() over (order by scheduled_at desc) as rn
    from public.feedings
    where pet_id = v_pet and leftover_g is not null
    order by scheduled_at desc
    limit 6
  )
  update public.feedings f
  set leftover_g = round(f.dispensed_g * (1 - (array[0.66, 0.58, 0.60, 0.62, 0.74, 0.80])[l.rn]), 1)
  from last6 l
  where f.id = l.id;
  end if;

  -- hitung status severity untuk semua sesi
  perform public.reclassify_feedings(v_pet);

  -- berat bowl sekarang = sisa sesi terakhir (atau berat yang jatuh jika masih dipantau)
  select dispensed_g, leftover_g into v_last
  from public.feedings where pet_id = v_pet order by scheduled_at desc limit 1;

  update public.devices
  set bowl_weight_g = coalesce(v_last.leftover_g, v_last.dispensed_g),
      bowl_read_at  = now()
  where id = v_dev;
  end loop;
end $$;

-- ---------------------------------------------------------- cek hasil
select status, count(*) as jumlah_sesi
from public.feedings
group by status
order by array_position(array['normal', 'watch', 'moderate', 'urgent'], status);
