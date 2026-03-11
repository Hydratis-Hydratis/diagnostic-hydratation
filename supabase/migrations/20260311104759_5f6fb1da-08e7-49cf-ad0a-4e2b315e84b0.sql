INSERT INTO public.user_roles (user_id, role)
VALUES ('a10f832d-4c20-476d-9387-8bce9d738089', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;