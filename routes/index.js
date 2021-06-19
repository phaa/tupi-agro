const express = require('express');
const router = express.Router();

const Rule = require("../models/greenhouse-rules");
const Scheduling = require("../models/scheduling");

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
router.get('/inicio', ensureAuthenticated, (req, res) => {
  Scheduling.find({}).sort({executeOn: 'ascending'}).exec((err, schedules) => {
    let schedulingsMap = [];

    schedules.forEach(schedule => {
      schedulingsMap.push(schedule)
      
    });

    res.render('inicio', {
      user: req.user,
      schedulings: schedules,
      title: 'inicio',
    });
  });
  
});

router.post('/inicio', ensureAuthenticated, (req, res) => {
  const { time1, time2, section } = req.body;
  
  const newScheduling = new Scheduling({
    taskType: 'FERTIRRIGATION',
    executeOn: time1+":00",
    stopOn: time2+":00",
    active: false,
    section: section,
  });

  newScheduling.save().then(value => {
    res.redirect('/inicio');
  })
 
});

router.get('/inicio/del_horario/:id', ensureAuthenticated, (req, res) => {
  Scheduling.deleteOne({ _id: req.params.id }, (err) => {
    res.redirect('/inicio');
    if (err) return handleError(err);
  });
});

/**
 * Monitoramento
 */
router.get('/monitoramento', ensureAuthenticated, (req, res) => {
  res.render('monitoramento',{
    user: req.user,
    title: 'monitoramento',
  });
});

router.get('/regras', ensureAuthenticated, (req, res) => {
  Rule.find({}, (err, rules) => {
    console.log(req.user)
    res.render('regras',{
      user: req.user,
      title: 'regras',
      rules: rules
    });
  });
  
});

module.exports = router;