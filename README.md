pg-plus
=======

This library wraps the [node-postgres](https://github.com/brianc/node-postgres) library to provide some nice things:
 * promise support
 * mongoDB-like interface
 * case changing (i.e., can be set to automatically convert column names like `my_column` to JavaScript names like `myColumn`)
 * automatic resource clear up (uses Bluebird's [`disposer` method](https://github.com/petkaantonov/bluebird/blob/master/API.md#disposerfunction-disposer---disposer) behind the scenes)
 


Install
-------

    $ npm install pg-plus


Examples
--------

This is a rough and ready demonstration until I have time to write more full documentation.  Please also check out the [test.js](test/test.js) for examples.

```javascript
// require the lib
// (I use ES6, hence the extra .default part)
var PostgresPlus = require('pg-plus').default;

// set it up with some connection string (e.g. postgres://postgres@localhost/test)
var pg = new PostgresPlus(myConnectionString);

// get a table (default primary key is 'id')
var table1 = pg.table('table1');

// get a table using '_id' as the primary key
var table2 = pg.table('table2', '_id');

// get a table using '_id' as the primary key, and converting column names
// from snake case
var table3 = pg.table('table3', {id: '_id', case: 'snake'});

// get some rows
// refer to MongoDB docs for query syntax, most basic stuff should work
test.find({column: 'value', number: {$lt: 1}}).then(function (rows) {
  console.log(rows);
});

// get a single row
test.findOne({id: 5}).then(function (row) {
  console.log(row);
});

// since we were using the primary key, there is a shorthand for the above
test.findOne(5).then(function (row) {
  console.log(row);
});
```