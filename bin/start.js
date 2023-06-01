#!/usr/bin/env node

const args = require('yargs-parser')(process.argv.slice(2));

if(args.project) {
  require('..').startProject(args)
} else {
  require('..').start(args)
}