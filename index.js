'use strict';

const os = require('os');
const nodeStatic = require('node-static');
const http = require('http');
const https = require('https');
const socketIO = require('socket.io');

const fs = require('fs');

const privateKey = fs.readFileSync('./encrypt/server.key')
const certificate = fs.readFileSync('./encrypt/server.crt')

const options = {
  key: privateKey,
  cert: certificate,
}

var fileServer = new(nodeStatic.Server)();

http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(80);
var app = https.createServer(options , function(req, res) {
  fileServer.serve(req, res);
}).listen(443);

var io = socketIO.listen(app)
