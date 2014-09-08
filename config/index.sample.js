var env = process.env.NODE_ENV || 'development';

var nickname = 'ms';

var pg = {
  host:'localhost', 
  port: 5432,
  username: 'ms',
  password: 'ms', 
  database: ''
};

exports.host = 'localhost';

switch ( env ) {
case 'test' :
  exports.port = 8103;
  pg.database = nickname + '_test';
  break;

case 'development' :
  exports.port = 8102;
  pg.database = nickname + '_dev';
  break;

case 'live' :
  exports.port = 8101;
  pg.database = nickname + '_live';
  break;
}

var db = {
  url: 'postgres://' + pg.username + ':' + pg.password + '@' + pg.host + '/' + pg.database
};

exports.env = env;
exports.db = db;

