import * as R from 'ramda';
import isPlainObject from 'is-plain-object';

const PROPERTY_MATCHERS = {
  '<ANY_NUMBER>': expect.any(Number),
  '<ANY_STRING>': expect.any(String),
};

const replacePropertyMatchers = R.mapObjIndexed(value => {
  if (R.has(value, PROPERTY_MATCHERS)) {
    value = PROPERTY_MATCHERS[value];
  } else if (isPlainObject(value)) {
    value = replacePropertyMatchers(value);
  }

  return value;
});

export const getResponse = (state, request) => {
  let requestData = JSON.parse(request.postData());

  const isBatchedRequest = Array.isArray(requestData);

  requestData = Array.isArray(requestData) ? requestData : [requestData];

  if (requestData.every(({ operationName }) => state.mocks[operationName])) {
    let response = requestData.map(req => {
      const index = ++state.counters[req.operationName] || (state.counters[req.operationName] = 0);

      const mock = R.path([req.operationName, index], state.mocks);

      if (!mock) {
        return null;
      }

      expect(req).toEqual(replacePropertyMatchers(mock.request));

      return mock.response;
    });

    if (!isBatchedRequest) {
      response = response[0];
    }

    return {
      content: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  }
};

export const saveMock = async (state, response) => {
  const request = await response.request();

  let requestData = JSON.parse(request.postData());

  requestData = Array.isArray(requestData) ? requestData : [requestData];

  requestData.forEach((request, i) => {
    const { operationName } = request;

    state.mocks[operationName] = state.mocks[operationName] || [];

    requestData[i].index = state.mocks[operationName].length;

    state.mocks[operationName] = state.mocks[operationName] = [
      ...state.mocks[operationName],
      {
        request: R.omit(['index'], request),
      },
    ];
  });

  let responseData = await response.json();

  responseData = Array.isArray(responseData) ? responseData : [responseData];

  responseData.forEach((data, i) => {
    const { operationName, index } = requestData[i];

    state.mocks[operationName][index].response = data;
  });

  return state;
};
