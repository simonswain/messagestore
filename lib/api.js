"use strict";

var _ = require('underscore');
var async = require('async');
var uuid = require('node-uuid');
var validate = require('./validate.js');

module.exports = function(config){

  var db = require('./db.js')(config);

  var api = {};

  /**
   * initialise the database
   */
  api.reset = function(next){

    var fs = require('fs');

    var schema = fs.readFileSync (
      __dirname + '/../db/schema.sql',
      'ascii'
    );

    schema = schema.trim();
    schema = schema.split(';');
    schema = _.reduce(
      schema,
      function(memo, sql){
        sql = sql.trim();
        if(sql !== ''){
          memo.push(sql);
        }
        return memo;
      }, []);

    async.eachSeries(
      schema,
      db.query,
      function(err){
        next();
      });

  };

  api.quit = function(done){
    db.close();
    if(done){
      done();
    }
  };


  /**
   * delete all data from the database
   */
  api.purge = function(next){

    var msgs = function(done){
      var sql;
      sql = "DELETE FROM msg";
      db.query(
        sql,
        function(err){
          done(err);
        });
    };

    var streams = function(done){
      var sql;
      sql = "DELETE FROM stream";
      db.query(
        sql,
        function(err){
          done(err);
        });
    };

    async.series([msgs, streams], next);

  };


  /**
   * get some basic stats
   */
  api.stats = function(next){

    var sql;
    sql = "SELECT ";
    sql += " (SELECT COUNT(*) FROM stream) AS streams, ";
    sql += " (SELECT COUNT(*) FROM msg) AS messages ";

    db.queryOne(
      sql,
      function(err, res){
        res.streams = Number(res.streams);
        res.messages = Number(res.messages);
        next(err, res);
      }
    );

  };


  /**
   * count how many streams
   */
  api.countStreams = function(next) {

    var sql;

    sql = "SELECT COUNT(*) AS count";
    sql += " FROM stream ";

    db.queryOne(
      sql,
      function(err, rows){
        next(err, Number(rows.count));
      });

  };

  /**
   * all streams
   */
  api.getStreams = function(opts, next) {

    if(typeof opts === 'function'){
      next = opts;
      opts = {};
    }

    var sql;
    var args;

    args = [];

    sql = "SELECT *";
    sql += " FROM stream ";

    if (opts.hasOwnProperty('base')){
      opts.base = Number(opts.base);
    }

    if (!opts.hasOwnProperty('base') || !opts.base || !_.isNumber(opts.base)) {
      opts.base = 0;
    }

    if (opts.hasOwnProperty('limit')){
      opts.limit = Number(opts.limit);
    }

    if (!opts.hasOwnProperty('limit') || !opts.limit || !_.isNumber(opts.limit)) {
      opts.limit = 100;
    }

    sql += " ORDER BY id";
    sql += " OFFSET $1 LIMIT $2 ";

    db.query(
      sql,
      [opts.base, opts.limit],
      function(err, rows){
        next(err, rows);
      });

  };


  /**
   * find a set of messages from as stream
   */
  api.getMessages = function(stream_id, opts, next) {

    if(typeof opts === 'function'){
      next = opts;
      opts = {};
    }

    if (opts.hasOwnProperty('base')){
      opts.base = Number(opts.base);
    }

    if (!opts.hasOwnProperty('base') || !opts.base || !_.isNumber(opts.base)){
      opts.base = 0;
    }

    if (opts.hasOwnProperty('limit')){
      opts.limit = Number(opts.limit);
    }

    if (!opts.hasOwnProperty('limit') || !opts.limit || !_.isNumber(opts.limit)) {
      opts.limit = 100;
    }

    opts.order = 1;

    // default sort by most recent
    if (!opts.hasOwnProperty('sort') || typeof opts.sort !== 'undefined') {
      opts.sort = 'at';
      opts.order = -1;
    }
    
    if (opts.sort && opts.sort.substr(0,1) === '-') {
      opts.order = -1;
      opts.sort = opts.sort.substr(1);
    }

    var sql;

    sql = "SELECT id, at, data";
    sql += " FROM msg ";
    sql += " WHERE stream_id=$1";

    sql += " ORDER BY $2";
    if(opts.order === -1){
      sql += " DESC";
    }

    sql += " OFFSET $3";
    sql += " LIMIT $4";

    db.query(
      sql,
      [stream_id, opts.sort, opts.base, opts.limit],
      function(err, rows){
        next(err, rows);
      });

  };


  /**
   * count how many messages in stream?
   */
  api.countMessages = function(stream_id, next) {

    var sql;

    sql = "SELECT COUNT(*) AS count";
    sql += " FROM msg ";
    sql += " WHERE stream_id=$1";

    db.queryOne(
      sql,
      [stream_id],
      function(err, rows){
        next(err, Number(rows.count));
      });

  };


  /**
   * get a stream's metadata by id
   */
  api.getStream = function(stream_id, next){

    var sql;

    sql = "SELECT * ";
    sql += " FROM stream ";
    sql += " WHERE id = $1";

    db.queryOne(
      sql,
      [stream_id],
      next
    );

  };


  /**
   * create an empty stream
   */
  api.addStream = function(stream, next) {

    // stream = {attrs: {}}

    if(!stream.hasOwnProperty('id')){
      stream.id = uuid.v4();
    }

    if(!stream.hasOwnProperty('attrs')){
      stream.attrs = {};
    }

    if(!stream.hasOwnProperty('attrs')){
      stream.attrs = {};
    }

    var sql;
    sql = "INSERT INTO stream";
    sql += " (id, attrs) ";
    sql += " VALUES ";
    sql += " ($1, $2) ";

    db.queryOne(
      sql,
      [stream.id, stream.attrs],
      function(err, row){
        next(null, stream);
      });
  };


  /**
   * set a stream's attrs
   */
  api.setStream = function(stream_id, attrs, next) {

    if (typeof attrs !== 'object') {
      return next(new Error('invalid attrs'));
    }

    var sql;
    sql = "UPDATE stream SET ";
    sql += " attrs = $2 ";
    sql += " WHERE id = $1";

    db.query(
      sql,
      [stream_id, attrs],
      function(err){
        api.getStream(stream_id, next);
      });

  };



  /**
   * get a single message by id
   */
  api.getMessage = function(stream_id, msg_id, next){

    if(!validate.uuid(msg_id)){
      return next(new Error('invalid msg_id'));
    }

    var sql;

    sql = "SELECT id, at, data ";
    sql += " FROM msg ";
    sql += " WHERE id = $1";
    sql += " AND stream_id = $2";
    db.queryOne(
      sql,
      [msg_id, stream_id],
      next
    );

  };


  /**
   * create an empty stream
   */
  api.addMessage = function(stream_id, msg, next) {

    // stream = {attrs: {}}

    if(typeof msg !== 'object'){
      return next(new Error('invalid msg'));
    }

    if(!msg.hasOwnProperty('data')){
      return next(new Error('invalid data'));
    }

    if(typeof msg.data !== 'object'){
      return next(new Error('invalid data'));
    }

    if(!msg.hasOwnProperty('at')){
      msg.at = new Date();
    }

    var sql;
    sql = "INSERT INTO msg";
    sql += " (stream_id, at, data) ";
    sql += " VALUES ";
    sql += " ($1, $2, $3) ";
    sql += " RETURNING id;";

    db.queryOne(
      sql,
      [stream_id, msg.at, msg.data],
      function(err, row){
        msg.id = row.id;
        next(null, msg);
      });
  };


  /**
   * get a single message by id
   */
  api.delMessage = function(stream_id, msg_id, next){

    if(!validate.uuid(msg_id)){
      return next(new Error('invalid msg_id'));
    }

    var sql;

    sql = "DELETE FROM msg ";
    sql += " WHERE stream_id = $1";
    sql += " AND id = $2";

    db.queryOne(
      sql,
      [stream_id, msg_id],
      next
    );

  };


  /**
   * delete an stream by id
   */
  api.delStream = function(stream_id, next) {

    var delMessages = function(done){
      var sql;
      sql = "DELETE ";
      sql += " FROM msg ";
      sql += " WHERE stream_id = $1";

      db.query(
        sql,
        [stream_id],
        function(err){
          done(err);
        });

    };

    var delStream = function(done){
      var sql;
      sql = "DELETE ";
      sql += " FROM stream ";
      sql += " WHERE id = $1";

      db.query(
        sql,
        [stream_id],
        function(err){
          done(err);
        });
    };

    async.series([
      delMessages,
      delStream
    ], function(){
      next();
    });

  };


  // export the api methods
  return api;

};
