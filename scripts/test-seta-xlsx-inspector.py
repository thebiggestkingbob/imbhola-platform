"""Synthetic XLSX fixtures: no official document or employee information stored."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile

SPEC = importlib.util.spec_from_file_location("inspector", Path(__file__).with_name("inspect-seta-xlsx.py"))
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)

WORKBOOK = b'''<?xml version="1.0"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Employees" sheetId="1" r:id="rId1"/></sheets></workbook>'''
RELS = b'''<?xml version="1.0"?><Relationships
 xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Target="worksheets/sheet1.xml"
 Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"/>
</Relationships>'''
SHEET = b'''<?xml version="1.0"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<dimension ref="A1:B2"/><sheetData>
<row r="1"><c r="A1" t="inlineStr"><is><t>PRIVATE_SENTINEL_TEST_DATA</t></is></c><c r="B1"><f>1+1</f></c></row>
</sheetData>
<dataValidations count="1"><dataValidation type="list" sqref="A2"/></dataValidations>
</worksheet>'''


class WorkbookInspectorTests(unittest.TestCase):
    def make_file(self, path, *, extra=None):
        with ZipFile(path, "w") as z:
            z.writestr("xl/workbook.xml", WORKBOOK)
            z.writestr("xl/_rels/workbook.xml.rels", RELS)
            z.writestr("xl/worksheets/sheet1.xml", SHEET)
            for key, value in (extra or {}).items():
                z.writestr(key, value)

    def test_structural_manifest_excludes_cell_values(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "synthetic.xlsx"
            self.make_file(path)
            result = module.inspect_xlsx(str(path))
            self.assertFalse(result["official_format_verified"])
            self.assertFalse(result["contains_cell_values"])
            self.assertEqual(result["sheets"][0]["sheet_name"], "Employees")
            self.assertEqual(result["sheets"][0]["formula_cells"], 1)
            self.assertEqual(result["sheets"][0]["data_validation_rules"], 1)
            self.assertNotIn("PRIVATE_SENTINEL_TEST_DATA", str(result["sheets"][0]))

    def test_rejects_macro_content(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "synthetic.xlsx"
            self.make_file(path, extra={"xl/vbaProject.bin": b"invalid"})
            with self.assertRaisesRegex(ValueError, "active"):
                module.inspect_xlsx(str(path))

    def test_rejects_external_connections(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "synthetic.xlsx"
            self.make_file(path, extra={"xl/externalLinks/externalLink1.xml": b""})
            with self.assertRaisesRegex(ValueError, "External"):
                module.inspect_xlsx(str(path))

    def test_rejects_non_workbooks(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "not_a_workbook.xlsx"
            path.write_bytes(b"not a zip")
            with self.assertRaises(Exception):
                module.inspect_xlsx(str(path))


if __name__ == "__main__":
    unittest.main()
