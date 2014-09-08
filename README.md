# Messagestore

Version: 0.0.0 alpha

[![Build Status](https://travis-ci.org/simonswain/messagestore.png)](https://travis-ci.org/simonswain/messagestore)

Messagestore is a database for storing time-series messages, grouped
in to named Streams

Use Messagestore either as a library in your own app, or run it as a
REST server. Methods are exposed to allow you to control the server
programatically, and a script is provided to get it running it out of
the box.

Messagestore uses Postgresql as it's backing database.

The schema looks something like this:

```
CREATE TABLE stream (
       id uuid primary key default uuid_generate_v4(),
       attrs json
);

CREATE TABLE msg (
       id uuid primary key default uuid_generate_v4(),
       stream_id uuid,
       at timestamp,
       data json
);
```

Messagestore is just a simple way of storing and retrieving messages
against a known stream_id.

It is expected you will be storing references to streams elsewhere, so
there is no real discovery mechanism.

## API

All methods take a callback that is called with err and result. The
signatures below use `next` to identify the callback.

### `addStream(stream, next)`

stream is like this:

```javascript
{
  id: <your-id>,
  attrs: <json>
}
```

You set choose your own `id`, up to 36 characters long.

`attrs` are optional and can be changed later.

### `setStream(stream_id, attrs, next)`

Change a stream's attrs

### `getStream(stream_id, next)`

### `delStream(stream_id, next)`

### `countStreams(opts, next)`

How many streams

### `getStreams(opts, next)`

Get multiple streams

Streams are sorted by id

`opts` is required. Default values are:

```
{
  base: 0,
  limit: 100
}

```

### `addMessage(stream_id, msg, next)`

msg is like 
```javascript
{
  at: <date>,
  data: <json>
}
```

If no `at` is provided, it will be set for you

### `countMessages(stream_id, next)`

How many messages in a stream

### `getMessages(stream_id, opts, next)`

Get multiple messages

### `getMessage(stream_id, msg_id, next)`

Get one message

### `delMessages(stream_id, msg_id, next)`



## Release History

* 07/09/2014 0.0.0 Pre-alpha

## License

Copyright (c) 2014 Simon Swain

Licensed under the MIT license.
