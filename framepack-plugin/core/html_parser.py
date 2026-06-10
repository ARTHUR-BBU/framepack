"""Lightweight HTML structural parser for HyperFrames contract checks.

Uses Python's stdlib html.parser — no external dependencies.
Provides DOM-aware checks that pure regex cannot do reliably:
  - <video> nested inside timed scene containers
  - Root container missing HyperFrames attributes
  - Imperative media control (currentTime assignment) in <script> blocks

The parser is intentionally simple: it only cares about element nesting
depth and attribute presence, not full DOM reconstruction.
"""

from html.parser import HTMLParser
from dataclasses import dataclass, field


@dataclass
class Element:
    """A simplified HTML element for structural checks."""
    tag: str
    attrs: dict[str, str]
    depth: int
    children: list["Element"] = field(default_factory=list)
    parent: "Element | None" = None


class HyperFramesHTMLParser(HTMLParser):
    """Parse HyperFrames index.html into a lightweight tree for structural checks.

    Builds a flat element list with depth tracking and parent-child relationships.
    Does NOT handle malformed HTML gracefully — HyperFrames output is well-formed.
    """

    def __init__(self):
        super().__init__()
        self.elements: list[Element] = []
        self._stack: list[Element] = []
        self._depth = 0
        self._script_content: list[str] = []
        self._in_script = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_dict = {k: (v if v is not None else "") for k, v in attrs}
        elem = Element(tag=tag, attrs=attr_dict, depth=self._depth)

        if self._stack:
            elem.parent = self._stack[-1]
            self._stack[-1].children.append(elem)

        self.elements.append(elem)
        self._depth += 1
        self._stack.append(elem)

        if tag == "script":
            self._in_script = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "script":
            self._in_script = False

        # Pop stack until we find matching tag
        while self._stack and self._stack[-1].tag != tag:
            self._stack.pop()
            self._depth = max(0, self._depth - 1)

        if self._stack:
            self._stack.pop()
            self._depth = max(0, self._depth - 1)

    def handle_data(self, data: str) -> None:
        if self._in_script:
            self._script_content.append(data)

    @property
    def script_text(self) -> str:
        """All <script> content concatenated."""
        return "\n".join(self._script_content)


# ── Structural check helpers ──


def find_root_container(parser: HyperFramesHTMLParser) -> Element | None:
    """Find the root HyperFrames container element.

    Heuristic: the first <div> that contains scene children
    (elements with data-start or class="scene").
    Falls back to the first <div> with an id containing 'hyperframes'.
    """
    for elem in parser.elements:
        if elem.tag != "div":
            continue
        # Check if this div has children with data-start
        has_scenes = any(
            "data-start" in child.attrs
            for child in elem.children
        )
        if has_scenes:
            return elem
        # Check by id
        elem_id = elem.attrs.get("id", "").lower()
        if "hyperframes" in elem_id or "composition" in elem_id:
            return elem

    # Fallback: shallowest div with data-composition-id
    for elem in parser.elements:
        if elem.tag == "div" and "data-composition-id" in elem.attrs:
            return elem

    return None


def find_timed_containers(parser: HyperFramesHTMLParser) -> list[Element]:
    """Find all elements that are timed scene containers (have data-start)."""
    return [
        elem for elem in parser.elements
        if "data-start" in elem.attrs
    ]


def find_videos_in_timed_containers(parser: HyperFramesHTMLParser) -> list[dict]:
    """Find <video> elements nested inside timed scene containers.

    Returns list of {video_id, parent_id, parent_start}.
    """
    timed = find_timed_containers(parser)
    violations = []

    for container in timed:
        for child in _walk_children(container):
            if child.tag == "video":
                violations.append({
                    "video_id": child.attrs.get("id", "(unknown)"),
                    "parent_id": container.attrs.get("id", "(unknown)"),
                    "parent_start": container.attrs.get("data-start", "?"),
                })

    return violations


def check_root_container_attrs(parser: HyperFramesHTMLParser) -> list[str]:
    """Check that the root container has required HyperFrames attributes.

    Required: data-composition-id, class="clip".
    Returns list of missing attribute names.
    """
    root = find_root_container(parser)
    if root is None:
        return ["data-composition-id", "class=\"clip\""]

    missing = []
    if "data-composition-id" not in root.attrs:
        missing.append("data-composition-id")
    if "clip" not in root.attrs.get("class", ""):
        missing.append("class=\"clip\"")

    return missing


def check_imperative_media_control(script_text: str) -> list[str]:
    """Check for imperative media control patterns in <script> content.

    Detects: currentTime =, .play(), .pause()
    Returns list of violation descriptions.
    """
    import re

    violations = []

    # currentTime = in GSAP context: { currentTime: 5 } or .currentTime = 5
    # We catch both JS property assignment and GSAP param object forms
    if re.search(r'\.currentTime\s*=', script_text):
        violations.append(
            "video.currentTime = assignment — HyperFrames prohibits imperative media control. "
            "Use GSAP timeline control instead."
        )
    elif re.search(r'currentTime\s*:', script_text):
        # GSAP .set() / .to() with currentTime param — also prohibited
        violations.append(
            "currentTime in GSAP params — HyperFrames prohibits imperative media control via "
            "currentTime. Use GSAP timeline seek/progress instead."
        )

    if re.search(r'\.play\(\)', script_text):
        violations.append(
            ".play() detected — HyperFrames prohibits imperative media control."
        )

    if re.search(r'\.pause\(\)', script_text):
        violations.append(
            ".pause() detected — HyperFrames prohibits imperative media control."
        )

    return violations


def _walk_children(elem: Element) -> list[Element]:
    """Recursively collect all descendant elements."""
    result = []
    for child in elem.children:
        result.append(child)
        result.extend(_walk_children(child))
    return result
