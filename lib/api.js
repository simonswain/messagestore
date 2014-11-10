"use strict";

var _ = require('underscore');
var async = require('async');
var uuid = require('node-uuid');
var validate = require('./validate.js');

module.exports = function(config){

  var db = require('./db.js')(config);

  var api = {};

  api.version = {
    'messagestore': '0.0.2'
  };

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

    var boxes = function(done){
      var sql;
      sql = "DELETE FROM box";
      db.query(
        sql,
        function(err){
          done(err);
        });
    };

    async.series([msgs, boxes], next);

  };


  /**
   * get some basic stats
   */
  api.stats = function(next){

    var sql;
    sql = "SELECT ";
    sql += " (SELECT COUNT(*) FROM box) AS boxes, ";
    sql += " (SELECT COUNT(*) FROM msg) AS messages ";

    db.queryOne(
      sql,
      function(err, res){
        res.boxes = Number(res.boxes);
        res.messages = Number(res.messages);
        next(err, res);
      }
    );

  };


  /**
   * count how many boxes
   */
  api.countBoxes = function(next) {

    var sql;

    sql = "SELECT COUNT(*) AS count";
    sql += " FROM box ";

    db.queryOne(
      sql,
      function(err, rows){
        next(err, Number(rows.count));
      });

  };

  /**
   * all boxes
   */
  api.getBoxes = function(opts, next) {

    if(typeof opts === 'function'){
      next = opts;
      opts = {};
    }

    var sql;
    var args;

    args = [];

    sql = "SELECT *";
    sql += " FROM box ";

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
   * find a set of messages from as box
   */
  api.getMessages = function(box_id, opts, next) {

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
    sql += " WHERE box_id=$1";

    sql += " ORDER BY $2";
    if(opts.order === -1){
      sql += " DESC";
    }

    sql += " OFFSET $3";
    sql += " LIMIT $4";

    db.query(
      sql,
      [box_id, opts.sort, opts.base, opts.limit],
      function(err, rows){
        var messages = _.map(rows, function(x){
          var row = x.data;
          row.id = x.id;
          row.at = new Date(x.at).getTime();
          return row;
        });
        next(err, messages);
      });

  };


  /**
   * count how many messages in box?
   */
  api.countMessages = function(box_id, next) {

    var sql;

    sql = "SELECT COUNT(*) AS count";
    sql += " FROM msg ";
    sql += " WHERE box_id=$1";

    db.queryOne(
      sql,
      [box_id],
      function(err, rows){
        next(err, Number(rows.count));
      });

  };


  /**
   * get a box's metadata by id
   */
  api.getBox = function(box_id, next){

    var sql;

    sql = "SELECT * ";
    sql += " FROM box ";
    sql += " WHERE id = $1";

    db.queryOne(
      sql,
      [box_id],
      next
    );

  };


  /**
   * create an empty box
   */
  api.addBox = function(box, next) {

    // box = {attrs: {}}
    
    if(!box.hasOwnProperty('id')){
      box.id = uuid.v4();
    }

    if(!box.hasOwnProperty('attrs')){
      box.attrs = {};
    }

    var sql;
    sql = "INSERT INTO box";
    sql += " (id, attrs) ";
    sql += " VALUES ";
    sql += " ($1, $2) ";

    db.queryOne(
      sql,
      [box.id, box.attrs],
      function(err, row){
        next(null, box);
      });
  };


  /**
   * set a box's attrs
   */
  api.setBox = function(box_id, attrs, next) {

    if (typeof attrs !== 'object') {
      return next(new Error('invalid attrs'));
    }

    var sql;
    sql = "UPDATE box SET ";
    sql += " attrs = $2 ";
    sql += " WHERE id = $1";

    db.query(
      sql,
      [box_id, attrs],
      function(err){
        api.getBox(box_id, next);
      });

  };



  /**
   * get a single message by id
   */
  api.getMessage = function(box_id, msg_id, next){

    if(!validate.uuid(msg_id)){
      return next(new Error('invalid msg_id'));
    }

    var sql;

    sql = "SELECT id, at, data ";
    sql += " FROM msg ";
    sql += " WHERE id = $1";
    sql += " AND box_id = $2";
    db.queryOne(
      sql,
      [msg_id, box_id],
      function(err, row){
        if(!row){
          return next(null, false);
        }
        var data = row.data;
        data.id = row.id;
        data.at = new Date(row.at).getTime();
        next(err, data);

      }
    );

  };


  /**
   * add a message to a box
   */
  api.addMessage = function(box_id, msg, next) {

    // box = {attrs: {}}

    if(typeof msg !== 'object'){
      return next(new Error('invalid msg'));
    }

    // create at if none. strip at from message. at and id will be
    // reconsitituted when message is fetched from the db.

    var at = new Date();

    if(msg.hasOwnProperty('at')){
      at = msg.at;
      delete msg.at;
    }

    // convert milliseconds to js time for postgres
    if(_.isNumber(at)){
      at = new Date(at);
    }

    var sql;
    sql = "INSERT INTO msg";
    sql += " (box_id, at, data) ";
    sql += " VALUES ";
    sql += " ($1, $2, $3) ";
    sql += " RETURNING id;";

    db.queryOne(
      sql,
      [box_id, at, msg],
      function(err, row){
        msg.id = row.id;
        msg.at = new Date(at).getTime();
        next(null, msg);
      });

  };


  /**
   * get a single message by id
   */
  api.delMessage = function(box_id, msg_id, next){

    if(!validate.uuid(msg_id)){
      return next(new Error('invalid msg_id'));
    }

    var sql;

    sql = "DELETE FROM msg ";
    sql += " WHERE box_id = $1";
    sql += " AND id = $2";

    db.queryOne(
      sql,
      [box_id, msg_id],
      next
    );

  };


  /**
   * delete an box by id
   */
  api.delBox = function(box_id, next) {

    var delMessages = function(done){
      var sql;
      sql = "DELETE ";
      sql += " FROM msg ";
      sql += " WHERE box_id = $1";

      db.query(
        sql,
        [box_id],
        function(err){
          done(err);
        });

    };

    var delBox = function(done){
      var sql;
      sql = "DELETE ";
      sql += " FROM box ";
      sql += " WHERE id = $1";

      db.query(
        sql,
        [box_id],
        function(err){
          done(err);
        });
    };

    async.series([
      delMessages,
      delBox
    ], function(){
      next();
    });

  };


  // export the api methods
  return api;

};
