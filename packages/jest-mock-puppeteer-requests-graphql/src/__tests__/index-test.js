const { configureToMatchPuppeteerRequestMocks } = require('jest-mock-puppeteer-requests');

const { getResponse, saveMock } = require('../');

jest.mock('fs');

const fs = jest.requireMock('fs');

let intialExpect = global.expect;

const API_ENDPOINT = 'https://api.8base.com';

const REQUEST_DATA = {
  operationName: 'QueryName',
  query: 'query { field }',
  variables: {
    value: 'b1b2b320-c017-4dcd-97ca-0e430f1cd047',
  },
};

const RESPONSE_DATA = {
  data: {
    field: 'foo',
  },
};

const SAVED_MOCK_DATA = {
  [REQUEST_DATA.operationName]: [
    {
      request: REQUEST_DATA,
      response: RESPONSE_DATA,
    },
  ],
};

const shouldMockRequest = request => {
  return request.method() === 'POST' && request.url().indexOf(API_ENDPOINT) !== -1;
};

let onResponse = null;
let onRequest = null;
let onClose = null;
let page = null;
let request = null;

beforeEach(() => {
  page = {
    setRequestInterception: jest.fn(),
    on: jest.fn((eventName, handler) => {
      if (eventName === 'response') {
        onResponse = handler;
      } else if (eventName === 'request') {
        onRequest = handler;
      }
    }),
    once: jest.fn((eventName, handler) => {
      if (eventName) {
        onClose = handler;
      }
    }),
    removeAllListeners: jest.fn(),
    close: jest.fn(),
  };

  request = {
    method: () => 'POST',
    url: () => API_ENDPOINT,
    postData: () => JSON.stringify(REQUEST_DATA),
    continue: jest.fn(),
    respond: jest.fn(),
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

it('As a developer, when I execute it in update mode, it should save real request to the mocks.', async () => {
  const toMatchPuppeteerRequestMocks = configureToMatchPuppeteerRequestMocks({
    shouldUpdateMocks: () => true,
    shouldMockRequest,
    getResponse,
    saveMock,
  }).bind({
    testPath: 'qwer',
    currentTestName: 'testName',
  });

  await toMatchPuppeteerRequestMocks(page);

  await onResponse({
    request: () => ({
      method: () => 'POST',
      url: () => API_ENDPOINT,
      postData: () => JSON.stringify(REQUEST_DATA),
    }),
    json: () => RESPONSE_DATA,
  });

  onClose();

  expect(fs.writeFileSync.mock.calls[0]).toMatchSnapshot();
});

it('As a developer, when I execute it in mock mode, it should replace real request via mocks.', async () => {
  fs.existsSync.mockReturnValueOnce(true);
  fs.readFileSync.mockReturnValueOnce(JSON.stringify(SAVED_MOCK_DATA));

  const toMatchPuppeteerRequestMocks = configureToMatchPuppeteerRequestMocks({
    shouldUpdateMocks: () => false,
    shouldMockRequest,
    getResponse,
    saveMock,
  }).bind({
    testPath: 'qwer',
    currentTestName: 'testName',
  });

  const toEqual = jest.fn();

  global.expect = jest.fn(() => ({
    toEqual,
  }));

  await toMatchPuppeteerRequestMocks(page);

  await onRequest(request);

  onClose();

  const expectCalls = global.expect;

  global.expect = intialExpect;

  expect(expectCalls.mock.calls).toMatchSnapshot();
  expect(toEqual.mock.calls).toMatchSnapshot();

  expect(request.continue).not.toHaveBeenCalled();
  expect(request.respond.mock.calls).toMatchSnapshot();
});

it('As a developer, when I execute it in mock mode, it should replace real request via mutated mocks.', async () => {
  fs.existsSync.mockReturnValueOnce(true);
  fs.readFileSync.mockReturnValueOnce(JSON.stringify(SAVED_MOCK_DATA));

  const toMatchPuppeteerRequestMocks = configureToMatchPuppeteerRequestMocks({
    shouldUpdateMocks: () => false,
    shouldMockRequest,
    getResponse,
    saveMock,
  }).bind({
    testPath: 'qwer',
    currentTestName: 'testName',
  });

  const toEqual = jest.fn();

  global.expect = jest.fn(() => ({
    toEqual,
  }));

  await toMatchPuppeteerRequestMocks(page, {
    [REQUEST_DATA.operationName]: {
      variables: {
        value: '<ANY_STRING>',
      },
    },
  });

  await onRequest(request);

  onClose();

  const expectCalls = global.expect;

  global.expect = intialExpect;

  expect(expectCalls.mock.calls).toMatchSnapshot();
  expect(toEqual.mock.calls).toMatchSnapshot();

  expect(request.continue).not.toHaveBeenCalled();
  expect(request.respond.mock.calls).toMatchSnapshot();
});
