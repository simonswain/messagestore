"use strict";

var async = require('async');

var os = require('../lib');
var config = require( '../config');
var api = os.api(config);

var fooUuid = '00000000-0000-0000-0000-000000000000';

var myStream, myMsg;

exports.api = {

  'reset': function(test) {
    api.reset(function() {
      test.done();
    });
  },

  'purge': function(test) {
    api.purge(function() {
      test.done();
    });
  },

  'stats': function(test) {
    test.expect(2);
    api.stats(function(err, res) {
      test.equal(res.streams, 0);
      test.equal(res.messages, 0);
      test.done();
    });
  },

  'find-stream-none': function(test) {
    test.expect(2);
    api.getStream(
      fooUuid,
      function(err, stream) {
        test.equal(err, null);
        test.equal(stream, false);
        test.done();
      });
  },

  'add-stream': function(test){
    test.expect(1);
    myStream = {
      id: 'my-stream'
    };
    api.addStream(
      myStream,
      function(err, res){
        test.equal(err, null);
        test.done();
      });
  },

  'count-streams': function(test) {
    test.expect(2);
    api.countStreams(
      function(err, res) {
        test.equal(err, null);
        test.equal(res, 1);
        test.done();
      });
  },

  'get-streams': function(test) {
    test.expect(3);
    api.getStreams(
      function(err, res) {
        test.equal(err, null);
        test.equal(typeof res, 'object');
        test.equal(res.length, 1);
        test.done();
      });
  },

  'get-stream': function(test) {
    test.expect(2);
    api.getStream(
      myStream.id,
      function(err, res) {
        test.equal(err, null);
        test.equal(res.id, myStream.id);
        test.done();
      });
  },

  'set-stream': function(test) {
    test.expect(2);
    myStream.attrs = {
      setting: 321
    };
    api.setStream(
      myStream.id,
      myStream.attrs,
      function(err, res) {
        api.getStream(
          myStream.id,
          function(err, res) {
            test.equal(err, null);
            test.deepEqual(res.attrs, myStream.attrs);
            test.done();
          });
      });
  },

  'add-message': function(test) {
    test.expect(2);
    myMsg = {
      at: new Date(),
      foo:'bar'
    };
    api.addMessage(
      myStream.id,
      myMsg,
      function(err, res) {
        myMsg.id = res.id;
        api.getMessage(
          myStream.id,
          res.id,
          function(err, res) {
            test.equal(err, null);
            test.equals(res.foo, myMsg.foo);
            test.done();
          });
      });
  },
  'count-messages': function(test) {
    test.expect(2);
    api.countMessages(
      myStream.id,
      function(err, res) {
        test.equal(err, null);
        test.equal(res, 1);
        test.done();
      });
  },
  'get-messages': function(test) {
    test.expect(4);
    api.getMessages(
      myStream.id,
      function(err, res) {
        test.equal(err, null);
        test.equal(typeof res, 'object');
        test.equal(res.length, 1);
        test.equal(res[0].id, myMsg.id);
        test.done();
      });
  },
  'get-message': function(test) {
    test.expect(2);
    api.getMessage(
      myStream.id,
      myMsg.id,
      function(err, res) {
        test.equal(err, null);
        test.deepEqual(res.foo, myMsg.foo);
        test.done();
      });
  },
  'stats-some': function(test) {
    test.expect(2);
    api.stats(function(err, res) {
      test.equal(res.streams, 1);
      test.equal(res.messages, 1);
      test.done();
    });
  },
  'del-message': function(test) {
    test.expect(1);
    api.delMessage(
      myStream.id,
      myMsg.id,
      function(err, res) {
        test.equal(err, null);
        test.done();
      });
  },
  'get-deleted-message': function(test) {
    test.expect(2);
    api.getMessage(
      myStream.id,
      myMsg.id,
      function(err, res) {
        test.equal(err, null);
        test.equal(res, false);
        test.done();
      });
  },
  'delete-stream': function(test) {
    test.expect(2);
    api.delStream(
      myStream.id,
      function(err) {
        api.getStream(
          myStream.id,
          function(err, res) {
            test.equal(err, null);
            test.equal(res, false);
            test.done();
          });
      });
  },
  'get-deleted-stream': function(test) {
    test.expect(2);
    api.getStream(
      myStream.id,
      function(err, res) {
        test.equal(err, null);
        test.equal(res, false);
        test.done();
      });
  },
  'stats-none': function(test) {
    test.expect(2);
    api.stats(function(err, res) {
      test.equal(res.streams, 0);
      test.equal(res.messages, 0);
      test.done();
    });
  },
  'quit': function(test) {
    api.quit(function(err, res) {
      test.done();
    });
  }
};
