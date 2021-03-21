module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log('Usuário conectado');

    socket.on('disconnect', () => {
      console.log('Usuário desconectado');
    });

    socket.on('newData', (data) => {
      console.log('Dados: ' + data);
      io.emit('newData', data);
    });
  });
}