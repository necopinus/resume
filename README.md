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

## Trimming rules

`filter.py` implements the same two-tier cutoffs as the old Handlebars theme,
relative to the current year (override with the `RECENT_YEARS` and
`PREVIOUS_YEARS` environment variables):

- **work** — positions that ended within the last 10 years (or are ongoing)
  are kept in full; positions that ended 10–15 years ago are collapsed into a
  single synthetic "Previous Employment" entry; anything older is dropped.
- **volunteer** — kept if ongoing or ended within the last 15 years, minus a
  small exclusion list (`EXCLUDED_VOLUNTEER_ORGS` in `filter.py`).
- **education** — post-secondary degrees are always kept; anything else only
  if it ended within the last 15 years.
- **awards** — kept if dated within the last 15 years.

To build the full, untrimmed resume instead:

```bash
yamlresume build resume.yaml
```

## Known validation warnings

`yamlresume validate resume.yaml` currently reports a handful of accepted
warnings: the basics summary and one work summary exceed the schema's
1024-character limit, and the pre-college / non-degree education entries lack
the required `degree` (no suitable enum value exists) and `area` fields. The
build succeeds regardless.

## References

- [YAMLResume documentation](https://yamlresume.dev/docs)
- [YAMLResume schema](https://yamlresume.dev/schema.json)
