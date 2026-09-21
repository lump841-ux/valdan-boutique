insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('hero-images',   'hero-images',   true, 10485760, array['image/jpeg','image/jpg','image/png','image/webp']),
  ('products',       'products',      true, 10485760, array['image/jpeg','image/jpg','image/png','image/webp']),
  ('collections',    'collections',   true, 10485760, array['image/jpeg','image/jpg','image/png','image/webp']),
  ('media-library',  'media-library', true, 10485760, array['image/jpeg','image/jpg','image/png','image/webp'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read hero-images" on storage.objects;
create policy "public read hero-images" on storage.objects for select
  using (bucket_id = 'hero-images');

drop policy if exists "public read products" on storage.objects;
create policy "public read products" on storage.objects for select
  using (bucket_id = 'products');

drop policy if exists "public read collections" on storage.objects;
create policy "public read collections" on storage.objects for select
  using (bucket_id = 'collections');

drop policy if exists "public read media-library" on storage.objects;
create policy "public read media-library" on storage.objects for select
  using (bucket_id = 'media-library');

drop policy if exists "admins write hero-images" on storage.objects;
create policy "admins write hero-images" on storage.objects for insert
  with check (bucket_id = 'hero-images' and is_admin());
drop policy if exists "admins update hero-images" on storage.objects;
create policy "admins update hero-images" on storage.objects for update
  using (bucket_id = 'hero-images' and is_admin());
drop policy if exists "admins delete hero-images" on storage.objects;
create policy "admins delete hero-images" on storage.objects for delete
  using (bucket_id = 'hero-images' and is_admin());

drop policy if exists "admins write products" on storage.objects;
create policy "admins write products" on storage.objects for insert
  with check (bucket_id = 'products' and is_admin());
drop policy if exists "admins update products" on storage.objects;
create policy "admins update products" on storage.objects for update
  using (bucket_id = 'products' and is_admin());
drop policy if exists "admins delete products" on storage.objects;
create policy "admins delete products" on storage.objects for delete
  using (bucket_id = 'products' and is_admin());

drop policy if exists "admins write collections" on storage.objects;
create policy "admins write collections" on storage.objects for insert
  with check (bucket_id = 'collections' and is_admin());
drop policy if exists "admins update collections" on storage.objects;
create policy "admins update collections" on storage.objects for update
  using (bucket_id = 'collections' and is_admin());
drop policy if exists "admins delete collections" on storage.objects;
create policy "admins delete collections" on storage.objects for delete
  using (bucket_id = 'collections' and is_admin());

drop policy if exists "admins write media-library" on storage.objects;
create policy "admins write media-library" on storage.objects for insert
  with check (bucket_id = 'media-library' and is_admin());
drop policy if exists "admins update media-library" on storage.objects;
create policy "admins update media-library" on storage.objects for update
  using (bucket_id = 'media-library' and is_admin());
drop policy if exists "admins delete media-library" on storage.objects;
create policy "admins delete media-library" on storage.objects for delete
  using (bucket_id = 'media-library' and is_admin());
