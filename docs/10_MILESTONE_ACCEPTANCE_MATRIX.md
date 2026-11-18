# M1 / M2 acceptance matrix

| Journey | Expected verified behavior | Status |
|---|---|---|
| Public homepage, navigation | Keyboard-accessible links, mobile nav and coherent content | Implemented in code; browser QA pending |
| Site builds on CI and Vercel | Typecheck, lint, build and a READY preview | Pending build verification |
| Login and registration | Explicitly inactive until verified identity backend exists | Intentionally inactive |
| Organization verification | Cannot claim an existing organization by name or domain | Designed, not implemented |
| Organization invitation | Expiring single-use secure invite with member approval | Designed, not implemented |
| Different organization access | Cross-tenant data denied at DB and API layers | Migration proposed; tests pending |
| SDF multi-org access | User sees only assigned organization data | Designed, not implemented |
| Employee self-service | Employee reads only their approved own records | Designed, not implemented |
| Audit | Security-sensitive actions append auditable events | Table proposed; writer pending |
| SETA rules and outputs | No official production outputs before rule/template approval | Disabled by design |

## Merge rule
Do not merge or deploy as a production-ready application until evidence exists for tests, privacy review and appropriate reviewer approval. Do not collect real employee data yet.
