# EPYSA scraper

Scrape [EPYSA Club Directory](https://www.epysa.org/clubs/club-directory/?Near=17602&Radius=100) search results to find contact information.

## Overview

Using Node and Puppeteer:

1. Build list of search results storing name and href to details page.
2. Navigate to details page and scrape table rows for basic info.
3. If a URL is listed, navigate to their website.
4. Try to find any links to an email address.
5. If there are none, try to find any links to a contact page, then try to find more email address links.
6. Print the results to a JSON file.

Finally, use `dasel` to convert to CSV file and clean up if necessary.

``` shell
$ yarn
$ node scrape.js
$ dasel -r json -w csv < epysa-contacts.json > epysa-contacts.csv
$ open epysa-contacts.csv
```
