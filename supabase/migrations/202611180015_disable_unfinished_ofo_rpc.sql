-- Disable incomplete OFO-review RPC until validated reference import and
-- controlled operator review have been implemented and security-tested.
-- Deliberately retain read-only review table and source version registry.
drop function if exists public.review_employee_ofo(uuid,uuid,uuid,text,text);
