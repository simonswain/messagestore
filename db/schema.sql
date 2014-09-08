DROP TABLE IF EXISTS stream CASCADE;
DROP TABLE IF EXISTS msg CASCADE;

CREATE TABLE stream (
       id varchar(36),
       attrs json
);

CREATE INDEX stream_id_idx ON stream (id);

CREATE TABLE msg (
       id uuid primary key default uuid_generate_v4(),
       stream_id varchar(36),
       at timestamp,
       data json
);

CREATE INDEX msg_id_idx ON msg (id);
CREATE INDEX ids_idx ON msg (stream_id, id, at);
