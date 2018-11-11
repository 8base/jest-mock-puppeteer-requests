#!/bin/bash

status=0

(./bin/run.sh "jest-mock-puppeteer-requests" "test" "yarn test --verbose") || status=1
(./bin/run.sh "jest-mock-puppeteer-requests-graphql" "test" "yarn test --verbose") || status=1
exit $status