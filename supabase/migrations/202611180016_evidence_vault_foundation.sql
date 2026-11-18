-- IMBHOLA Evidence Vault foundation. NO public file uploads or downloads enabled.
-- Review and private storage lifecycle design; actual file writes stay disabled.
alter table public.evidence_metadata
 add column if not exists evidence_category text not null default 'other'
 check (evidence_category in ('attendance_register','certificate','invoice','proof_of_payment','training_material','approval','other')),
 add column if not exists review_status text not null default 'pending_review'
 check (review_status in ('pending_review','needs_changes','accepted','rejected')),
 add column if not exists reviewed_by uuid references auth.users(id),
 add column if not exists reviewed_at timestamptz,
 add column if not exists review_comment text,
 add column if not exists retention_until date,
 add column if not exists byte_size bigint check (byte_size is null or byte_size between 1 and 52428800);

create index if not exists evidence_metadata_org_category_idx
 on public.evidence_metadata(organization_id,evidence_category,created_at desc);
create index if not exists evidence_metadata_org_review_idx
 on public.evidence_metadata(organization_id,review_status);
create index if not exists evidence_metadata_reviewer_idx
 on public.evidence_metadata(reviewed_by) where reviewed_by is not null;

-- Restrict pending and rejected evidence even for readers with general training access.
-- Only accepted, malware-cleared evidence metadata may be accessed using ordinary RLS.
drop policy if exists evidence_read on public.evidence_metadata;
create policy evidence_read on public.evidence_metadata for select to authenticated
using (
  private.has_org_role(
    organization_id,
    array['company_admin','hr_admin','training_admin','sdf','auditor','signatory']::public.imbhola_member_role[])
  and scan_status='clean'
  and review_status='accepted'
);

create trigger evidence_metadata_audit after insert or update or delete
 on public.evidence_metadata for each row execute function private.audit_tenant_change();
create trigger evidence_metadata_org_immutable before update
 on public.evidence_metadata for each row execute function private.prevent_org_move();

-- No storage.objects policies or bucket are created. Thus file ingress remains disabled.
-- Never apply public bucket access to evidence objects.
