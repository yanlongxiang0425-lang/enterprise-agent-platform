from __future__ import annotations

from pathlib import Path
from typing import Iterable


class PathSecurityError(ValueError):
    """Raised when a requested file path is outside configured project roots."""


def resolve_under_roots(path: str | Path, allowed_roots: Iterable[Path], *, must_exist: bool = True) -> Path:
    """Resolve a path and ensure it stays inside one of the configured roots."""

    resolved = Path(path).expanduser().resolve()
    if must_exist and not resolved.exists():
        raise FileNotFoundError(f"File does not exist: {resolved}")

    roots = [root.expanduser().resolve() for root in allowed_roots]
    for root in roots:
        if resolved == root or root in resolved.parents:
            return resolved
    allowed = ", ".join(str(root) for root in roots)
    raise PathSecurityError(f"Path is outside allowed roots: {resolved}; allowed roots: {allowed}")


def resolve_output_path(path: str | Path, output_root: Path) -> Path:
    """Resolve an output path and ensure generated files stay under output_root."""

    root = output_root.expanduser().resolve()
    candidate = Path(path).expanduser()
    resolved = (root / candidate).resolve() if not candidate.is_absolute() else candidate.resolve()
    if resolved != root and root not in resolved.parents:
        raise PathSecurityError(f"Output path is outside output root: {resolved}; output root: {root}")
    return resolved
