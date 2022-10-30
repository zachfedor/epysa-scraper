const fs = require("fs");
const puppeteer = require("puppeteer");

const DIRECTORY_URL = "https://www.epysa.org/clubs/club-directory/?Near=17602&Radius=100";

// Selector for EPYSA Search Page List Item
const listSelector = "ol.location-list li.location-item";
// Selector for EPYSA Details Page Table Rows
const tableRowSelector = "div.location-info table tr";
// Selector for any mailto link
const mailtoSelector = 'a[href^="mailto:"]';
const anchorSelector = "a";

// Get mailto link's address
const getEmail = (link) => link.href.replace("mailto:", "");

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({});
  const page = await browser.newPage();

  console.log("Navigating to epysa.org...");
  await page.goto(DIRECTORY_URL);

  console.log("Waiting for list to load...");
  await page.waitForSelector(listSelector);

  // Build array of search results using anchor text and view more href, emails/error to be used later
  const list = await page.evaluate((listSelector) =>
    [...document.querySelectorAll(listSelector)].map((item) => ({
      name: item.querySelector("a.title")?.textContent,
      epysaUrl: item.querySelector("a.more")?.href,
      emails: [],
      error: "",
    })),
    listSelector);

  console.log(`==> found ${list.length} items\n`);

  // Iterate over each result
  for (let i = 0; i < list.length; i++) {
    const item = list[i];

    console.log("Navigating to details for:", item.name);
    await page.goto(item.epysaUrl);

    // Build array of table rows of Club Information
    // TODO: second table has 3 columns, not 2?
    await page.waitForSelector(tableRowSelector);
    const details = await page.evaluate((tableRowSelector) =>
      [...document.querySelectorAll(tableRowSelector)].map((row) => [
        row.querySelector("th")?.textContent.toLowerCase().replace(":", ""),
        row.querySelector("td")?.textContent,
      ]),
      tableRowSelector);

    // Flatten table rows into object using [key, value] tuple, then merge with original object
    list[i] = {
      ...list[i],
      ...Object.fromEntries(details),
    };

    // Navigate to organization's page and search for emails
    if (list[i].url) {
      try {
        console.log("Navigating to organization's website...");
        await page.goto(list[i].url);

        // Try to find any anchor tags with mailto href
        let emails = await page.evaluate((mailtoSelector) =>
          [...document.querySelectorAll(mailtoSelector)].map(getEmail),
          mailtoSelector);

        if (emails.length === 0) {
          try {
            console.log("Finding contact page...");

            // Try to find anchor to go to Contact page
            await page.evaluate((anchorSelector) => {
              const [contactLink] = [...document.querySelectorAll(anchorSelector)].filter((link) => link?.textContent.toLowerCase().includes("contact"));
              if (contactLink) {
                console.log("Navigating to contact page...");
                // Click the link
                contactLink.click();
              }
            },
              anchorSelector);

            // Wait for page load then try to find more emails
            await page.waitForNavigation();
            emails = await page.evaluate((mailtoSelector) =>
              [...document.querySelectorAll(mailtoSelector)].map(getEmail),
              mailtoSelector);
          } catch {
            console.log("==> Couldn't find contact page");
            list[i].error = "Organization doesn't have emails listed on Contact page";
          }
        }

        list[i].emails = emails;
      } catch {
        list[i].error = "Organization website is unresponsive";
      }
    }

    console.log(list[i]);
  }

  // Write the complete list of result objects to a file
  const filename = "epysa-contacts.json";
  try {
    fs.writeFileSync(filename, JSON.stringify(list, null, 2));
    console.log("Data written to disk:", filename);
  } catch {
    console.error("Couldn't write list to disk!");
  }

  await browser.close();
})();
