import * as R from 'ramda';

export const getResponse = (state, request) => {
  let requestData = JSON.parse(request.postData());

  requestData = Array.isArray(requestData) ? requestData : [requestData];

  if (requestData.every(({ operationName }) => state.mocks[operationName])) {
    let response = requestData.map(req => {
      const index = ++state.counters[req.operationName] || (state.counters[req.operationName] = 0);

      const mock = R.path([req.operationName, index], state.mocks);

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
        request,
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
