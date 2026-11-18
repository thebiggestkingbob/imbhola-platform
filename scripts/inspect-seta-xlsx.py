#!/usr/bin/env python3
"""Offline, read-only XLSX structural audit for authentic official SETA workbooks.

No third-party packages, file uploads, workbook mutations or raw cell values.
The JSON manifest is safe to commit only after reviewing file metadata and name.
Do NOT use this manifest as evidence of regulatory approval.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
DOC_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"
NS = {"x": MAIN, "r": DOC_REL}

MAX_COMPRESSED_FILE = 32 * 1024 * 1024
MAX_UNCOMPRESSED_TOTAL = 160 * 1024 * 1024
MAX_ENTRY = 40 * 1024 * 1024
MAX_FILES = 5000
SAFE_PART = re.compile(r"^(?!/)(?![A-Za-z]:)(?!.*(?:^|/)\.\.(?:/|$))[a-zA-Z0-9_./-]+$")


def xml_part(archive: zipfile.ZipFile, name: str):
    info = archive.getinfo(name)
    if info.file_size > MAX_ENTRY:
        raise ValueError(f"Package part too large: {name}")
    return ET.fromstring(archive.read(name))


def inspect_xlsx(path: str) -> dict:
    file = Path(path)
    if file.suffix.lower() != ".xlsx" or not file.is_file():
        raise ValueError("Choose an existing .xlsx workbook")
    if file.stat().st_size > MAX_COMPRESSED_FILE:
        raise ValueError("Workbook exceeds compressed size limit")
    sha256 = hashlib.sha256()
    with file.open("rb") as source:
        for block in iter(lambda: source.read(1 << 20), b""):
            sha256.update(block)
    with zipfile.ZipFile(file) as z:
        parts = z.infolist()
        if len(parts) > MAX_FILES or sum(p.file_size for p in parts) > MAX_UNCOMPRESSED_TOTAL:
            raise ValueError("Oversized XLSX package")
        names = {p.filename for p in parts}
        if any(not SAFE_PART.fullmatch(p.filename) for p in parts):
            raise ValueError("Unsafe XLSX member path")
        if any(p.file_size > MAX_ENTRY for p in parts):
            raise ValueError("Oversized XLSX member")
        if any(name.lower().endswith((".bin", ".vba", ".exe", ".js")) for name in names):
            raise ValueError("Potentially active or embedded workbook content")
        if any("externalLinks/" in name or name.startswith("xl/connections") for name in names):
            raise ValueError("External workbook connection requires manual review")
        if "xl/workbook.xml" not in names or "xl/_rels/workbook.xml.rels" not in names:
            raise ValueError("Not an Open XML workbook")
        book = xml_part(z, "xl/workbook.xml")
        rels = xml_part(z, "xl/_rels/workbook.xml.rels")
        relationships = {}
        for rel in rels.findall(f"{{{PKG_REL}}}Relationship"):
            target = rel.attrib.get("Target", "")
            if rel.attrib.get("TargetMode") == "External":
                raise ValueError("External workbook relationship requires manual review")
            relationships[rel.attrib.get("Id")] = target
        sheets = []
        for item in book.findall("x:sheets/x:sheet", NS):
            rel_id = item.attrib.get(f"{{{DOC_REL}}}id")
            target = relationships.get(rel_id)
            if not target:
                raise ValueError("Worksheet missing relationship target")
            if target.startswith("/xl/"):
                part_name = target.removeprefix("/")
            else:
                part_name = os.path.normpath(os.path.join("xl", target)).replace("\\", "/")
            if not part_name.startswith("xl/") or part_name not in names:
                raise ValueError("Invalid worksheet relationship")
            sheet = xml_part(z, part_name)
            validations = sheet.find("x:dataValidations", NS)
            protection = sheet.find("x:sheetProtection", NS)
            dimension = sheet.find("x:dimension", NS)
            cells = sheet.findall(".//x:sheetData/x:row/x:c", NS)
            formulas = sum(c.find("x:f", NS) is not None for c in cells)
            sheets.append({
                "sheet_name": item.attrib.get("name", ""),
                "sheet_state": item.attrib.get("state", "visible"),
                "dimension": (dimension.attrib.get("ref") if dimension is not None else None),
                "declared_cells": len(cells),
                "formula_cells": formulas,
                "data_validation_rules": len(validations.findall("x:dataValidation", NS)) if validations is not None else 0,
                "protected": protection is not None,
            })
        if not sheets:
            raise ValueError("Workbook contains no worksheets")
        defined_names = book.find("x:definedNames", NS)
        return {
            "kind": "IMBHOLA_UNVERIFIED_XLSX_STRUCTURE",
            "sha256": sha256.hexdigest(),
            "bytes": file.stat().st_size,
            "workbook_name": file.name,
            "sheets": sheets,
            "defined_name_count": len(defined_names) if defined_names is not None else 0,
            "active_content": False,
            "official_format_verified": False,
            "source_approval_required": True,
            "contains_cell_values": False,
        }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workbooks", nargs="+", help="Original .xlsx template(s)")
    parser.add_argument("--out", help="Write combined JSON manifest to this path")
    args = parser.parse_args()
    try:
        manifest = {"audit": "unverified-source-inspection", "workbooks": [inspect_xlsx(p) for p in args.workbooks]}
        output = json.dumps(manifest, indent=2) + "\n"
        if args.out:
            Path(args.out).write_text(output, encoding="utf-8")
        else:
            print(output)
    except (OSError, ValueError, zipfile.BadZipFile, ET.ParseError) as error:
        print(f"Workbook inspection failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
