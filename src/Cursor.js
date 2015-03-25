

export default class Cursor {
  constructor(table, query) {
    this.table = table;
    this.query = query;
    
    // set up aliases
    this.take = this.limit;
    this.join = this._join.bind(this, 'inner');
    this.innerJoin = this.join;
    this.leftJoin = this._join.bind(this, 'left');
    this.rightJoin = this._join.bind(this, 'right');
  }
  
  
  toArray() {
    let camelCase = this.table.camelCase.bind(this.table);
    
    return this.table.pg
      .query(this.query)
      .then((x) => x.rows.map(camelCase));
  }
  
  
  then(resolve, reject) {
    return this.toArray().then(resolve, reject);
  }
  
  
  distinct(columns) {
    if (typeof columns === 'undefined') {
      this.query.distinct = true;
    } else {
      this.query.distinct = columns;
    }
    
    return this;
  }
  
  
  skip(n) {
    this.query.offset = n;
    return this;
  }
  
  
  limit(n) {
    this.query.limit = n;
    return this;
  }
  
  
  sort(spec) {
    for (let k in spec) {
      spec[k] = spec[k] < 0 ? 'desc' : 'asc';
    }
    
    this.query.order = spec;
    return this;
  }
  
  project(spec) {
    let columns = [];
    
    for (let k in spec) {
      if (spec[k] === true || spec[k] === 1) {
        columns.push(k);
      } else if (typeof spec[k] === 'string') {
        columns.push({alias: k, name: spec[k]})
      } else {
        columns.push({alias: k, name: spec[k].name, table: spec[k].table});
      }
    }
    
    this.query.columns = columns;
    return this;
  }
  
  
  _join(type, table, on, alias) {
    if (!this.query.joins) {
      this.query.joins = {};
    }
    
    this.query.joins[table] = {
      type, alias, on
    };
    
    if (!this.query.columns) {
      this.query.columns = ['*']; 
    }
    
    this.query.columns.push({table, name: '*'});
    return this;
  }
}