const path = require('path');
const resolve = require('resolve');
require('babel-register')({
  /*
   * Setup require and ES6 import statements to resolve from our app's
   * root path, just like our webpack environment is configured to do.
   *
   * We need this here because getCashaySchema runs from cashay,
   * it's very own node and babel context.
   *
   */
  resolveModuleSource(source, filename) {
    return resolve.sync(source, {
      basedir: path.resolve(filename, '..'),
      extensions: ['.js'],
      moduleDirectory: [
        path.join(__dirname, '..', '..'),  // application root
        path.join(__dirname, '..', '..', '..', 'node_modules'),
      ]
    });
  }
});
require('babel-polyfill');
const {transformSchema} = require('cashay');
const graphql = require('graphql').graphql;
const rootSchema = require('../graphql/rootSchema');
const r = require('../database/rethinkDriver');

module.exports = () => transformSchema(rootSchema, graphql);
