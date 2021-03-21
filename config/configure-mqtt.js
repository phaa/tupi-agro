const mqtt = require('mqtt');

class MqttHandler {
  constructor(socketIO) {
    this.mqttClient = null;
    this.host = 'mqtt://broker.hivemq.com';
    //this.username = 'YOUR_USER'; // mqtt credentials if these are needed to connect
    //this.password = 'YOUR_PASSWORD';
    this.socketIO = socketIO;
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
      console.log(`mqtt client connected`);
    });

    // mqtt subscriptions
    this.mqttClient.subscribe('tupi/agro/estufa'/*, {qos: 0}*/);
    this.mqttClient.subscribe('tupi/agro/bomba'/*, {qos: 0}*/);

    // When a message arrives, console.log it
    this.mqttClient.on('message', function (topic, message) {
      console.log(topic.toString() + ": " + message.toString());
    });

    this.mqttClient.on('close', () => {
      console.log(`mqtt client disconnected`);
    });
  }

  sendGreenhouseMessage(message) {
    this.mqttClient.publish('tupi/agro/estufa', message);
  }

  sendPumpMessage(message) {
    this.mqttClient.publish('tupi/agro/bomba', message);
  }
}

module.exports = MqttHandler;