import io
import tarfile

import pytest

from scripts.hyperframes_upstream_report import _safe_extract


def _tar_with_member(tmp_path, member: tarfile.TarInfo) -> tarfile.TarFile:
    archive_path = tmp_path / "malicious.tgz"
    with tarfile.open(archive_path, "w:gz") as archive:
        archive.addfile(member, io.BytesIO(b"payload"))
    return tarfile.open(archive_path, "r:gz")


def test_safe_extract_rejects_path_traversal_member(tmp_path):
    member = tarfile.TarInfo("../escape.txt")
    member.size = len(b"payload")

    with _tar_with_member(tmp_path, member) as archive:
        with pytest.raises(RuntimeError, match="unsafe tar member path"):
            _safe_extract(archive, tmp_path / "out")


def test_safe_extract_rejects_symlink_member(tmp_path):
    member = tarfile.TarInfo("package/dist/skills/hyperframes")
    member.type = tarfile.SYMTYPE
    member.linkname = "../../../../escape"

    with _tar_with_member(tmp_path, member) as archive:
        with pytest.raises(RuntimeError, match="unsafe tar member type"):
            _safe_extract(archive, tmp_path / "out")


def test_safe_extract_rejects_hardlink_member(tmp_path):
    member = tarfile.TarInfo("package/dist/skills/hyperframes/SKILL.md")
    member.type = tarfile.LNKTYPE
    member.linkname = "../../../../escape"

    with _tar_with_member(tmp_path, member) as archive:
        with pytest.raises(RuntimeError, match="unsafe tar member type"):
            _safe_extract(archive, tmp_path / "out")
