import { configureToMatchPuppeteerRequestMocks } from '../';

jest.mock('fs');

const fs = jest.requireMock('fs');

const API_ENDPOINT = 'https://api.8base.com';

const REQUEST_DATA = {
  operationName: 'QueryName',
  query: 'query { field }',
};

const RESPONSE_DATA = {
  data: {
    field: 'foo',
  },
};

const SAVED_MOCK_DATA = {
  [REQUEST_DATA.operationName]: [
    {
      request: {
        ...REQUEST_DATA,
        index: 0,
      },
      response: RESPONSE_DATA,
    },
  ],
};

const shouldMockRequest = request => {
  return request.method() === 'POST' && request.url().indexOf(API_ENDPOINT) !== -1;
};

const getResponse = jest.fn(() => RESPONSE_DATA);

const saveMock = jest.fn(() => ({
  mocks: SAVED_MOCK_DATA,
  counters: {},
}));

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
  };

  request = {
    method: () => 'POST',
    url: () => API_ENDPOINT,
    postData: () =>
      JSON.stringify({
        operationName: 'QueryName',
        query: 'query { field }',
      }),
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

  expect(fs.writeFileSync.mock.calls).toMatchSnapshot();
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

  await toMatchPuppeteerRequestMocks(page);

  await onRequest(request);

  onClose();

  expect(request.continue).not.toHaveBeenCalled();
  expect(request.respond.mock.calls).toMatchSnapshot();
});
