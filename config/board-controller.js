const axios = require('axios');
const Scheduling = require("../models/scheduling");
const Historic = require("../models/irrigation-historic");
const Tools = require("../config/tools");

class BoardController {

  constructor() { 
    this.loop = this.loop.bind(this);
    this.ip = "192.168.0.144";
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
    now.setSeconds(0); // Ignora os segundos
    console.log(`Agora: ${now}`);

    const nowTime = Tools.timeStringToDatabase(now.toLocaleString().slice(11)); // pega só o trecho da data

    /* Substituir o check de erros no envio
    const response = await axios.get("http://"+ this.ip +"/check");

    if(response.status != 200) {
      return;
    }
    */

    const entryScheduling = await Scheduling.findOne({ executeOn: nowTime }).exec();
    // or if scheduling has an error. So try again

    if(entryScheduling) {
      console.log(`Encontrou entry: ${entryScheduling.executeOn}`)
      let historic = new Historic({
        section: entryScheduling.section,
        error: false
      });

      const now = new Date();
      if (await this.sendCommand(1, entryScheduling.section)) {
        console.log("Entry historic deu certo");
        entryScheduling.active = true;
        historic.startDate = now;
      }
      else {
        console.log("Entry historic deu errado");
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

    const endSchedulings = await Scheduling.find({ 
      $and: [
        // Agendamento ativo E ($and) que já passou do tempo ou está na hora de desativar (<=)
        { stopOn: { $lte: nowTime } }, 
        { active: true }
      ]}).exec();

    if(endSchedulings) {
      for (let endScheduling of endSchedulings) {
        console.log(`EndScheduling: ${endScheduling.stopOn}`);
        let historic = await Historic.findOne({}).sort({'_id': -1}).exec();
        console.log(`Encontrou historic: ${historic}`);

        if (historic.error == true) {
          console.log("Irrigação já teve erro antes");
          return;
        }

        console.log("Sem erros no histórico");

        if (await this.sendCommand(0, endScheduling.section)) {
          console.log("End historic deu certo");
          historic.endDate = new Date();
          endScheduling.active = false;
        }
        else {
          console.log("End historic deu errado");
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
  }

  async sendCommand(mode, section) {
    try {
      let response = await axios.get("http://"+ this.ip +`/command?pump=${ mode }&section=${ section }`);
      if (response.status == 200) {
        if (response.data.manual > 0) {
          console.log("Enviou");
          return true;
        } else {
          console.log("Operação não permitida pela MCU");
          return false;
        }
      } 
    }
    catch (err) {
      console.log("Erro no envio");
      return false;
    }
  }
}

module.exports = function() {
  const boardController = new BoardController();
  return boardController;
};