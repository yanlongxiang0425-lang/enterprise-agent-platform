from unittest import TestCase

from material_agent.api.routes import list_mcp_servers, list_model_routes, list_skills, list_tools, select_model_route


class PlatformCapabilityTests(TestCase):
    def test_builtin_tool_mcp_skill_entries_exist(self):
        self.assertTrue(any(tool["tool_key"] == "excel-profile" for tool in list_tools()))
        self.assertTrue(any(server["server_key"] == "local-filesystem" for server in list_mcp_servers()))
        self.assertTrue(any(skill["skill_key"] == "material-classification-completion" for skill in list_skills()))

    def test_model_gateway_selects_route_by_purpose(self):
        route = select_model_route("structured-excel-completion")

        self.assertEqual(route["route_key"], "offline-rule-first")
        self.assertTrue(any(item["purpose"] == "knowledge-retrieval" for item in list_model_routes()))
