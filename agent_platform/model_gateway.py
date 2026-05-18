from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class ModelRoute:
    route_key: str
    provider: str
    model_name: str
    purpose: str
    priority: int = 100
    enabled: bool = True


class ModelGateway:
    def __init__(self):
        self._routes: Dict[str, ModelRoute] = {}

    def register_route(self, route: ModelRoute) -> ModelRoute:
        self._routes[route.route_key] = route
        return route

    def list_routes(self) -> List[ModelRoute]:
        return sorted(self._routes.values(), key=lambda route: (route.purpose, route.priority, route.route_key))

    def select_route(self, purpose: str) -> ModelRoute:
        candidates = [route for route in self.list_routes() if route.enabled and route.purpose == purpose]
        if not candidates:
            raise KeyError(f"No model route configured for purpose: {purpose}")
        return candidates[0]


default_model_gateway = ModelGateway()


def register_builtin_model_routes() -> ModelGateway:
    default_model_gateway.register_route(
        ModelRoute(
            route_key="offline-rule-first",
            provider="offline",
            model_name="rule-first",
            purpose="structured-excel-completion",
            priority=10,
        )
    )
    default_model_gateway.register_route(
        ModelRoute(
            route_key="offline-embedding-placeholder",
            provider="offline",
            model_name="hashing-vector-placeholder",
            purpose="knowledge-retrieval",
            priority=20,
        )
    )
    return default_model_gateway
