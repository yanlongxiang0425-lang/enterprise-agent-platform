from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase

from material_agent.core.config import MaterialAgentSettings
from material_agent.core.security import PathSecurityError, resolve_output_path, resolve_under_roots


class ConfigSecurityTests(TestCase):
    def test_settings_read_environment(self):
        settings = MaterialAgentSettings()

        self.assertGreaterEqual(settings.max_preview_rows, 1)
        self.assertGreater(settings.confidence_threshold, 0)
        self.assertTrue(settings.allowed_input_roots)

    def test_resolve_under_roots_accepts_child_path(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            file_path = root / "input.xlsx"
            file_path.write_text("placeholder", encoding="utf-8")

            resolved = resolve_under_roots(file_path, [root])

            self.assertEqual(resolved, file_path.resolve())

    def test_resolve_under_roots_rejects_outside_path(self):
        with TemporaryDirectory() as allowed, TemporaryDirectory() as outside:
            file_path = Path(outside) / "input.xlsx"
            file_path.write_text("placeholder", encoding="utf-8")

            with self.assertRaises(PathSecurityError):
                resolve_under_roots(file_path, [Path(allowed)])

    def test_resolve_output_path_rejects_path_traversal(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp) / "outputs"
            root.mkdir()

            with self.assertRaises(PathSecurityError):
                resolve_output_path("../escape.xlsx", root)
