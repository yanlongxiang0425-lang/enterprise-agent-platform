from time import sleep
from unittest import TestCase

from agent_platform.registry import AgentRegistry
from material_agent.agent_definition import MATERIAL_CLASSIFICATION_AGENT, register_material_agent
from material_agent.api.routes import health, list_agents
from material_agent.domain.models import AgentTaskStatus
from material_agent.repositories.task_repository import JsonFileTaskRepository
from material_agent.services.task_executor import ThreadPoolTaskExecutor
from material_agent.services.task_service import MaterialTaskService
from pathlib import Path
from tempfile import TemporaryDirectory


class AgentPlatformTests(TestCase):
    def test_registry_registers_material_agent(self):
        registry = AgentRegistry()
        registry.register(MATERIAL_CLASSIFICATION_AGENT)

        agents = registry.list()

        self.assertEqual(len(agents), 1)
        self.assertEqual(agents[0].agent_key, "material-classification")
        self.assertIn("pilot_completion", agents[0].task_types)

    def test_platform_health_and_agent_listing_use_platform_name(self):
        register_material_agent()

        self.assertEqual(health()["component"], "enterprise-agent-platform")
        self.assertTrue(any(agent["agent_key"] == "material-classification" for agent in list_agents()))

    def test_thread_pool_executor_marks_task_queued(self):
        with TemporaryDirectory() as tmp:
            service = MaterialTaskService(repository=JsonFileTaskRepository(Path(tmp)))
            task = service.create_default_pilot_task(limit=1, created_by="executor-test")
            executor = ThreadPoolTaskExecutor(service)

            queued = executor.submit(task.task_id)

            self.assertEqual(queued.status, AgentTaskStatus.QUEUED)
            for _ in range(20):
                current = service.get_task(task.task_id)
                if current.status in {AgentTaskStatus.SUCCEEDED, AgentTaskStatus.FAILED}:
                    break
                sleep(0.1)
            events = [event.event_type.value for event in service.list_events(task.task_id)]
            self.assertIn("queued", events)
