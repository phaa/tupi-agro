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
  const { time1, time2 } = req.body;

  /*let start = new Date(1970,1,1);
  start.setHours(time1.substring(0,2),time1.substring(3,5));
  console.log(start)

  let end = new Date(1970,1,1);
  end.setHours(time2.substring(0,2),time2.substring(3,5));
  console.log(end)*/
  
  const newScheduling = new Scheduling({
    taskType: 'FERTIRRIGATION',
    executeOn: time1+":00",
    stopOn: time2+":00",
    active: false,
    complete: 'Não'
  });

  newScheduling.save()
  .then(value => {
    res.redirect('/inicio');
  })
 
});

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