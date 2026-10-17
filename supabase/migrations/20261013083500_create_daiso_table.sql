-- Tạo bảng daiso lưu danh sách đài xổ tương ứng theo từng ngày trong tuần
create table if not exists public.daiso (
  id serial primary key,
  thu integer not null check (thu between 0 and 6), -- 0: Chủ nhật, 1: Thứ 2, 2: Thứ 3, ..., 6: Thứ 7 (khớp với Date.getDay() của JavaScript)
  ten_thu text not null,                            -- 'Thứ Hai', 'Thứ Ba', ..., 'Chủ Nhật'
  ten_dai text not null,                            -- 'TP.HCM', 'Đồng Tháp', ...
  thu_tu integer not null default 1,               -- Thứ tự hiển thị đài chính / phụ
  created_at timestamptz not null default now(),
  constraint daiso_thu_ten_dai_unique unique (thu, ten_dai)
);

-- Bật Row Level Security và cấp quyền đọc
alter table public.daiso enable row level security;

drop policy if exists "Allow public read daiso" on public.daiso;
create policy "Allow public read daiso"
  on public.daiso for select
  using (true);

grant select on public.daiso to anon, authenticated;
grant all privileges on public.daiso to service_role;

-- Thêm dữ liệu ban đầu cho 7 ngày trong tuần
insert into public.daiso (thu, ten_thu, ten_dai, thu_tu) values
  -- Thứ Hai (thu = 1)
  (1, 'Thứ Hai', 'TP.HCM', 1),
  (1, 'Thứ Hai', 'Cà Mau', 2),
  (1, 'Thứ Hai', 'Đồng Tháp', 3),

  -- Thứ Ba (thu = 2)
  (2, 'Thứ Ba', 'Bến Tre', 1),
  (2, 'Thứ Ba', 'Bạc Liêu', 2),
  (2, 'Thứ Ba', 'Vũng Tàu', 3),

  -- Thứ Tư (thu = 3)
  (3, 'Thứ Tư', 'Đồng Nai', 1),
  (3, 'Thứ Tư', 'Cần Thơ', 2),
  (3, 'Thứ Tư', 'Sóc Trăng', 3),

  -- Thứ Năm (thu = 4)
  (4, 'Thứ Năm', 'Tây Ninh', 1),
  (4, 'Thứ Năm', 'An Giang', 2),
  (4, 'Thứ Năm', 'Bình Thuận', 3),

  -- Thứ Sáu (thu = 5)
  (5, 'Thứ Sáu', 'Vĩnh Long', 1),
  (5, 'Thứ Sáu', 'Trà Vinh', 2),
  (5, 'Thứ Sáu', 'Bình Dương', 3),

  -- Thứ Bảy (thu = 6)
  (6, 'Thứ Bảy', 'TP.HCM', 1),
  (6, 'Thứ Bảy', 'Long An', 2),
  (6, 'Thứ Bảy', 'Hậu Giang', 3),
  (6, 'Thứ Bảy', 'Bình Phước', 4),

  -- Chủ Nhật (thu = 0)
  (0, 'Chủ Nhật', 'Tiền Giang', 1),
  (0, 'Chủ Nhật', 'Kiên Giang', 2),
  (0, 'Chủ Nhật', 'Lâm Đồng (Đà Lạt)', 3)
on conflict (thu, ten_dai) do update set
  ten_thu = excluded.ten_thu,
  thu_tu = excluded.thu_tu;
