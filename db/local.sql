PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  password TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('employer','sdf','operations')),
  verified_at TEXT
) STRICT;
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, seta TEXT NOT NULL DEFAULT '',
  sdl TEXT NOT NULL DEFAULT '', parent_id TEXT REFERENCES tenants(id)
) STRICT;
CREATE TABLE IF NOT EXISTS membership (
  tenant TEXT NOT NULL REFERENCES tenants(id), user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK(role IN ('owner','hr','training','finance','committee','signatory','sdf')),
  expires TEXT, PRIMARY KEY(tenant,user_id),
  CHECK(role != 'sdf' OR expires IS NOT NULL)
) STRICT;
CREATE TABLE IF NOT EXISTS records (
  tenant TEXT NOT NULL REFERENCES tenants(id), id TEXT NOT NULL, kind TEXT NOT NULL,
  data TEXT NOT NULL CHECK(json_valid(data)), PRIMARY KEY(tenant,kind,id)
) STRICT;
CREATE UNIQUE INDEX IF NOT EXISTS employee_number ON records(tenant,lower(json_extract(data,'$.number'))) WHERE kind='employee';
CREATE TABLE IF NOT EXISTS ofo (
  version TEXT NOT NULL, code TEXT NOT NULL, title TEXT NOT NULL, source TEXT NOT NULL,
  PRIMARY KEY(version,code)
) STRICT;
CREATE TABLE IF NOT EXISTS reports (
  tenant TEXT NOT NULL REFERENCES tenants(id), year INTEGER NOT NULL, version INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('review','returned','approved','signed')),
  snapshot TEXT NOT NULL CHECK(json_valid(snapshot)), digest TEXT NOT NULL,
  submitted_by TEXT NOT NULL REFERENCES users(id), approved_by TEXT REFERENCES users(id),
  signed_by TEXT REFERENCES users(id), signed_at TEXT,
  PRIMARY KEY(tenant,year,version)
) STRICT;
CREATE TRIGGER IF NOT EXISTS freeze_report BEFORE UPDATE ON reports
WHEN OLD.status IN ('signed','returned') OR NEW.snapshot IS NOT OLD.snapshot OR
  NEW.digest IS NOT OLD.digest OR NEW.tenant IS NOT OLD.tenant OR NEW.year IS NOT OLD.year OR
  NEW.version IS NOT OLD.version OR NEW.submitted_by IS NOT OLD.submitted_by
BEGIN SELECT RAISE(ABORT,'Report is immutable'); END;
CREATE TRIGGER IF NOT EXISTS keep_report BEFORE DELETE ON reports
BEGIN SELECT RAISE(ABORT,'Report history cannot be deleted'); END;
CREATE TABLE IF NOT EXISTS evidence (
  tenant TEXT NOT NULL REFERENCES tenants(id), id TEXT NOT NULL, training_id TEXT NOT NULL,
  label TEXT NOT NULL, filename TEXT NOT NULL, mime TEXT NOT NULL, bytes BLOB NOT NULL,
  digest TEXT NOT NULL, uploaded_at TEXT NOT NULL, uploaded_by TEXT NOT NULL REFERENCES users(id),
  PRIMARY KEY(tenant,id)
) STRICT;
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY, tenant TEXT REFERENCES tenants(id), user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL, subject TEXT NOT NULL, created_at TEXT NOT NULL
) STRICT;
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit
BEGIN SELECT RAISE(ABORT,'Audit history is append-only'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit
BEGIN SELECT RAISE(ABORT,'Audit history is append-only'); END;
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT NOT NULL,
  purpose TEXT NOT NULL, consent_version TEXT NOT NULL, created_at TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS commercial (
  tenant TEXT NOT NULL REFERENCES tenants(id), id TEXT NOT NULL, type TEXT NOT NULL,
  name TEXT NOT NULL, cents INTEGER NOT NULL CHECK(cents >= 0), status TEXT NOT NULL,
  reference TEXT NOT NULL, PRIMARY KEY(tenant,id)
) STRICT;
CREATE TABLE IF NOT EXISTS invitations (
  tenant TEXT NOT NULL REFERENCES tenants(id), user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK(role IN ('hr','training','finance','committee','signatory')),
  expires TEXT NOT NULL, PRIMARY KEY(tenant,user_id)
) STRICT;
CREATE TABLE IF NOT EXISTS support (
  tenant TEXT NOT NULL REFERENCES tenants(id), id TEXT PRIMARY KEY, title TEXT NOT NULL,
  detail TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('open','resolved')), created_at TEXT NOT NULL
) STRICT;
