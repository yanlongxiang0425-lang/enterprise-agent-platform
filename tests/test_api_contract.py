from unittest import TestCase

from material_agent.api.errors import InvalidRequest
from material_agent.api.routes import _validate_limit, create_default_pilot_task, get_task, list_task_events


class ApiContractTests(TestCase):
    def test_validate_limit_rejects_invalid_values(self):
        with self.assertRaises(InvalidRequest):
            _validate_limit(0)

        with self.assertRaises(InvalidRequest):
            _validate_limit(501)

        self.assertEqual(_validate_limit(30), 30)

    def test_create_default_task_returns_pending_task(self):
        response = create_default_pilot_task(limit=1, created_by="api-test")

        loaded = get_task(response["task_id"])

        self.assertEqual(response["status"], "pending")
        self.assertEqual(response["created_by"], "api-test")
        self.assertEqual(loaded["task_id"], response["task_id"])
        self.assertIn("file_metadata", loaded)

        events = list_task_events(response["task_id"])
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["event_type"], "created")
