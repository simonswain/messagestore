DROP TABLE IF EXISTS stream CASCADE;
DROP TABLE IF EXISTS box CASCADE;
DROP TABLE IF EXISTS msg CASCADE;

CREATE TABLE box (
       id varchar(36),
       attrs json
);

CREATE INDEX box_id_idx ON box (id);

CREATE TABLE msg (
       id uuid primary key default uuid_generate_v4(),
       box_id varchar(36),
       at timestamp,
       data json
);

CREATE INDEX msg_id_idx ON msg (id);
CREATE INDEX ids_idx ON msg (box_id, id, at);
