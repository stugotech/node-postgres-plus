
import builder from 'mongo-sql';
import Promise from 'bluebird';
import changeCase from 'change-case';

const acceptableCases = ['camel', 'pascal', 'snake', 'param', 'dot', 'constant', 'title'];

export default class Table {
  constructor(connect, name, options) {
    this.connect = connect;
    this.name = name;
    
    if (typeof options === 'object') {
      this.idField = options.id || 'id';
      
      if (options.case) {
        if (acceptableCases.indexOf(options.case) === -1)
          throw new Error('options.case must be one of ' + acceptableCases);
        
        this.changeCase = changeCase[options.case + 'Case'];
      }
    } else if (typeof options === 'undefined') {
      this.idField = 'id';
    } else {
      this.idField = options;
    }
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
  
  
  find(query) {
    let camelCase = this.camelCase.bind(this);
    
    return this
      .query({
        type: 'select',
        table: this.name,
        where: this.convertCase(query)
      })
      .then((x) => x.rows.map(camelCase));
  }
  
  
  findOne(query) {
    let camelCase = this.camelCase.bind(this);
    
    return this
      .query({
        type: 'select',
        table: this.name,
        where: this.convertCase(this.queryOrId(query)),
        limit: 1
      })
      .then((x) => camelCase(x.rows[0] || null));
  }
  
  
  insert(doc) {
    let sql = builder.sql({
      type: 'insert',
      table: this.name,
      values: this.convertCase(doc)
    });
    
    let camelCase = this.camelCase.bind(this);
    
    return Promise.using(this.connect(), function (client) {
      return client
        .queryAsync(sql.toString() + ' RETURNING *', sql.values)
        .then((x) => camelCase(x.rows[0] || null));
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
      where: this.convertCase(q),
      updates: this.convertCase(doc)
    });
    
    let camelCase = this.camelCase.bind(this);
    
    return Promise.using(this.connect(), function (client) {
      return client
        .queryAsync(sql.toString() + ' RETURNING *', sql.values)
        .then((x) => camelCase(x.rows[0] || null));
    });
  }
  
  
  update(query, doc) {
    let sql = builder.sql({
      type: 'update',
      table: this.name,
      where: this.convertCase(this.queryOrId(query)),
      updates: this.convertCase(doc)
    });
    
    let camelCase = this.camelCase.bind(this);
    
    return Promise.using(this.connect(), function (client) {
      return client.queryAsync(sql.toString() + ' RETURNING *', sql.values)
        .then((x) => x.rows.map(camelCase));
    });
  }
  
  
  remove(query) {
    return this.query({
        type: 'delete',
        table: this.name,
        where: this.convertCase(this.queryOrId(query))
      })
      .then((x) => ({count: x.rowCount}));
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
  
  convertCase(obj) {
    if (this.changeCase && obj !== null && typeof obj !== 'undefined') {
      for (let k in obj) {
        if (obj.hasOwnProperty(k) && k[0] !== '$') {
          let val = obj[k];
          delete obj[k];
          obj[this.changeCase(k)] = val;
        }
      }
    }
    
    return obj;
  }
  
  camelCase(obj) {
    if (this.changeCase && obj !== null && typeof obj !== 'undefined') {
      for (let k in obj) {
        if (obj.hasOwnProperty(k) && k[0] !== '$') {
          let val = obj[k];
          delete obj[k];
          obj[changeCase.camelCase(k)] = val;
        }
      }
    }
    
    return obj;
  }
}
