#!/bin/bash

set -e

PORT=${1}

newman run integration.json --env-var "PORT=${PORT}"
