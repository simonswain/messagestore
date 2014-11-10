var messagestore = require('./lib');
var logger = require( './lib/logger');
var config = require( './config');
var server = messagestore.server(config);

server.start(function(){
  logger.log( 'info','Messagestore running on ' + config.host + ':' + config.port );
});

process.on( 'SIGINT', function() {
  logger.log( 'info','Shutting Down...' );
  server.stop(function(){
    logger.log( 'info','Finished.' );
  });
});
