#!/usr/bin/env node

const args = require('yargs-parser')(process.argv.slice(2));

require('..').start(args)