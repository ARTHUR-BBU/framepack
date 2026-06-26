#!/usr/bin/env python
"""Framepack template bundle CLI.

This CLI manages template bundles as arsenal-style weapon suites. It does not
render, audit, or create per-template skills.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Sequence

PLUGIN_ROOT = Path(__file__).resolve().parent.parent
if str(PLUGIN_ROOT) not in sys.path:
    sys.path.insert(0, str(PLUGIN_ROOT))

from core.templates.productize import package_template_source
from core.templates.registry import discover_templates
from core.templates.scaffold import scaffold_template_bundle
from core.templates.types import TemplateCard, inspect_template_bundle


def _card_from_args(args: argparse.Namespace, target: Path) -> TemplateCard:
    return TemplateCard(
        id=args.template_id,
        name=args.name,
        description=args.description,
        suitable_for=tuple(args.suitable_for or ()),
        not_suitable_for=tuple(args.not_suitable_for or ()),
        params=tuple(args.param or ()),
        path=str(target).replace("\\", "/"),
    )


def _print_json(payload: object) -> None:
    print(json.dumps(payload, ensure_ascii=False, indent=2))


def _add_card_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--id", dest="template_id", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--description", required=True)
    parser.add_argument("--suitable-for", action="append", default=[])
    parser.add_argument("--not-suitable-for", action="append", default=[])
    parser.add_argument("--param", action="append", default=[])
    parser.add_argument("--overwrite", action="store_true")


def _cmd_inspect(args: argparse.Namespace) -> int:
    template_dir = Path(args.template_dir)
    if not template_dir.is_dir():
        print(f"template_dir not found: {template_dir}", file=sys.stderr)
        return 2
    report = inspect_template_bundle(template_dir)
    if args.format == "json":
        _print_json(report.to_dict())
    else:
        name = report.card.name if report.card else "<missing TEMPLATE_CARD.md>"
        print(f"{report.status}: {name}")
        for issue in report.issues:
            print(f"- {issue.severity} {issue.code}: {issue.message}")
    return 0


def _cmd_list(args: argparse.Namespace) -> int:
    missing_roots = [str(root) for root in args.root if not Path(root).is_dir()]
    if missing_roots:
        print(f"root not found: {missing_roots[0]}", file=sys.stderr)
        return 2
    reports = discover_templates(args.root, include_incomplete=args.include_incomplete)
    if args.format == "json":
        _print_json({"templates": [report.to_dict() for report in reports]})
    else:
        for report in reports:
            if report.card:
                print(f"{report.card.id}\t{report.card.name}\t{report.status}")
            else:
                print(f"<incomplete>\t{report.template_dir}\t{report.status}")
    return 0


def _cmd_scaffold(args: argparse.Namespace) -> int:
    target = Path(args.target)
    card = _card_from_args(args, target)
    scaffold_template_bundle(target, card, overwrite=args.overwrite)
    if args.format == "json":
        _print_json(inspect_template_bundle(target).to_dict())
    else:
        print(f"scaffolded template bundle: {target}")
    return 0


def _cmd_package(args: argparse.Namespace) -> int:
    source = Path(args.source)
    if not source.is_dir():
        print(f"source not found: {source}", file=sys.stderr)
        return 2
    target = Path(args.target)
    card = _card_from_args(args, target)
    package_template_source(source, target, card, overwrite=args.overwrite)
    if args.format == "json":
        _print_json(inspect_template_bundle(target).to_dict())
    else:
        print(f"packaged template bundle: {target}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Framepack template bundle CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    inspect_parser = subparsers.add_parser("inspect", help="inspect a template bundle")
    inspect_parser.add_argument("template_dir")
    inspect_parser.add_argument("--format", choices=("text", "json"), default="text")
    inspect_parser.set_defaults(func=_cmd_inspect)

    list_parser = subparsers.add_parser("list", help="list discovered template bundles")
    list_parser.add_argument("--root", action="append", required=True)
    list_parser.add_argument("--include-incomplete", action="store_true")
    list_parser.add_argument("--format", choices=("text", "json"), default="text")
    list_parser.set_defaults(func=_cmd_list)

    scaffold_parser = subparsers.add_parser("scaffold", help="create a template bundle skeleton")
    scaffold_parser.add_argument("target")
    scaffold_parser.add_argument("--format", choices=("text", "json"), default="text")
    _add_card_args(scaffold_parser)
    scaffold_parser.set_defaults(func=_cmd_scaffold)

    package_parser = subparsers.add_parser("package", help="productize a source project into a template bundle")
    package_parser.add_argument("source")
    package_parser.add_argument("target")
    package_parser.add_argument("--format", choices=("text", "json"), default="text")
    _add_card_args(package_parser)
    package_parser.set_defaults(func=_cmd_package)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return int(args.func(args))
    except (FileExistsError, FileNotFoundError, NotADirectoryError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
