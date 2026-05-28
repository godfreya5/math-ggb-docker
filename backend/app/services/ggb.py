import re

# Lines that look like GeoGebra commands
_GGB_LINE_RE = re.compile(
    r"^(?:[A-Z]\s*=|Segment|Line|Circle|Polygon|Midpoint|Angle|Perpendicular"
    r"|Parallel|Tangent|Intersect|Function|f\(x\)|g\(x\)|h\(x\))\s*[\(\[=]",
    re.IGNORECASE,
)


def _extract_commands(code: str):
    """Parse a block of code into individual GGB commands."""
    commands = []
    for line in code.split("\n"):
        stripped = line.strip()
        if stripped and not stripped.startswith("//") and not stripped.startswith("#"):
            commands.append(stripped)
    return commands if commands else None


def extract_ggb_commands(text: str):
    """Extract GeoGebra commands from AI response text.

    Strategy:
    1. Look for labeled ```ggb or ```geogebra code blocks
    2. Fall back to any ``` code block containing GGB-like lines
    3. Fall back to scanning the full text for GGB-like lines
    """
    if not text:
        return None

    # Strategy 1: labeled ```ggb or ```geogebra blocks
    match = re.search(r"```(?:ggb|geogebra)\s*\n?(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if match:
        return _extract_commands(match.group(1))

    # Strategy 2: any ``` block whose content looks like GGB
    for block_match in re.finditer(r"```(?:\w*)\s*\n?(.*?)```", text, re.DOTALL):
        code = block_match.group(1).strip()
        lines = code.split("\n")
        ggb_lines = [l for l in lines if _GGB_LINE_RE.match(l.strip())]
        if len(ggb_lines) >= 1 and len(ggb_lines) >= len(lines) * 0.5:
            return _extract_commands(code)

    # Strategy 3: scan full text for consecutive GGB-looking lines
    all_lines = text.split("\n")
    ggb_indices = [i for i, line in enumerate(all_lines) if _GGB_LINE_RE.match(line.strip())]
    if len(ggb_indices) >= 2:
        # Take the longest contiguous run of GGB-like lines
        best_start = ggb_indices[0]
        best_len = 1
        current_start = ggb_indices[0]
        current_len = 1
        for i in range(1, len(ggb_indices)):
            if ggb_indices[i] == ggb_indices[i - 1] + 1:
                current_len += 1
                if current_len > best_len:
                    best_len = current_len
                    best_start = current_start
            else:
                current_start = ggb_indices[i]
                current_len = 1
        code = "\n".join(all_lines[best_start : best_start + best_len])
        return _extract_commands(code)

    return None
