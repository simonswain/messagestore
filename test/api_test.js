"use strict";

var async = require('async');

var os = require('../lib');
var config = require( '../config');
var api = os.api(config);

var fooUuid = '00000000-0000-0000-0000-000000000000';

var myBox, myMsg;

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
      test.equal(res.boxes, 0);
      test.equal(res.messages, 0);
      test.done();
    });
  },

  'find-box-none': function(test) {
    test.expect(2);
    api.getBox(
      fooUuid,
      function(err, box) {
        test.equal(err, null);
        test.equal(box, false);
        test.done();
      });
  },

  'add-box': function(test){
    test.expect(1);
    myBox = {
      id: 'my-box'
    };
    api.addBox(
      myBox,
      function(err, res){
        test.equal(err, null);
        test.done();
      });
  },

  'count-boxes': function(test) {
    test.expect(2);
    api.countBoxes(
      function(err, res) {
        test.equal(err, null);
        test.equal(res, 1);
        test.done();
      });
  },

  'get-boxes': function(test) {
    test.expect(3);
    api.getBoxes(
      function(err, res) {
        test.equal(err, null);
        test.equal(typeof res, 'object');
        test.equal(res.length, 1);
        test.done();
      });
  },

  'get-box': function(test) {
    test.expect(2);
    api.getBox(
      myBox.id,
      function(err, res) {
        test.equal(err, null);
        test.equal(res.id, myBox.id);
        test.done();
      });
  },

  'set-box': function(test) {
    test.expect(2);
    myBox.attrs = {
      setting: 321
    };
    api.setBox(
      myBox.id,
      myBox.attrs,
      function(err, res) {
        api.getBox(
          myBox.id,
          function(err, res) {
            test.equal(err, null);
            test.deepEqual(res.attrs, myBox.attrs);
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
      myBox.id,
      myMsg,
      function(err, res) {
        myMsg.id = res.id;
        api.getMessage(
          myBox.id,
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
      myBox.id,
      function(err, res) {
        test.equal(err, null);
        test.equal(res, 1);
        test.done();
      });
  },
  'get-messages': function(test) {
    test.expect(4);
    api.getMessages(
      myBox.id,
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
      myBox.id,
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
      test.equal(res.boxes, 1);
      test.equal(res.messages, 1);
      test.done();
    });
  },
  'del-message': function(test) {
    test.expect(1);
    api.delMessage(
      myBox.id,
      myMsg.id,
      function(err, res) {
        test.equal(err, null);
        test.done();
      });
  },
  'get-deleted-message': function(test) {
    test.expect(2);
    api.getMessage(
      myBox.id,
      myMsg.id,
      function(err, res) {
        test.equal(err, null);
        test.equal(res, false);
        test.done();
      });
  },
  'delete-box': function(test) {
    test.expect(2);
    api.delBox(
      myBox.id,
      function(err) {
        api.getBox(
          myBox.id,
          function(err, res) {
            test.equal(err, null);
            test.equal(res, false);
            test.done();
          });
      });
  },
  'get-deleted-box': function(test) {
    test.expect(2);
    api.getBox(
      myBox.id,
      function(err, res) {
        test.equal(err, null);
        test.equal(res, false);
        test.done();
      });
  },
  'stats-none': function(test) {
    test.expect(2);
    api.stats(function(err, res) {
      test.equal(res.boxes, 0);
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
