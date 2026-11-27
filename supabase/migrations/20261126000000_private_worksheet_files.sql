insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('worksheet-files', 'worksheet-files', false, 26214400,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Standard users get a signed URL only through the application server.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'worksheet files admin manage'
  ) then
    create policy "worksheet files admin manage"
    on storage.objects for all to authenticated
    using (bucket_id = 'worksheet-files' and public.is_admin())
    with check (
      bucket_id = 'worksheet-files' and public.is_admin()
      and (storage.foldername(name))[1] = 'worksheets'
    );
  end if;
end
$$;

comment on column public.worksheets.file_url is
  'New values are object paths in the private worksheet-files bucket. Legacy public site-media URLs require a verified private copy.';
