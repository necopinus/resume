# My resume

`resume.yaml` is the full record, in [YAMLResume](https://yamlresume.dev/)
format. `resume.pdf` and `resume.html` are the trimmed ~2-page versions
generated from it.

## Requirements

- [yamlresume](https://yamlresume.dev/docs) and its PDF toolchain (run
  `yamlresume doctor` to check)
- [uv](https://docs.astral.sh/uv/) (provides PyYAML for `filter.py`; cached
  after the first run)

## Building

```bash
./build.sh
```

This trims `resume.yaml` down to size with `filter.py`, then runs a single
`yamlresume build`, which produces both outputs:

- `resume.pdf` — LaTeX engine, ModernCV Classic template
- `resume.html` — HTML engine, Calm template

Engine, template, section order and section titles all come from the
`layouts` key in `resume.yaml`, so that is the place to tweak them. If that
key is ever missing, yamlresume falls back to its own default layouts.

## Trimming rules

`filter.py` trims with a single end-date cutoff (`CUTOFF` in `filter.py`;
override with the `CUTOFF` environment variable, `YYYY-MM-DD`):

- **work** — positions that ended on or after the cutoff (or are ongoing)
  are kept in full; anything older is dropped.
- **volunteer** — same end-date rule as work.
- **education** — college degrees only (see `COLLEGE_DEGREES` in
  `filter.py`).
- **awards** — kept if dated on or after the cutoff.

The default cutoff (2014-01-01) keeps the core positions — The Public
Interest Network and Bureau Veritas — and was checked on 2026-10-14 to fit
two PDF pages. If you add content, run `./build.sh`, check the page count
with `pdfinfo resume.pdf`, and move the cutoff forward until the PDF is back
to two pages.

To build the full, untrimmed resume instead:

```bash
yamlresume build resume.yaml
```

## Validation

`yamlresume validate resume.yaml` passes cleanly as of 2026-10-14.

## References

- [YAMLResume documentation](https://yamlresume.dev/docs)
- [YAMLResume schema](https://yamlresume.dev/schema.json)
