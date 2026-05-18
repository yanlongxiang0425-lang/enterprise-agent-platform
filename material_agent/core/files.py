from __future__ import annotations

import hashlib
from pathlib import Path

from material_agent.domain.models import FileMetadata


def build_file_metadata(path: str | Path) -> FileMetadata:
    resolved = Path(path).expanduser().resolve()
    if not resolved.exists() or not resolved.is_file():
        return FileMetadata(path=str(resolved), exists=False)

    digest = hashlib.sha256()
    with resolved.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return FileMetadata(
        path=str(resolved),
        exists=True,
        size_bytes=resolved.stat().st_size,
        sha256=digest.hexdigest(),
    )
