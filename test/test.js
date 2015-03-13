
import {expect} from 'chai';
import pg from 'pg';
import Promise from 'bluebird';

import PostgresPlus, {types} from '../src/PostgresPlus';

Promise.longStackTraces();
Promise.promisifyAll(pg);
var cs = 'postgres://postgres:postgres@localhost/postgres';


describe('PostgresPlus', function () {
  var pgp;
  var test;
  var test2;
  
  beforeEach(async function () {
    let [client, done] = await pg.connectAsync(cs);
    client = Promise.promisifyAll(client);
    
    await client.queryAsync("DROP TABLE IF EXISTS test");
    await client.queryAsync("CREATE TABLE test (id SERIAL, a varchar, b varchar)");
    await client.queryAsync("INSERT INTO test (a, b) VALUES ('1', '2')");
    await client.queryAsync("INSERT INTO test (a, b) VALUES ('2', '4')");
    await client.queryAsync("INSERT INTO test (a, b) VALUES ('3', '6')");
    await client.queryAsync("INSERT INTO test (a, b) VALUES ('4', '8')");
    await client.queryAsync("INSERT INTO test (a, b) VALUES ('5', '10')");
    
    await client.queryAsync("DROP TABLE IF EXISTS test2");
    await client.queryAsync("CREATE TABLE test2 (id SERIAL, field_a varchar, field_b varchar)");
    await client.queryAsync("INSERT INTO test2 (field_a, field_b) VALUES ('1', '2')");
    
    done(client);
    
    pgp = new PostgresPlus(cs);
    test = pgp.table('test');
    test2 = pgp.table('test2', {case: 'snake'});
  });
  
  afterEach(async function () {
    let [client, done] = await pg.connectAsync(cs);
    client = Promise.promisifyAll(client);
    
    await client.queryAsync('DROP TABLE test');
    done(client);
  });
  
  it('should export pg-types', function () {
    expect(types).to.exist;
    expect(types.setTypeParser).to.exist;
  });
  
  describe('Table', function () {
    describe('find', function () {
      it('should return all with no arguments', async function () {
        let rows = await test.find();
        expect(rows).to.have.length(5);
      });
      
      it('should convert case of query and results if necessary', async function () {
        let rows = await test2.find({fieldA: '1'});
        expect(rows).to.have.length(1);
        expect(rows[0].fieldA).to.equal('1');
        expect(rows[0].field_a).to.not.exist;
        expect(rows[0].fieldB).to.equal('2');
        expect(rows[0].field_b).to.not.exist;
      });
    });

    
    describe('findOne', function () {
      it('should return one with no arguments', async function () {
        let result = await test.findOne();
        expect(result).to.exist;
        expect(result.a).to.equal('1');
        expect(result.b).to.equal('2');
      });

      it('should return matching doc with a query', async function () {
        let result = await test.findOne({id: 3});
        expect(result).to.exist;
        expect(result.a).to.equal('3');
        expect(result.b).to.equal('6');
      });

      it('should return null if there is no matching doc', async function () {
        let result = await test.findOne({id: 100});
        expect(result).to.be.null;
      });
      
      it('should do a query on the \'id\' field by default with a non-object argument', async function () {
        let result = await test.findOne(1);
        expect(result).to.exist;
        expect(result.a).to.equal('1');
        expect(result.b).to.equal('2');
      });
      
      it('should use the table ID field if specified', async function () {
        let test2 = pgp.table('test', 'b');
        let result = await test2.findOne(6);
        expect(result).to.exist;
        expect(result.a).to.equal('3');
        expect(result.b).to.equal('6');
      });
      
      it('should convert case of query and result if necessary', async function () {
        let result = await test2.findOne({fieldA: '1'});
        expect(result).to.exist;
        expect(result.fieldA).to.equal('1');
        expect(result.field_a).to.not.exist;
        expect(result.fieldB).to.equal('2');
        expect(result.field_b).to.not.exist;
      });
    });
    
    
    describe('insert', function () {
      it('should insert the row', async function () {
        await test.insert({a: '6', b: '12'});
        
        let result = await test.findOne(6);
        expect(result).to.exist;
        expect(result.a).to.equal('6');
        expect(result.b).to.equal('12');
      });
      
      it('should return the inserted row', async function () {
        let result = await test.insert({a: '6', b: '12'});
        expect(result).to.exist;
        expect(result.id).to.equal(6);
        expect(result.a).to.equal('6');
        expect(result.b).to.equal('12');
      });
      
      it('should convert the case if necessary', async function () {
        // i.e. this shouldn't fall over
        await test2.insert({fieldA: '6', fieldB: '12'});
      });
    });
    
    
    describe('save', function () {
      it('should update the row', async function () {
        await test.save({id: 1, a: '6', b: '12'});
        
        let result = await test.findOne(1);
        expect(result).to.exist;
        expect(result.a).to.equal('6');
        expect(result.b).to.equal('12');
      });
      
      it('should return the updated row', async function () {
        let result = await test.save({id: 1, a: '6'});
        expect(result).to.exist;
        expect(result.id).to.equal(1);
        expect(result.a).to.equal('6');
        expect(result.b).to.equal('2');
      });
      
      it('should convert the case if necessary', async function () {
        let result = await test2.save({id: 1, fieldA: '6'});
        expect(result).to.exist;
        expect(result.id).to.equal(1);
        expect(result.fieldA).to.equal('6');
        expect(result.fieldB).to.equal('2');
      });
    });
    
    
    describe('update', function () {
      it('should update the row', async function () {
        await test.update({id: 1}, {a: '6', b: '12'});
        
        let result = await test.findOne(1);
        expect(result).to.exist;
        expect(result.a).to.equal('6');
        expect(result.b).to.equal('12');
      });
      
      it('should allow the query to be just an ID', async function () {
        await test.update(1, {a: '6', b: '12'});
        
        let result = await test.findOne(1);
        expect(result).to.exist;
        expect(result.a).to.equal('6');
        expect(result.b).to.equal('12');
      });
      
      it('should convert the case if necessary', async function () {
        await test2.update({id: 1}, {fieldA: '6', fieldB: '12'});
        
        let result = await test2.findOne(1);
        expect(result).to.exist;
        expect(result.fieldA).to.equal('6');
        expect(result.fieldB).to.equal('12');
      });
    });
    
    
    describe('remove', function () {
      it('should delete the row', async function () {
        let result = await test.remove({id: 1});
        expect(result.count).to.equal(1);
        expect(await test.findOne(1)).to.not.exist;
      });
      
      it('should allow the query to be just an ID', async function () {
        await test.remove(1);
        
        let result = await test.findOne(1);
        expect(result).to.not.exist;
      });
      
      it('should convert the case if necessary', async function () {
        let result = await test2.remove({fieldA: '1'});
        expect(result.count).to.equal(1);
        expect(await test2.findOne(1)).to.not.exist;
      });
    });
  });
});