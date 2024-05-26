# My Resume

To build:

1. Generate HTML using `yarn run resumed render --theme jsonresume-theme-local`.

2. Open the HTML file up in Chrome and print it there. Adjust the margins to match the HTML text width and provide sane page breaks (0.7" top/bottom and 0.5" left/right seems to work well).

## Unused Sections

Currently unused sections (example data taken from the [JSON Resume sample file](https://github.com/jsonresume/resume-schema/blob/master/sample.resume.json)):

```json
{
  "basics": {
    "phone": "(123) 456-7890"
  },
  "publications": [
    {
      "name": "Video compression for 3d media",
      "publisher": "Hooli",
      "releaseDate": "2014-10-01",
      "url": "http://en.wikipedia.org/wiki/Silicon_Valley_(TV_series)",
      "summary": "Innovative middle-out compression algorithm that changes the way we store data."
    }
  ],
  "languages": [
    {
      "language": "English",
      "fluency": "Native speaker"
    }
  ],
  "interests": [
    {
      "name": "Wildlife",
      "keywords": [
        "Ferrets",
        "Unicorns"
      ]
    }
  ],
  "references": [
    {
      "name": "Erlich Bachman",
      "reference": "It is my pleasure to recommend Richard, his performance working as a consultant for Main St. Company proved that he will be a valuable addition to any company."
    }
  ],
  "projects": [
    {
      "name": "Miss Direction",
      "description": "A mapping engine that misguides you",
      "highlights": [
        "Won award at AIHacks 2016",
        "Built by all women team of newbie programmers",
        "Using modern technologies such as GoogleMaps, Chrome Extension and Javascript"
      ],
      "keywords": [
        "GoogleMaps", "Chrome Extension", "Javascript"
      ],
      "startDate": "2016-08-24",
      "endDate": "2016-08-24",
      "url": "missdirection.example.com",
      "roles": [
        "Team lead", "Designer"
      ],
      "entity": "Smoogle",
      "type": "application"
    }
  ]
}
```

## References

- [JSON Resume Schema](https://github.com/jsonresume/resume-schema)
