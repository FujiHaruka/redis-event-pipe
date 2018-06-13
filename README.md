# redis-event-pipe

Pipe EventEmitter to Redis Pub / Sub for Node.js application scalability.

This module wraps any EventEmitter-extended classes, then event methods such as `on` and `emit` will be executed through Redis Pub / Sub.
