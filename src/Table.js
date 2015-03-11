
import builder from 'mongo-sql';
import Promise from 'bluebird';


export default class Table {
  constructor(connect, name, idField) {
    this.connect = connect;
    this.name = name;
    this.idField = idField;
  }
  
  
  find(query) {
    return this
      ._find({
        type: 'select',
        table: this.name,
        where: query
      })
      .then((x) => x.rows);
  }
  
  
  findOne(query) {
    return this
      ._find({
        type: 'select',
        table: this.name,
        where: this.queryOrId(query),
        limit: 1
      })
      .then((x) => x.rows[0] || null);
  }
  
  
  _find(query) {
    return Promise.using(this.connect(), function (client) {
        let sql = builder.sql(query);
        return client.queryAsync(sql.toString(), sql.values);
      });
  }
  
  
  insert(doc) {
    let sql = builder.sql({
      type: 'insert',
      table: this.name,
      values: doc
    });
    
    return Promise.using(this.connect(), function (client) {
      return client
        .queryAsync(sql.toString() + ' RETURNING *', sql.values)
        .then((x) => x.rows[0] || null);
    });
  }
  
  
  save(doc) {
    if (typeof doc[this.idField] === 'undefined')
      throw new Error(`the "${this.idField}" field should be set for save`);
    
    let q = {};
    q[this.idField] = doc[this.idField];
    delete doc[this.idField];
    
    let sql = builder.sql({
      type: 'update',
      table: this.name,
      where: q,
      updates: doc
    });
    
    return Promise.using(this.connect(), function (client) {
      return client
        .queryAsync(sql.toString() + ' RETURNING *', sql.values)
        .then((x) => x.rows[0] || null);
    });
  }
  
  
  update(query, doc) {
    let sql = builder.sql({
      type: 'update',
      table: this.name,
      where: this.queryOrId(query),
      updates: doc
    });
    
    return Promise.using(this.connect(), function (client) {
      return client.queryAsync(sql.toString() + ' RETURNING *', sql.values);
    });
  }
  
  
  remove(query) {
    let sql = builder.sql({
      type: 'delete',
      table: this.name,
      where: this.queryOrId(query)
    });
    
    return Promise.using(this.connect(), function (client) {
      return client
        .queryAsync(sql.toString(), sql.values)
        .then((x) => ({count: x.rowCount}));
    });
  }
  
  
  queryOrId(query) {
    if (typeof query !== 'object' && typeof query !== 'undefined') {
      let q = {};
      q[this.idField] = query;
      return q;
    } else {
      return query;
    }
  }
}