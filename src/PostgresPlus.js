
import pg, {types} from 'pg';
import Promise from 'bluebird';

import Table from './Table';


export default class PostgresPlus {
  constructor(connectionString) {
    this.connectionString = connectionString;
  }
  
  table(name, options) {
    return new Table(this.connect.bind(this), name, options);
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
}

export {types};