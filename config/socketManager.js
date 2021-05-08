class SocketManager {
    constructor(socketInstance) {
      this.socket = socketInstance;
    }
  
    socketSetup() {
      this.socket.on('connection', s => {
        console.log('Usuário conectado');
  
        s.on('disconnect', () => {
          console.log('Usuário desconectado');
        });
  
        s.on('messageToArduino', args => {
          console.log(args.topic + " to arduino: " + args.message);
          this.mqttClient.publish(args.topic, args.message);
        });
      });
    }
  }