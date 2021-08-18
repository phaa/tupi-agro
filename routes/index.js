const express = require('express');
const router = express.Router();

const Scheduling = require("../models/scheduling");
const Historic = require("../models/irrigation-historic");
const Tools = require("../config/tools");

const { ensureAuthenticated } = require("../config/auth.js");

// Página de login
router.get('/', (req, res) => {
  res.redirect('/users/login');
});

// Página de registro
router.get('/register', (req, res) => {
  res.render('register');
});


/**
 * Página inicial
 */
router.get('/inicio', ensureAuthenticated, async (req, res) => {
  let schedulingsMap = [];
  const schedules = await Scheduling.find({}).sort({executeOn: 'ascending'}).exec();
  schedules.forEach(schedule => {
    schedulingsMap.push(schedule)
  });

  let historicsMap = [];
  const historics = await Historic.find({}).sort({executeOn: 'ascending'}).populate("scheduling").exec();
  historics.forEach(historic => {
    historicsMap.push(historic);
  });

  res.render('inicio', {
    user: req.user,
    title: 'inicio',
    schedulings: schedulingsMap,
    historics: historicsMap,
  });
  
});

router.post('/inicio', ensureAuthenticated, (req, res) => {
  const { time1, time2, section } = req.body;

  const newScheduling = new Scheduling({
    executeOn: Tools.timeStringToDatabase(time1+":00"),
    stopOn: Tools.timeStringToDatabase(time2+":00"),
    active: false,
    section: section,
  });

  // Verificar se já existe um scheduling nesse horario

  newScheduling.save().then(value => {
    res.redirect('/inicio');
  });
 
});

router.get('/inicio/del_horario/:id', ensureAuthenticated, (req, res) => {
  Scheduling.deleteOne({ _id: req.params.id }, (err) => {
    res.redirect('/inicio');
    if (err) return handleError(err);
  });
});

/**
 * Monitoramento
 * Serão apenas os gráficos dos dados de ambiente
 */
router.get('/monitoramento', ensureAuthenticated, (req, res) => {
  res.render('monitoramento',{
    user: req.user,
    title: 'monitoramento',
  });
});


/**
 * Controles
 * Controles de liga e desliga de cada seção de irrigação
 * "Eu posso importar o board controller aqui e usar os metodos dele"
 */
router.get('/controles', ensureAuthenticated, (req, res) => {
  res.render('controles',{
    user: req.user,
    title: 'controles',
  });
  
});

module.exports = router;