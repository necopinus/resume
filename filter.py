#!/usr/bin/env python3
"""Trim the full resume.yaml down to a two-page public resume on stdout.

Cookie-cutter rules (one date cutoff, no per-entry special cases):

- work:      positions that ended on or after CUTOFF (or are ongoing) are
             kept in full; anything older is dropped.
- volunteer: same end-date rule as work.
- education: college degrees only (see COLLEGE_DEGREES).
- awards:    kept if dated on or after CUTOFF.

CUTOFF defaults to 2014-01-01, calibrated 2026-10-14: it keeps the core
positions (The Public Interest Network and Bureau Veritas) and fits two PDF
pages. Override with the CUTOFF environment variable (YYYY-MM-DD).

Layouts (engines, templates, section order and aliases) are not defined
here. They live in the `layouts` key of resume.yaml and pass through
untouched; sections dropped by the rules above are simply skipped at render
time. If resume.yaml has no `layouts` key, the output omits it too and
yamlresume falls back to its own built-in default layouts.

Usage: python3 filter.py resume.yaml > trimmed.yml
       (or let build.sh do it — PyYAML provided by `uv run --with pyyaml`)
"""

import os
import re
import sys
from datetime import date

import yaml

# Earliest end date kept in the trimmed resume. Calibrated 2026-10-14 as the
# oldest window that keeps the core positions (The Public Interest Network,
# 2009-10 to 2022-05; Bureau Veritas, 2022-05 to present) while fitting two
# PDF pages.
CUTOFF = date.fromisoformat(os.environ.get("CUTOFF", "2014-01-01"))

COLLEGE_DEGREES = {"Diploma", "Associate", "Bachelor", "Master", "Doctor"}

CUTOFF_KEY = (CUTOFF.year, CUTOFF.month, CUTOFF.day)


def date_key(value):
    """(year, month, day) tuple for a date-like value; None if missing or junk.

    Takes the first YYYY[-MM[-DD]] in the value, so year-only dates work and
    impossible dates like '2009-09-31' cannot raise. Tuple comparison is
    enough for cutoff checks; we never need a real date object here.
    """
    if not value:
        return None
    match = re.search(r"(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?", str(value))
    if not match:
        return None
    return (int(match[1]), int(match[2] or 1), int(match[3] or 1))


def ended_since_cutoff(entry, field):
    """True when entry[field] is absent/ongoing or falls on or after CUTOFF."""
    key = date_key(entry.get(field))
    return key is None or key >= CUTOFF_KEY


def trim_by_end_date(entries):
    return [entry for entry in entries if ended_since_cutoff(entry, "endDate")]


def trim_education(entries):
    return [entry for entry in entries if entry.get("degree") in COLLEGE_DEGREES]


def trim_awards(entries):
    return [entry for entry in entries if ended_since_cutoff(entry, "date")]


def block_strings(dumper, data):
    style = "|" if isinstance(data, str) and "\n" in data else None
    return dumper.represent_scalar("tag:yaml.org,2002:str", data, style=style)


def main():
    with open(sys.argv[1] if len(sys.argv) > 1 else "resume.yaml") as f:
        document = yaml.safe_load(f)

    content = document["content"]
    for section, trim in (
        ("work", trim_by_end_date),
        ("volunteer", trim_by_end_date),
        ("education", trim_education),
        ("awards", trim_awards),
    ):
        if section in content:
            trimmed = trim(content[section])
            if trimmed:
                content[section] = trimmed
            else:
                del content[section]

    yaml.add_representer(str, block_strings, Dumper=yaml.SafeDumper)
    yaml.safe_dump(
        document, sys.stdout, sort_keys=False, allow_unicode=True, width=4096
    )


if __name__ == "__main__":
    main()
