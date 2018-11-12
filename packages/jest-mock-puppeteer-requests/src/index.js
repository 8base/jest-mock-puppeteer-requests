import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

import { kebabCase } from './utils';

const REQUEST_MOCKS_DIR = '__request_mocks__';

const configureToMatchPuppeteerRequestMocks = ({ shouldMockRequest, getResponse, saveMock }) =>
  async function(page) {
    const { testPath, currentTestName, snapshotState } = this;

    const requestMocksDir = path.join(path.dirname(testPath), REQUEST_MOCKS_DIR);
    const requestMocksFileName = kebabCase(`${path.basename(testPath)}-${currentTestName}-mock.json`);
    const requestMocksPath = path.join(requestMocksDir, requestMocksFileName);

    const mocks =
      snapshotState._updateSnapshot !== 'all' && fs.existsSync(requestMocksPath)
        ? JSON.parse(fs.readFileSync(requestMocksPath, 'utf8'))
        : {};

    let currentState = {
      mocks,
      counters: {},
    };

    await page.setRequestInterception(true);

    const handleRequest = request => {
      if (snapshotState._updateSnapshot !== 'all' && shouldMockRequest(request)) {
        const response = getResponse(currentState, request);

        if (response) {
          return request.respond(response);
        } else {
          console.warn(`Can't find mock response for request: ${request.postData()}`);
        }
      }

      request.continue();
    };

    const handleResponse = async response => {
      const request = await response.request();

      if (snapshotState._updateSnapshot === 'all' && shouldMockRequest(request)) {
        currentState = await saveMock(currentState, response);
      }
    };

    page.on('request', handleRequest);

    page.on('response', handleResponse);

    page.once('close', async () => {
      if (snapshotState._updateSnapshot === 'all') {
        mkdirp.sync(requestMocksDir);

        fs.writeFileSync(requestMocksPath, JSON.stringify(currentState.mocks, null, 2));
      }

      page.removeAllListeners('request');
      page.removeAllListeners('response');
    });

    return { pass: true };
  };

export { configureToMatchPuppeteerRequestMocks };
