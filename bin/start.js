#!/usr/bin/env node

const args = require('yargs-parser')(process.argv.slice(2));


require('../src').start(args)