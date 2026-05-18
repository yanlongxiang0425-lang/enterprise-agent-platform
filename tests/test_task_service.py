from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase

from material_agent.core.config import settings
from material_agent.domain.models import AgentTaskStatus, AgentTaskType
from material_agent.repositories.task_repository import JsonFileTaskRepository
from material_agent.services.task_service import MaterialTaskService


class TaskServiceTests(TestCase):
    def test_repository_round_trip(self):
        with TemporaryDirectory() as tmp:
            service = MaterialTaskService(repository=JsonFileTaskRepository(Path(tmp)))
            task = service.create_default_pilot_task(limit=1, created_by="tester")

            loaded = service.get_task(task.task_id)

            self.assertEqual(loaded.task_id, task.task_id)
            self.assertEqual(loaded.task_type, AgentTaskType.PILOT_COMPLETION)
            self.assertEqual(loaded.status, AgentTaskStatus.PENDING)
            self.assertEqual(loaded.created_by, "tester")
            self.assertEqual(loaded.params["limit"], 1)
            self.assertIn("knowledge_file", loaded.file_metadata)
            self.assertTrue(loaded.file_metadata["knowledge_file"].exists)
            self.assertGreater(loaded.file_metadata["knowledge_file"].size_bytes, 0)
            self.assertEqual(len(service.list_events(task.task_id)), 1)
            self.assertEqual(service.list_events(task.task_id)[0].event_type.value, "created")

    def test_run_task_updates_status_and_metrics(self):
        if not settings.plm_knowledge_file.exists() or not settings.target_template_file.exists():
            self.skipTest("Sample Excel files are not available on this machine.")

        with TemporaryDirectory() as tmp:
            service = MaterialTaskService(repository=JsonFileTaskRepository(Path(tmp)))
            task = service.create_default_pilot_task(limit=2, created_by="tester")

            completed = service.run_task(task.task_id)

            self.assertEqual(completed.status, AgentTaskStatus.SUCCEEDED)
            self.assertEqual(completed.metrics["rows"], 2)
            self.assertEqual(completed.metrics["fields"], 22)
            self.assertTrue(Path(completed.output_files["result_file"]).exists())
            self.assertTrue(completed.file_metadata["result_file"].exists)
            self.assertGreater(completed.file_metadata["result_file"].size_bytes, 0)
            self.assertEqual(len(completed.file_metadata["result_file"].sha256), 64)

            events = service.list_events(task.task_id)
            event_types = [event.event_type.value for event in events]
            self.assertEqual(event_types, ["created", "running", "succeeded"])
