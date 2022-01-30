# My Resume

I prefer the [short](https://github.com/isnotahippy/jsonresume-theme-short) theme, but dates seem to be broken for the awards section and page breaks are less-than-deal. To work around this, I export to HTML and make the following edits directly to it:

1. Fix the dates in the Awards section (search for `id="awards"`).

2. I modify the CSS as follows:

	- Locate the `.item .startDate, .item .endDate {}` rule and prepend `.item .date` to that list.
	- Add the `break-inside: avoid;` property to the `.item {}` rule.
	- Add the `break-after: avoid;` property to the `section h2 {}` rule

Even with the CSS changes above, I find that I have to fiddle with the margins a little bit to make sure that no page breaks *actually* happen after headings (the goal is to keep the margins as close to 1" as possible).
