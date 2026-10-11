#!/usr/bin/env bash
# Build the trimmed (~2 page) resume.pdf and resume.html from resume.yaml.
#
# resume.yaml is the full record. filter.py trims it down to recent history
# (see the docstring there for the rules), then a single `yamlresume build`
# produces both outputs:
#
#   resume.pdf   LaTeX engine, ModernCV Classic template
#   resume.html  HTML engine, Calm template
#
# Requirements:
#   - yamlresume (plus XeTeX; check with `yamlresume doctor`)
#   - uv (provides PyYAML for filter.py; cached after the first run)
set -euo pipefail
cd "$(dirname "$0")"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

uv run --with pyyaml python3 filter.py resume.yaml > "$tmp/resume.yml"

# Build inside the temp dir so LaTeX intermediate files (.aux/.log/...) never
# touch the repo.
(cd "$tmp" && yamlresume build resume.yml)

cp "$tmp/resume.pdf" "$tmp/resume.html" .
