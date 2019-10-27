const puppeteer = require('puppeteer');

let browser, page;

beforeAll(async () => {
  browser = await puppeteer.launch();
});

beforeEach(async () => {
  page = await browser.newPage();
});

afterAll(async () => {
  await browser.close();
});

it('Test it', async () => {
  await expect(page).toMatchPuppeteerRequestMocks();

  await page.goto('http://localhost:3000/');

  await page.waitForXPath(`//*[contains(text(), "8base")]`);

  // Check something on the page
  expect(1).toEqual(1);

  await page.close();
});