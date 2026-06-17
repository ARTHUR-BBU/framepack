# Feature-Level E2E Testing for Framepack

Use when testing a specific Framepack feature end-to-end — the layer between
unit tests (individual functions) and release testing (full version).
Answers: "does this feature actually work when you walk through it?"

## When to Use

- A new Framepack phase/feature is implemented and unit tests are green,
  but no one has walked the full flow yet.
- Before committing a feature as "done" — unit tests prove the parts,
  e2e proves the assembly.
- After modifying a feature's core module — regression check.

## Pattern

```
1. Generate synthetic fixtures (no external deps — stdlib only)
2. Import the REAL module from framepack-plugin/
3. Walk the full feature flow step by step
4. Produce the real output artifact
5. Validate with assertions on the output
6. Report pass/fail per check + summary
```

Key principle: **call the real code, not a mock.** The test proves the module
works in context, not just in isolation.

## Synthetic Fixture Generation (no Pillow)

Framepack's asset_detector tests use stdlib PNG/JPG/SVG synthesis.
Reuse this technique for any test that needs image files:

### PNG (with controllable alpha)

```python
import struct, zlib

def _write_png(path, width=4, height=4, has_alpha=True, fully_opaque=False):
    channels = 4 if has_alpha else 3
    color_type = 6 if has_alpha else 2  # 6=RGBA, 2=RGB
    raw = bytearray()
    for _y in range(height):
        raw.append(0)  # filter byte: None
        for _x in range(width):
            raw.extend(b'\xff\x00\x00')  # red pixel
            if has_alpha:
                raw.append(255 if fully_opaque else 0)
    def _chunk(ct, data):
        c = ct + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, color_type, 0, 0, 0)
    with open(path, 'wb') as f:
        f.write(sig + _chunk(b'IHDR', ihdr) + _chunk(b'IDAT', zlib.compress(bytes(raw))) + _chunk(b'IEND', b''))
```

### JPG (minimal fake — extension detection only)

```python
def _write_jpg(path):
    path.write_bytes(b'\xff\xd8\xff\xe0' + b'\x00' * 100 + b'\xff\xd9')
```

### SVG

```python
def _write_svg(path):
    path.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40">...</svg>')
```

## The RGBA Opacity Trap

A critical test case that distinguishes a naive transparency detector from a
correct one:

```
RGBA PNG (color_type=6) declares alpha channel in IHDR...
...but every pixel has alpha=255 (fully opaque).
```

A naive detector checks `color_type == 6` → "has alpha" → transparent=True.
This is WRONG — the image has an alpha channel but never uses it.
It should be flagged `needs_processing`.

Framepack's `asset_detector._has_any_transparency()` avoids this trap by
sampling the first 8 scanlines and checking for any `alpha < 255` value.

**Always include this case in asset detection tests.** See
`scripts/test_asset_intake_e2e.py` for the working example.

## Running Feature E2E Tests

Feature e2e tests live in `scripts/` and can be run directly:

```bash
cd F:/hyperframes/framepack-plugin
python ../skills/software-development/framepack/scripts/test_asset_intake_e2e.py
```

Or inline via `execute_code` for interactive testing with visible output.

## What Feature E2E Does NOT Replace

- **Unit tests** — still needed for edge cases, error handling, individual functions
- **Release testing** — full version validation (see `references/release-testing-workflow.md`)
- **Case project testing** — real-world creative pipeline exercise

Feature e2e is the **assembly test**: prove the parts connect correctly.
