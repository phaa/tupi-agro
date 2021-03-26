const express = require('express');
const router = express.Router();
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

module.exports = router;