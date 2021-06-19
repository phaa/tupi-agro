const axios = require('axios');
const Scheduling = require("../models/scheduling");

class BoardController {

  constructor() { }

  async begin(minutes) {
    setInterval(async () => {
      const response = await axios.get("http://192.168.0.144/greenhouse");
      console.log("30 min, hora do DB: " + response.data);
    }, 1000 * 60 * minutes);
    console.log("Setou o interval");
  }

  repeatEvery(func, interval) {
    // Check current time and calculate the delay until next interval
    let now = new Date();
    let delay = interval - now % interval;

    const start = () => {
        // Execute function now...
        func();
        // ... and every interval
        this.repeatEvery(func, interval);
    }

    // Delay execution until it's an even interval
    setTimeout(start, delay);
  }

  async beginIrrigationSchedulesChecker() {

    this.repeatEvery(async () => {
      let now = new Date();
      console.log(`Agora: ${now}`)
      now.setSeconds(0); // Aqui a gente ignora os segundos para fim de praticidade
      const nowString = now.toLocaleString().slice(11); // pega só o trecho da data

      const filters = {
        $or: [{  executeOn: nowString }, { stopOn: nowString }]
      };
      const scheduling = await Scheduling.findOne(filters).exec(); //query.limit(1);
      
      if (scheduling) {
        console.log("Encontrou scheduling")
        const greenhouseData = null;
        try {
          greenhouseData = await axios.get("http://192.168.0.144/greenhouse");
        } catch (error) {
          if (error.request) {
            /*
             * The request was made but no response was received, `error.request`
             * is an instance of XMLHttpRequest in the browser and an instance
             * of http.ClientRequest in Node.js
             */
            console.log("MCU desligada")
          }
          return;
        }
        
        const automaticIrrigation = greenhouseData.data.automaticIrrigation;

        // Se estiver no modo manual, ele ignora o agendamento
        if (!automaticIrrigation) { console.log("Não está no automático"); return; }

        if (scheduling.executeOn === nowString && scheduling.active != true) {
          //pump=1&section=1
          const response = await axios.get("http://192.168.0.144/command?pump=1");
          if (response) {
            await Scheduling.updateOne({ _id: scheduling._id }, { active: true });
          }
        } 
        else if (scheduling.stopOn === nowString && scheduling.active != false) {
          const response = await axios.get("http://192.168.0.144/command?pump=0");
          if (response) {
            await Scheduling.updateOne({ _id: scheduling._id }, { active: false });
          }
        }
      }
    }, 60000);
  }
}

module.exports = function() {
  const boardController = new BoardController();
  return boardController;
};