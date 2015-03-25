
import builder from 'mongo-sql';
import Promise from 'bluebird';
import changeCase from 'change-case';

import Cursor from './Cursor';

const acceptableCases = ['camel', 'pascal', 'snake', 'param', 'dot', 'constant', 'title'];

export default class Table {
  constructor(pg, name, options) {
    this.pg = pg;
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
  
  
  find(query) {
    return new Cursor(this, {
      type: 'select',
      table: this.name,
      where: this.convertCase(this.queryOrId(query))
    });
  }
  
  
  findOne(query) {
    return this
      .find(query)
      .limit(1)
      .then((x) => x[0] || null);
  }
  
  
  insert(doc) {
    let sql = builder.sql({
      type: 'insert',
      table: this.name,
      values: this.convertCase(doc)
    });
    
    let camelCase = this.camelCase.bind(this);
    
    return this.pg
      .query(sql.toString() + ' RETURNING *', sql.values)
      .then((x) => camelCase(x.rows[0] || null));
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
    
    return this.pg
      .query(sql.toString() + ' RETURNING *', sql.values)
      .then((x) => camelCase(x.rows[0] || null));
  }
  
  
  update(query, doc) {
    let sql = builder.sql({
      type: 'update',
      table: this.name,
      where: this.convertCase(this.queryOrId(query)),
      updates: this.convertCase(doc)
    });
    
    let camelCase = this.camelCase.bind(this);
    
    return this.pg
      .query(sql.toString() + ' RETURNING *', sql.values)
      .then((x) => x.rows.map(camelCase));
  }
  
  
  remove(query) {
    return this.pg.query({
        type: 'delete',
        table: this.name,
        where: this.convertCase(this.queryOrId(query))
      })
      .then((x) => ({count: x.rowCount}));
  }
  
  
  drop(cascade = false) {
    return this.pg.query({
      type: 'drop-table',
      table: this.name,
      ifExists: true,
      cascade
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
