const express = require('express');
const router = express.Router();
const User = require("../models/user.js");
const bcrypt = require('bcrypt');
const passport = require('passport');

// Pagina de login
router.get('/login', (req, res) => {
  //resolver
  if(req.user) {
    res.redirect('/inicio');
  }
  res.render('login', { layout: 'layouts/login-layout' });
});

router.get('/getall', (req, res) => {
  User.find({}, function(err, users) {
    var userMap = {};

    users.forEach(function(user) {
      userMap[user._id] = user;
    });

    res.send(userMap);  
  });
});


router.post('/login', (req, res, next) => {
  passport.authenticate('local',{
    successRedirect : '/inicio',
    failureRedirect : '/users/login',
    failureFlash : true,
    })(req, res, next);
    console.log(req.user)
});

// Pagina de registro
router.get('/register', (req, res) => {
  res.render('register')
});

router.post('/register', (req, res) => {
  // Argument destructuring
  const {name,email, password, password2} = req.body;
  
  // Array de erros para retornar ao usuário
  let errors = [];
  
  console.log(' Name ' + name+ ' email :' + email+ ' pass:' + password);

  if(!name || !email || !password || !password2) {
    errors.push({msg : "Por favor, preencha todos os campos"});
  }

  if(password !== password2) {
    errors.push({msg : "As senhas não coincidem"});
  }

  if(password.length < 6 ) {
    errors.push({msg : 'A senha deve possuir no mínino 6 caracteres'})
  }

  if(errors.length > 0 ) {
    res.render('register', {
      errors : errors,
      name : name,
      email : email,
      password : password,
      password2 : password2
    });
  } else {
    // Nada errado na verificação
    User.findOne({email : email}).exec((err, user) => {
      console.log("Encontrou no BD: \n" + user);
      if(user) {
        errors.push({msg: 'Esse e-mail já está cadastrado'});
        res.render('register', {
          errors : errors,
          name : name,
          email : email,
          password : password,
          password2 : password2
        });
      } else {
        // Cadastra o usuário
        const newUser = new User({
          name: name,
          email: email,
          password: password
        });
        // Gera um hash para o usuário
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err,hash) => {
            if(err) throw err;
            // Coloca o hash novo no lugar da senha
            newUser.password = hash;
            // Comita o usuário no BD
            newUser.save()
            .then(value => {
              console.log(value);
              req.flash('success_msg','Cadastro realizado com sucesso!')
              res.redirect('/users/login');
            })
            .catch(value => console.log(value));       
          }
        )});
      }
    });
  }
});

//logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg','Desconectado com sucesso');
  res.redirect('/users/login');
});
module.exports = router;