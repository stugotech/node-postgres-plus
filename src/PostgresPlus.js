
import pg, {types} from 'pg';
import Promise from 'bluebird';
import builder from 'mongo-sql';

import Table from './Table';


export default class PostgresPlus {
  constructor(connectionString) {
    this.connectionString = connectionString;
  }
  
  table(name, options) {
    return new Table(this, name, options);
  }
  
  connect() {
    let connect = Promise.promisify(pg.connect, pg);
    let close;
    
    return connect(this.connectionString)
      .spread(function (client, done) {
        close = done;
        return Promise.promisifyAll(client);
      })
      .disposer(function (client) {
        if (close) close(client);
      });
  }
  
  query(query, values) {
    let sql;
    
    if (typeof query === 'object' && !(query instanceof String)) {
      let q = builder.sql(query);
      sql = q.toString();
      values = q.values;
    } else {
      sql = query;
    }
    
    return Promise.using(this.connect(), function (client) {
      return client.queryAsync(sql, values);
    });
  }
}

export {types};