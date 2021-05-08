const mqtt = require('mqtt');

class McuManager {
  constructor() {
    this.mqttClient = null;
    this.host = 'mqtt://broker.hivemq.com';
    //this.username = 'YOUR_USER'; // mqtt credentials if these are needed to connect
    //this.password = 'YOUR_PASSWORD';
    this.mqttClient = mqtt.connect(this.host /*, { username: this.username, password: this.password }*/ );
    this.topics = [
      'tupi/agro/estufa',
      'tupi/agro/bomba',
    ];
  }

  socketSetup() {
    this.socket.on('connection', s => {
      console.log('Cliente do Socket conectado');

      s.on('disconnect', () => {
        console.log('Usuário desconectado');
      });

      s.on('messageToArduino', args => {
        console.log(args.topic + " to arduino: " + args.message);
        this.mqttClient.publish(args.topic, args.message);
      });
    });
  }

  configureMqtt() {
    // Mqtt error calback
    this.mqttClient.on('error', this.onError);

    // Connection callback
    this.mqttClient.on('connect', this.onConnect);

    // Close callback
    this.mqttClient.on('close', this.onError);

    // Mqtt subscriptions
    this.mqttClient.subscribe(this.topics);

    // When a message arrives, console.log it
    this.mqttClient.on('message', (topic, message) => {
      console.log(topic.toString() + ": " + message);

      message = message.toString();
      topic = topic.toString();

      // Mensagem JSON
      if(message.startsWith("{\"soil")) {
        this.onReadGreenhouse(message);
      }

      // Resultado de GET_MEASUREMENTS
      if(message.startsWith("{\"boot")) {
        this.onMcuBoot(message);
      }

      // Resultado de PUMP_ON, PUMP_OFF
      if(message.startsWith("PUMP_")) {
        this.onTogglePump(message);
      }

      // Resultado de EXAUST_ON, EXAUST_OFF
      if(message.startsWith("EXAUST_")) {
        this.onToggleExaust(message);
      }
    });
  }

  onConnect() {
    console.log(`Cliente MQTT conectado`);
  }

  onError(err) {
    console.log(err);
    this.mqttClient.end();
  }

  onClose() {
    console.log(`Um cliente MQTT desconectou`);
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