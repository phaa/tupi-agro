const axios = require('axios');
const Scheduling = require("../models/scheduling");
const Historic = require("../models/irrigation-historic");

class BoardController {

  constructor() { }

  async begin() {
    const refreshTime = 30;
    setInterval(async () => {
      const response = await axios.get("http://192.168.0.144/greenhouse");
      console.log("30 min, hora do DB: " + response.data);
    }, 1000 * 60 * refreshTime);
    console.log("Setou o interval");
  }

  async beginSchedulingLoop() {
    this.repeatEvery(this.loop, 60000); // A cada 1 minuto (60.000 milissegundos)
  }

  async repeatEvery(func, interval) {
    // Verifica a hora atual e calcula o delay até o proximo intervalo
    let now = new Date();
    let delay = interval - now % interval;

    const start = () => {
        // Executa a função passada
        func();
        // ... E inicia a recursividade
        this.repeatEvery(func, interval);
    }

    // Segura a execução até o momento certo
    setTimeout(start, delay);
  }

  async loop() {
    let now = new Date();
    console.log(`Agora: ${now}`)
    now.setSeconds(0); // Ignora os segundos
    const nowString = now.toLocaleString().slice(11); // pega só o trecho da data

    const entryScheduling = await Scheduling.findOne({ executeOn: nowString }).exec();

    if(entryScheduling) {
      console.log(`Encontrou entry: ${entryScheduling.executeOn}`)
      let historic = new Historic({
        scheduling: entryScheduling._id,
        error: false
      });

      let response = null;

      try {
        response = await axios.get(`http://192.168.0.144/command?pump=1&section=${ entryScheduling.section }`);
        console.log("Enviou")
      } 
      catch (err){
        console.log("Err: " + err)
      }

      if (response.status == 200) {
        historic.startDate = new Date();
      } 
      else if (response.data.error == "forbidden") {
        historic.error = true;
      }

      await historic.save();
    }


    const endScheduling = await Scheduling.findOne({ stopOn: nowString }).exec();

    if(endScheduling) {
      console.log(`Encontrou end: ${endScheduling.stopOn}`)
      let historic = await Historic.findOne({ scheduling: endScheduling._id }).sort({date: 'descending'}).exec();

      let response = null; 

      try{
        response = await axios.get(`http://192.168.0.144/command?pump=0&section=${ endScheduling.section }`);
        console.log("Enviou")
      } 
      catch (err) {
        console.log("Err2: " + err)
      }
      
      if (response.status == 200) {
        historic.endDate = new Date();
      } 
      else if (response.data.error == "forbidden") {
        historic.error = true;
      }

      await historic.save();
    }
  }

}

module.exports = function() {
  const boardController = new BoardController();
  return boardController;
};