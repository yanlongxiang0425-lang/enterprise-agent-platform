from __future__ import annotations

from concurrent.futures import Future, ThreadPoolExecutor
from typing import Protocol

from material_agent.domain.models import AgentTask


class TaskExecutor(Protocol):
    def submit(self, task_id: str) -> AgentTask: ...


class InlineTaskExecutor:
    """Executor used for local validation before a queue-backed worker is introduced."""

    def __init__(self, service):
        self.service = service

    def submit(self, task_id: str) -> AgentTask:
        return self.service.run_task(task_id)


class ThreadPoolTaskExecutor:
    """Local background executor; replace with Redis/Celery/RQ in distributed deployments."""

    def __init__(self, service, max_workers: int = 2):
        self.service = service
        self.pool = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="agent-task")
        self.futures: dict[str, Future] = {}

    def submit(self, task_id: str) -> AgentTask:
        queued = self.service.mark_queued(task_id)
        self.futures[task_id] = self.pool.submit(self.service.run_task, task_id)
        return queued

    def is_running(self, task_id: str) -> bool:
        future = self.futures.get(task_id)
        return bool(future and not future.done())
