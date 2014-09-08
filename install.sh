createuser -P ms

createdb -O ms ms_dev
psql -d ms_dev -c 'CREATE EXTENSION "uuid-ossp";'

createdb -O ms ms_test
psql -d ms_test -c 'CREATE EXTENSION "uuid-ossp";'

createdb -O ms ms_live
psql -d ms_live -c 'CREATE EXTENSION "uuid-ossp";'
