const { configureToMatchPuppeteerRequestMocks } = require('jest-mock-puppeteer-requests');
const { getResponse, saveMock } = require('jest-mock-puppeteer-requests-graphql');

const shouldMockRequest = (request) => (
  request.method() === 'POST'
  &&
  request.url().indexOf(process.env.REACT_APP_SERVER_URL) !== -1
);

const toMatchPuppeteerRequestMocks = configureToMatchPuppeteerRequestMocks({
  shouldUpdateMocks: () => process.env.E2E_UPDATE_REQUEST_MOCKS === 'true',
  shouldMockRequest,
  getResponse,
  saveMock,
});

console.log(process.env);

expect.extend({ toMatchPuppeteerRequestMocks });