from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase

from material_agent.core.config import settings
from material_agent.domain.models import AgentTaskStatus
from material_agent.repositories.task_repository import JsonFileTaskRepository
from material_agent.services.knowledge_service import KnowledgeBaseService
from material_agent.services.task_service import MaterialTaskService


class KnowledgeBaseServiceTests(TestCase):
    def test_knowledge_import_task_generates_manifest(self):
        if not settings.target_template_file.exists():
            self.skipTest("Sample Excel files are not available on this machine.")

        with TemporaryDirectory() as task_dir, TemporaryDirectory() as kb_dir:
            service = MaterialTaskService(
                repository=JsonFileTaskRepository(Path(task_dir)),
                knowledge_service=KnowledgeBaseService(Path(kb_dir)),
            )
            task = service.create_knowledge_import_task(settings.target_template_file, name="target-template", created_by="kb-test")
            completed = service.run_task(task.task_id)

            self.assertEqual(completed.status, AgentTaskStatus.SUCCEEDED)
            self.assertEqual(completed.metrics["progress"], 100)
            manifest = service.knowledge_service.get_manifest(completed.metrics["knowledge_base_id"])
            self.assertEqual(manifest["name"], "target-template")
            self.assertTrue(Path(manifest["artifact_file"]).exists())
            self.assertTrue(Path(manifest["manifest_file"]).exists())

            export_file = service.knowledge_service.export_manifest(completed.metrics["knowledge_base_id"])
            self.assertTrue(export_file.exists())
