const mqtt = require('mqtt');
const StateManager = require('./stateManager');
const stateManager = require('./stateManager');

class ArduinoHandler {
  constructor(socketIO) {
    this.mqttClient = null;
    this.host = 'mqtt://broker.hivemq.com';
    //this.username = 'YOUR_USER'; // mqtt credentials if these are needed to connect
    //this.password = 'YOUR_PASSWORD';
    this.socket = socketIO;
    this.socketSetup();
    this.stateManager = new StateManager();
  }
  
  connect() {
    // Connect mqtt with credentials (in case of needed, otherwise we can omit 2nd param)
    this.mqttClient = mqtt.connect(this.host/*, { username: this.username, password: this.password }*/);

    // Mqtt error calback
    this.mqttClient.on('error', (err) => {
      console.log(err);
      this.mqttClient.end();
    });

    // Connection callback
    this.mqttClient.on('connect', () => {
      console.log(`Cliente MQTT conectado`);
    });

    // mqtt subscriptions
    this.mqttClient.subscribe('tupi/agro/estufa'/*, {qos: 0}*/);
    this.mqttClient.subscribe('tupi/agro/bomba'/*, {qos: 0}*/);

    // When a message arrives, console.log it
    this.mqttClient.on('message', (topic, message) => {
      console.log(topic.toString() + ": " + message);

      message = message.toString();

      // Mensagem JSON
      if(message.startsWith("{\"soil")) {
        const obj = JSON.parse(message);
        let { soilMoisture, airTemp, airHumidity } = obj;
        //console.log(`${soilMoisture} : ${airTemp} : ${airHumidity}`);
        this.socket.emit("newData", {soilMoisture, airTemp, airHumidity});
      }

      // Resultado de GET_MEASUREMENTS
      if(message.startsWith("{\"boot")) {
        const obj = JSON.parse(message);
        let { boot, pump, exaust, fert } = obj;
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

      // Resultado de AI_ON, AI_OFF
      if(message.startsWith("AI_")) {
        if (message == "AI_OFF_OK") {
          this.socket.emit("confirmUI", { aiState: false });
        }
        if (message == "AI_ON_OK") {
          this.socket.emit("confirmUI", { aiState: true });
        }
      }
      
      // Resultado de PUMP_ON, PUMP_OFF
      if(message.startsWith("PUMP_")) {
        if (message == "PUMP_OFF_OK") {
          this.socket.emit("confirmUI", { pumpState: false });
        }
        if (message == "PUMP_ON_OK") {
          this.socket.emit("confirmUI", { pumpState: true });
        }
      }
    });

    this.mqttClient.on('close', () => {
      console.log(`Um cliente MQTT desconectou`);
    });
  }

  socketSetup() {
    this.socket.on('connection', socket1 => {
      console.log('Usuário conectado');
  
      socket1.on('disconnect', () => {
        console.log('Usuário desconectado');
      });

      socket1.on('messageToArduino', args => {
        console.log("to_arduino " + args.topic + ":" + args.message);
        this.mqttClient.publish(args.topic, args.message);
      });
    });
  }
}

module.exports = function(socketIO) {
  //console.log("socket; " +socketIO);
  const arduinoHandler = new ArduinoHandler(socketIO);
  return arduinoHandler;
};