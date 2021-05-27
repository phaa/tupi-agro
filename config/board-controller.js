const axios = require('axios');
const Scheduling = require("../models/scheduling");

class BoardController {

  constructor() {
  }

  begin(minutes) {
    setInterval(() => {
      axios.get(`http://192.168.0.108/greenhouse`)
      .then(res => {
        console.log(res.data);
      })
      .catch(error => {
        console.log(error); // Network Error
        console.log(error.status); // undefined
        console.log(error.code); // undefined
      });
    }, 1000 * 60 * minutes);
    console.log("Setou o interval")
  }

  checkIrrigationTask() {
    setInterval(() => { 
      let now = new Date();
      // Aqui a gente ignora os segundos para fim de praticidade
      now.setSeconds(0);

      let nowString = now.toLocaleString().slice(11);

      console.log("Now String = " + nowString)

      let query = Scheduling.findOne({ $or: [{ executeOn: nowString }, { stopOn: nowString }] });
      query.limit(1);
      query.exec((err, scheduling) => {
        // Sem agendamento nesse minuto
        if(!scheduling) {
          // Recursão daqui a 1 min
          console.log("Não tem nada")
          
        } 
        // Tem algum agendamento listado: Para desligar ou encerrar a irrigação
        else {
          console.log("Tem coisa aí " + scheduling.executeOn + " " + scheduling.stopOn)
          // Algoritmo para iniciar irrigação
          if(scheduling.executeOn === nowString && scheduling.active != true) {
            console.log("Ligou Bomba")
            Scheduling.updateOne({ _id: scheduling._id }, { active: true }).exec();
          } 
          // Algoritmo para encerrar a irrigação
          else if(scheduling.stopOn === nowString && scheduling.active != false) {
            console.log("Desligou a bomba")
            Scheduling.updateOne({ _id: scheduling._id }, { active: false }).exec();
          }
        }
      });
    }, 5000);


    
/*

    

    let data = await Scheduling.findOne({ executeOn: { $lte: new Date().  () } }).limit(1);

    if (!data) {
      // Nenhum agendamento nesse momento, checa após 5s
      setTimeout(() => { 
        checkSchedulerForTask(); 
      }, 5000);
      return;
    } else {
      // task exists, send it to execute to other function / queue
      switch (data.taskType) { 
        case 'SMS':
            sendSMS(data.data)
          default:
          // do default casing
        }
      // delete that task so it does not repeat and check for the next
      checkSchedulerForTask()
    }
    */
  }
}

module.exports = function() {
  //console.log("socket; " +socketIO);
  const boardController = new BoardController();
  return boardController;
};