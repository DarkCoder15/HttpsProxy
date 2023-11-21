const http = require('http');
const ws = require('ws');
const net = require('net');
const url = require('url');
const fs = require('fs');

const web = http.createServer((req, res) => {
    if (req.url.endsWith("/client.js")) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('Hello World');
    }
});

web.listen(80);
const path = `/proxy`;

const serv = new ws.WebSocketServer({
    noServer: true
});
serv.on('connection', (c, req, pathname) => {
    const [host, port] = pathname.slice(1).split(':');
    const connection = new net.Socket();
    let instantWrite = false;
    let write = [];
    //console.log(`Connection to ${host}:${port}`);
    c.binaryType = "nodebuffer";
    connection.on('ready', () => {

    });
    c.on('close', () => {
        //console.log('WebSocket disconnected');
        connection.end();
    });
    c.on('error', (err) => {
        //console.log('WebSocket error');
        //console.log(err);
        connection.end();
    });
    c.on('message', (data, isBin) => {
        //console.log(isBin);
        //console.log(data);
        if (isBin) {
            if (instantWrite)
                connection.write(data);
            else
                write.push(data);
        }
    });
    connection.connect(parseInt(port), host, () => {
        //console.log(`Remote host connected`);
        instantWrite = true;
        for (const data of write) {
            connection.write(data);
            //console.log(data);
        }
        write = [];
        /*c.send("connect", {
            binary: false
        });*/
    });
    connection.on('error', (err) => {
        //console.log(`Remote host error`);
        //console.log(err);
        c.close();
    });
    connection.on('end', () => {
        //console.log(`Remote host disconnected`);
        c.close();
    });
    connection.on('data', (data) => {
        //console.log(`Sending data to WebSocket`);
        c.send(data, {
            binary: true
        });
    });
});

web.on('upgrade', (request, socket, head) => {
    const { pathname } = url.parse(request.url);
    serv.handleUpgrade(request, socket, head, function done(ws) {
        serv.emit('connection', ws, request, pathname);
    });
});