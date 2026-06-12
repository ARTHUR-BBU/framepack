"""Trusted source whitelist tests."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.trusted_sources import is_trusted_url


def assert_trusted(url: str):
    trusted, label, license_note = is_trusted_url(url)
    assert trusted is True
    assert label
    assert license_note


def assert_rejected(url: str):
    trusted, label, license_note = is_trusted_url(url)
    assert trusted is False
    assert label is None
    assert license_note is None


def test_trusts_framepack_uri():
    assert_trusted("framepack://weapons/text-split-enter")


def test_trusts_nexu_io():
    assert_trusted("https://nexu.io/snippets/marble-intro.js")


def test_trusts_codepen_gsap():
    assert_trusted("https://codepen.io/@gsap/pen/abcd")


def test_trusts_github_hyperframes():
    assert_trusted("https://github.com/hyperframes/examples/blob/main/weapon.js")


def test_rejects_random_github_repo():
    assert_rejected("https://github.com/random-user/random-repo/blob/main/fx.js")


def test_rejects_unknown_cdn():
    assert_rejected("https://evil-cdn.example.com/fx.js")
