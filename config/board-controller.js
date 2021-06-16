const axios = require('axios');
const Scheduling = require("../models/scheduling");

class BoardController {

  constructor() {
  }

  async begin(minutes) {
    setInterval(async () => {
      const response = await axios.get("http://192.168.0.144/greenhouse");
      console.log(response.data);
    }, 1000 * 60 * minutes);
    console.log("Setou o interval");
  }

  // beginIrrigationChecking
  async checkIrrigationTask() {
    setInterval(async () => { 
      console.log("procurando scheduling")
      let now = new Date();
      now.setSeconds(0); // Aqui a gente ignora os segundos para fim de praticidade
      const nowString = now.toLocaleString().slice(11);

      const filters = {
        $or: [{  executeOn: nowString }, { stopOn: nowString }]
      };
      const scheduling = await Scheduling.findOne(filters).exec(); //query.limit(1);
      
      if (scheduling) {
        console.log("achou scheduling ")
        const greenhouseData = await axios.get("http://192.168.0.144/greenhouse");
        const automaticIrrigation = greenhouseData.data.automaticIrrigation;

        // Se estiver no modo manual, ele ignora o agendamento
        if (!automaticIrrigation) { console.log("Não está no automático"); return; }

        if (scheduling.executeOn === nowString && scheduling.active != true) {
          const response = await axios.get("http://192.168.0.144/command?pump=1");
          if (response) {
            await Scheduling.updateOne({ _id: scheduling._id }, { active: true });
          }
        } else if (scheduling.stopOn === nowString && scheduling.active != false) {
          const response = await axios.get("http://192.168.0.144/command?pump=0");
          if (response) {
            await Scheduling.updateOne({ _id: scheduling._id }, { active: false });
          }
        }
      }
    }, 5000);
  }
}

module.exports = function() {
  const boardController = new BoardController();
  return boardController;
};