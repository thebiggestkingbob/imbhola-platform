# IMBHOLA — Services SETA 2026–27 pilot source map
Source review: 2026-11-18. This is a development reference, **not a legal determination or an official SETA adapter**.

## Official resources
1. [Employer resources](https://www.serviceseta.org.za/employers/) list the 2026–27 mandatory-grant forms, employee workbook, code sheet, LMIS guideline, WSP/ATR intervention matrix and employee spreadsheet guideline.
2. [2026–27 delegation/declaration form](https://servicessetawebsite.blob.core.windows.net/wordpresslivesite/2026/02/1.-MG_SOP_ANNEX_03_MANDATORY-GRANT-FORMS.pdf) is an inspected, three-page source.
3. [Employee workbook](https://servicessetawebsite.blob.core.windows.net/wordpresslivesite/2026/02/2.-MG_SOP_ANNEX_05_25-MANDATORY-GRANT-EMPLOYEE-PROFILE-TEMPLATE-Final.xlsx), [code sheet](https://servicessetawebsite.blob.core.windows.net/wordpresslivesite/2026/02/3.-MG_SOP_ANNEX_MANDATORY-GRANTS_CODE-SHEET.xlsx), [intervention matrix](https://servicessetawebsite.blob.core.windows.net/wordpresslivesite/2026/02/e.-MG_SOP_ANNEX_06_26-WSP-AND-ATR-INTERVENTION-MATRIX.pdf) and [spreadsheet guideline](https://servicessetawebsite.blob.core.windows.net/wordpresslivesite/2026/02/d.-2026-27-Mandatory-Grant_Employee-Spreadsheet-Guideline_Services-SETA.pdf) were **listed but not inspectable** during this run. Do not infer their internal columns, sheets, validation codes, cell locations, or required formulas.

## Directly inspected requirements — delegation & declaration PDF
- Company name, SDL number and total employee count at submission are identified on page 1.
- The form asks for an SDF appointment letter.
- Signature roles shown include SDF, a trade-union or designated employee representative, and a CEO/Managing Director.
- Page 2 contains a POPIA consent declaration signed by an authorised CEO/Director or Executive. It explicitly says an external SDF may not sign on behalf of the company.
- Page 3 includes a non-levy-paying employer declaration and related instructions.
- The published form has specific regulatory statements; only the original approved PDF can be used as the authoritative declaration document. IMBHOLA should attach the original completed form, never create a substitute by assumption.

## Implementation now committed
- Version-labeled Services SETA pilot source registry, with each document's inspection state.
- Static preparation checklist with traceable source references.
- Authenticated, role-scoped pilot workspace page.
- Unit tests proving complete-looking local checklist data cannot enable official export.

## Release blockers / source requests
- Obtain workbook and code-sheet bytes via official download or authorised upload. Inspect actual sheets, named ranges, validations, formulas and mandatory columns; construct fixtures and test exports **only after** source inspection.
- Obtain and inspect current LMIS guideline and intervention matrix, and verify dates/deadlines from live official notices.
- Confirm first pilot employer's Services SETA registration and identify an authorised SDF, employee representative, and executive reviewer.
- Complete secure evidence, audited signatures and version-locked report pack, plus POPIA review and Vercel staging.
- External submission stays on Services SETA's official approved system. No access to SETA systems or guaranteed grant awards is implied.
