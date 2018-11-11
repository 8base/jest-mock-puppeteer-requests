#!/bin/bash

status=0

(./bin/try-publish.sh "jest-mock-puppeteer-requests") || status=1
(./bin/try-publish.sh "jest-mock-puppeteer-requests-graphql") || status=1

exit $status