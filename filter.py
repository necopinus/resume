#!/usr/bin/env python3
"""Trim the full resume.yaml down to a two-page public resume on stdout.

Rules (mirroring the old Handlebars theme, theme/index.js):

- work:      positions that ended within RECENT_YEARS (or are ongoing) are
             kept in full; positions that ended within PREVIOUS_YEARS are
             collapsed into a single synthetic "Previous Employment" entry;
             anything older is dropped.
- volunteer: kept if ongoing or ended within PREVIOUS_YEARS, minus
             EXCLUDED_VOLUNTEER_ORGS.
- education: post-secondary degrees are always kept; anything else only if
             it ended within PREVIOUS_YEARS.
- awards:    kept if dated within PREVIOUS_YEARS (undated awards are kept).

Cutoffs are relative to the current year; override with the RECENT_YEARS and
PREVIOUS_YEARS environment variables.

Usage: python3 filter.py resume.yaml > trimmed.yml
       (or let build.sh do it — PyYAML provided by `uv run --with pyyaml`)
"""

import os
import re
import sys
from datetime import date

import yaml

RECENT_YEARS = int(os.environ.get("RECENT_YEARS", "10"))
PREVIOUS_YEARS = int(os.environ.get("PREVIOUS_YEARS", "15"))

EXCLUDED_VOLUNTEER_ORGS = {"Colorado Indymedia"}
POSTSECONDARY_DEGREES = {"Diploma", "Associate", "Bachelor", "Master", "Doctor"}

SECTIONS = {
    "order": ["basics", "skills", "awards", "work", "education", "volunteer"],
    "aliases": {
        "work": "Professional Experience",
        "volunteer": "Community Involvement",
        "awards": "Certifications",
        "skills": "Technical Proficiency",
    },
}

LAYOUTS = [
    {"engine": "latex", "template": "moderncv-classic", "sections": SECTIONS},
    {"engine": "html", "template": "calm", "sections": SECTIONS},
]

CURRENT_YEAR = date.today().year
RECENT_CUTOFF = CURRENT_YEAR - RECENT_YEARS
PREVIOUS_CUTOFF = CURRENT_YEAR - PREVIOUS_YEARS


def year(value):
    """Extract a year from a date string, tolerating junk like '2009-09-31'."""
    if not value:
        return None
    match = re.search(r"\d{4}", str(value))
    return int(match.group(0)) if match else None


def end_year(entry):
    """Year an entry ended; None means ongoing (i.e. current)."""
    return year(entry.get("endDate"))


def trim_work(entries):
    recent, previous = [], []
    for entry in entries:
        ended = end_year(entry)
        if ended is None or ended >= RECENT_CUTOFF:
            recent.append(entry)
        elif ended >= PREVIOUS_CUTOFF:
            previous.append(entry)

    if previous:
        # Slash-join positions held at the same organization, then join the
        # per-organization clauses into a single summary line.
        clauses = []
        index = 0
        while index < len(previous):
            org = previous[index].get("name", "")
            positions = [previous[index].get("position", "")]
            index += 1
            while index < len(previous) and previous[index].get("name") == org:
                positions.append(previous[index].get("position", ""))
                index += 1
            clauses.append("/".join(positions) + (f" — {org}" if org else ""))

        start_years = [y for e in previous if (y := year(e.get("startDate")))]
        end_years = [y for e in previous if (y := end_year(e))]
        recent.append(
            {
                "name": "Various organizations",
                "position": "Previous Employment",
                "startDate": str(min(start_years)),
                "endDate": str(max(end_years)),
                "summary": ", ".join(clauses) + ".",
            }
        )

    return recent


def trim_volunteer(entries):
    kept = []
    for entry in entries:
        if entry.get("organization") in EXCLUDED_VOLUNTEER_ORGS:
            continue
        ended = end_year(entry)
        if ended is None or ended >= PREVIOUS_CUTOFF:
            kept.append(entry)
    return kept


def trim_education(entries):
    return [
        entry
        for entry in entries
        if entry.get("degree") in POSTSECONDARY_DEGREES
        or (end_year(entry) or 0) >= PREVIOUS_CUTOFF
    ]


def trim_awards(entries):
    return [
        entry
        for entry in entries
        if (year(entry.get("date")) or CURRENT_YEAR) >= PREVIOUS_CUTOFF
    ]


def block_strings(dumper, data):
    style = "|" if isinstance(data, str) and "\n" in data else None
    return dumper.represent_scalar("tag:yaml.org,2002:str", data, style=style)


def main():
    with open(sys.argv[1] if len(sys.argv) > 1 else "resume.yaml") as f:
        document = yaml.safe_load(f)

    content = document["content"]
    for section, trim in (
        ("work", trim_work),
        ("volunteer", trim_volunteer),
        ("education", trim_education),
        ("awards", trim_awards),
    ):
        if section in content:
            trimmed = trim(content[section])
            if trimmed:
                content[section] = trimmed
            else:
                del content[section]

    document["layouts"] = LAYOUTS

    yaml.add_representer(str, block_strings, Dumper=yaml.SafeDumper)
    yaml.safe_dump(
        document, sys.stdout, sort_keys=False, allow_unicode=True, width=4096
    )


if __name__ == "__main__":
    main()
