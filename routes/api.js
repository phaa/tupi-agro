const express = require('express');
const router = express.Router();
//const io = require("socket.io-client");

//const socket = io();
//ar socket = io.connect("localhost", {port: 80});

//socket.on("connect", () => {
    //console.log("Conectou " + socket.id); // x8WIv7-mJelg7on_ALbx
//});

/*
module.exports = function (ioServer) {
    var module = {};

    router.post('/store_data', (req, res) => {
        const { umidade } = req.body;
        console.log(umidade)
        ioServer.sockets.emit('newData', temp);
        //res.send("Recebido!" + ioServer);
    });

    module.router = router;

    return module;
};
*/
module.exports = function (app, io) {
    app.post('/api/store_data', (req, res) => {
        //console.log(io.sockets);
        io.sockets.emit('newData', req.body);
        res.send("Recebido!" + io.sockets);
    });
};