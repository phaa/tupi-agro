// Servidor
const express = require('express');
const http = require('http');

// Debugging
const debug = require('debug')('tupi-agro:server');
const createError = require('http-errors');
const logger = require('morgan');

// Aplicação Web
const path = require('path');
const expressEjsLayout = require('express-ejs-layouts');

// Sessão de usuário
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');

// Instancia o servidor HTTP com o Express e o Socket.io
const app = express();
const server = http.createServer(app);

// Socket.io
const io = require("socket.io")(server);

// MQTT
const arduinoHandler = require("./config/arduino-handler")(io);
//const mqttClient = new mqttHandler(io);
arduinoHandler.connect();

  // Importação de rotas
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
//const apiRouter = require('./routes/api')(io);

// Autenticação
const passport = require('passport');
const passportConfigure = require('./config/passport')(passport);

// Banco de dados
const mongoStarter = require('./database/mongo-connection');
mongoStarter.connect('pedro', 'mclaren2018', 'estufas');

// Configuraçâo das views 
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressEjsLayout);
app.set("layout extractScripts", true);
app.set('layout', 'layouts/layout');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Express session
app.use(session({
  secret : 'secret',
  resave : true,
  saveUninitialized : true
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Mensagens flash
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error  = req.flash('error');
  next();
});

// Rotas do projeto
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Configuração das rotas da api
require('./routes/api')(app, io);
//app.use('/api', apiRouter.router);

// Captura um 404 e envia ao gerenciador de erros
app.use(function(req, res, next) {
  next(createError(404));
});

// Gerenciador de erros na camada de aplicação
app.use(function(err, req, res, next) {
  // Adiciona variaveis locais apenas em desenvolvimento
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Renderiza a página HTTP 500
  res.status(err.status || 500);
  res.render('error');
});

const port = normalizePort(process.env.PORT || '80');
app.set('port', port);
server.listen(port, '0.0.0.0');
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Listener para erros no server
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Listener para quando o server iniciar
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'porta ' + addr.port;
  debug('Esperando na ' + bind);
  console.log('Esperando na ' + bind);
}

//module.exports = app;
