
class BoardController {

  constructor(socket) {
    this.socket = socket;
  }

  setup() {
    this.socket.on('connection', socket => {
      console.log('Cliente do Socket conectado');

      socket.on('disconnect', () => {
        console.log('Usuário desconectado');
      });

      socket.on("pageBoot", args => {
        this.socket.emit("requestBoot", args);
      });

      socket.on('messageToArduino', args => {
        console.log(args.topic + " to arduino: " + args.message);
        this.socket.emit("onBooting", "ssssssss");
      });

      socket.on("onGreenhouseCheck", args => {
        this.socket.broadcast.emit("front_onGreenhouseCheck", args);
      });

      socket.on("requestToggleTool", args => {
        console.log(args);
        this.socket.emit("onToggleTool", args);
      });

    });
  }

  onMcuBoot() {
    let { boot, pump, exaust, fert } = JSON.parse(message);
    console.log("onBooting " + message.toString());

    //get states from states Handler
    this.socket.emit("onBooting", { 
      aiState: 1, 
      pumpState: pump, 
      aeState: 1, 
      exaustState: exaust,
      afState: 1,
      fertState: fert 
    });
  }

  onReadGreenhouse(message) {
    let { soilMoisture, airTemp, airHumidity } = JSON.parse(message);
    //console.log(`${soilMoisture} : ${airTemp} : ${airHumidity}`);
    this.socket.emit("newData", {soilMoisture, airTemp, airHumidity});
    this.stateManager.readGreenhouseParams(soilMoisture, airTemp, airHumidity, true);
  }

  onTogglePump(message) {
    if (message == "PUMP_OFF_OK") {
      this.socket.emit("confirmUI", { pumpState: false });
    }
    if (message == "PUMP_ON_OK") {
      this.socket.emit("confirmUI", { pumpState: true });
    }
  }

  onToggleExaust() {

  }

}

module.exports = function(socketIO) {
  //console.log("socket; " +socketIO);
  const boardController = new BoardController(socketIO);
  return boardController;
};