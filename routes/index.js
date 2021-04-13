const express = require('express');
const router = express.Router();
const Rule = require("../models/greenhouse-rules");
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
  //console.log(req.user);
  res.render('inicio',{
    user: req.user,
    title: 'inicio',
  });
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