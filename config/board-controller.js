const axios = require('axios');
const Scheduling = require("../models/scheduling");

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

  repeatEvery(func, interval) {
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

  async beginSchedulingsChecker() {

    this.repeatEvery(async () => {
      let now = new Date();
      //console.log(`Agora: ${now}`)
      now.setSeconds(0); // Aqui a gente ignora os segundos para fim de praticidade
      const nowString = now.toLocaleString().slice(11); // pega só o trecho da data

      const filters = {
        $or: [{  executeOn: nowString }, { stopOn: nowString }]
      };
      const scheduling = await Scheduling.findOne(filters).exec(); //query.limit(1);
      
      if (scheduling) {
        console.log("Encontrou scheduling")

        // Verifica se a MCU está com a irrigação automática ligada
        const greenhouseData = null;
        try {
          const section = scheduling.section;
          greenhouseData = await axios.get("http://192.168.0.144/greenhouse?section=" + section);
        } 
        catch (error) {
          if (error.request) {
            /**
             * A requisição foi feita, mas não foi recebida, 'error.request' é uma instância
             * de XMLHttpRequest no navegador. No nodejs, é uma instância de http.ClientRequest
             */
            console.log("MCU desligada")
          }
          return;
        }

        // Se estiver no modo manual, ele ignora o agendamento
        if (!greenhouseData.data.automaticIrrigation) { console.log("Não está no automático"); return; }

        let pumpState = null;

        if (scheduling.executeOn === nowString && scheduling.active != true) {
          pumpState = true;
        } 
        else if (scheduling.stopOn === nowString && scheduling.active != false) {
          pumpState = false;
        }

        try {
          const response = await axios.get(`http://192.168.0.144/command?pump=${ (pumpState) ? 1 : 0 }&section=${section}`);
          if (response) {
            await Scheduling.updateOne({ _id: scheduling._id }, { active: pumpState });
          }
        }
        catch (error) { 
          if (error.request) {
            console.log("MCU desligada")
          }
          return;
        }// Fim do Try
      }
    }, 60000); // A cada 1 minuto (60.000 milissegundos)
  }
}

module.exports = function() {
  const boardController = new BoardController();
  return boardController;
};