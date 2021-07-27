const axios = require('axios');
const Scheduling = require("../models/scheduling");
const Historic = require("../models/irrigation-historic");

class BoardController {

  constructor() { 
    this.loop = this.loop.bind(this);
    this.ip = "192.168.0.144";
  }

  async begin() {
    const refreshTime = 30;
    setInterval(async () => {
      const response = await axios.get("http://"+ this.ip +"/greenhouse");
      console.log("30 min, hora do DB: " + response.data);
    }, 1000 * 60 * refreshTime);
    console.log("Setou o interval");
  }

  async beginSchedulingLoop() {
    // Verifica a hora atual e calcula o delay até o proximo intervalo
    const func = this.loop;
    const interval = 60000; // 1 min
    let now = new Date();
    let delay = interval - now % interval;

    const start = () => {
        // Executa a função passada
        func();
        // ... E inicia a recursividade
        this.beginSchedulingLoop();
    }

    // Segura a execução até o momento certo
    setTimeout(start, delay);
  }

  async loop() {
    let now = new Date();
    console.log(`Agora: ${now}`)
    now.setSeconds(0); // Ignora os segundos
    const nowString = now.toLocaleString().slice(11); // pega só o trecho da data

    const response = await axios.get("http://"+ this.ip +"/check");

    if(response.status != 200) {
      return;
    }


    const entryScheduling = await Scheduling.findOne({ executeOn: nowString }).exec();
    // or if scheduling has an error. So try again

    if(entryScheduling) {
      console.log(`Encontrou entry: ${entryScheduling.executeOn}`)
      let historic = new Historic({
        section: entryScheduling.section,
        error: false
      });

      const now = new Date();
      if (await this.turnPump(1, entryScheduling.section)) {
        console.log("Entry historic deu certo")
        entryScheduling.active = true;
        historic.startDate = now;
      }
      else {
        console.log("Entry historic deu errado")
        historic.startDate = null;
        historic.endDate = null;
        historic.error = true;
      }

      try {
        await entryScheduling.save();
        await historic.save();
      } catch (error) {
        console.log(error);
      }
    }

    const endScheduling = await Scheduling.findOne({ stopOn: nowString }).exec();

    if(endScheduling) {
      console.log(`Encontrou end: ${endScheduling.stopOn}`)
      let historic = await Historic.findOne({}).sort({'_id': -1}).exec();
      console.log(`Encontrou historic: ${historic}`)

      if (historic.error==true) {
        console.log("Erro no end")
        return;
      }

      console.log("Passou do if")

      if (await this.turnPump(0, endScheduling.section)) {
        console.log("End historic deu certo")
        historic.endDate = new Date();
        endScheduling.active = false;
      }
      else {
        console.log("End historic deu errado")
        historic.error = true;
      }

      try {
        await endScheduling.save();
        await historic.save();
      } catch (error) {
        console.log(error);
      }
    }
  }

  async turnPump(mode, section) {

    try {
      let response = await axios.get("http://"+ this.ip +`/command?pump=${ mode }&section=${ section }`);
      if (response.status == 200) {
        console.log("Enviou")
        return true;
        
      } 
    }
    catch (err) {
      if (err || response.data.error == "forbidden") {
        console.log("Erro")
        return false;
      }
    }
  }
}

module.exports = function() {
  const boardController = new BoardController();
  return boardController;
};