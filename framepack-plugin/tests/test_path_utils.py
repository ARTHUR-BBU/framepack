"""Tests for small shared path/io utilities."""

from __future__ import annotations

import json

from core.path_utils import markdown_table_cell, read_json_or_none, to_posix_string


class TestPathUtils:
    def test_to_posix_string_normalizes_backslashes(self):
        assert to_posix_string(r"C:\tmp\case\index.html") == "C:/tmp/case/index.html"

    def test_read_json_or_none_valid(self, tmp_path):
        path = tmp_path / "data.json"
        path.write_text(json.dumps({"ok": True}), encoding="utf-8")
        assert read_json_or_none(path) == {"ok": True}

    def test_read_json_or_none_missing(self, tmp_path):
        assert read_json_or_none(tmp_path / "missing.json") is None

    def test_read_json_or_none_invalid(self, tmp_path):
        path = tmp_path / "bad.json"
        path.write_text("not json", encoding="utf-8")
        assert read_json_or_none(path) is None

    def test_markdown_table_cell_escapes_pipes_and_newlines(self):
        assert markdown_table_cell("a | b\nc") == r"a \| b c"
