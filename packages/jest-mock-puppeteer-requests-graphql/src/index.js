import * as R from 'ramda';

export const getResponse = (mocks, request) => {
  getResponse.counters = getResponse.counters || {};

  let requestData = JSON.parse(request.postData());

  requestData = Array.isArray(requestData) ? requestData : [requestData];

  if (requestData.every(({ operationName }) => mocks[operationName])) {
    let response = requestData.map(req => {
      const index = ++getResponse.counters[req.operationName] || (getResponse.counters[req.operationName] = 0);

      const mock = mocks[req.operationName][index];

      expect(R.omit(['index'], mock.request)).toEqual(req);

      return mock.response;
    });

    if (!Array.isArray(requestData)) {
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

export const saveMock = async (mocks, response) => {
  const request = await response.request();

  let requestData = JSON.parse(request.postData());

  requestData = Array.isArray(requestData) ? requestData : [requestData];

  requestData.forEach((request, i) => {
    const { operationName } = request;

    mocks[operationName] = mocks[operationName] || [];

    requestData[i].index = mocks[operationName].length;

    mocks[operationName] = mocks[operationName] = [
      ...mocks[operationName],
      {
        request,
      },
    ];
  });

  let responseData = await response.json();

  responseData = Array.isArray(responseData) ? responseData : [responseData];

  responseData.forEach((data, i) => {
    const { operationName, index } = requestData[i];

    mocks[operationName][index].response = data;
  });

  return mocks;
};
