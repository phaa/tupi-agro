const app = require('express');
const http = require('http').createServer(app);
const io = require('socket.io')(http);

io.on('connection', (socket) => {

  console.log('ESP32 conectado');
  console.log(socket.id);
  console.log("JWT token test: ",socket.handshake.headers)

  socket.on('onGreenhouseCheck', (data) => {

    console.log('saudando desde ESP32: ');
    console.log(data);
    socket.emit("messageToArduino", "instigaaa");
  })
  
  socket.on('disconnect', () => {

    console.log('desconectado');

  })

})

http.listen(80, () => {

  console.log("server launched on port 3000");
})