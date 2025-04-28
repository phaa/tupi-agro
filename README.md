# Tupi Agro
Projeto com a finalidade de gerenciar parâmetros de umidade, temperatura, pH do solo, e fertirrigaḉão através de microcontroladores instalados em estufas de produção de pimentão colorido.

# API
O projeto web consiste em uma API desenvolvida em Nodejs e Express. Conta com sistema de autenticação, dashboard, agendamento de horários e modo de operação autônomo ou seja liga e desliga os atuadores da estufa com base em parâmetros pré-estabelecidos.

# IoT
Esse projeto funciona em conjunto com um sistema de IoT em C++ e arduino, o qual é responsável pela coleta e envio dos dados.

Para esse projeto fiz vários testes e estudos sobre as melhores bibliotecas e práticas para a transmissão de dados em estufas e, assim, optei por utilizar conexões Ethernet que são mais estáveis e leves para implementar em pequenos módulos arduino. 
Antes o projeto utilizava um ESP32, entretanto, por ele operar em uma tensão de 3.3v, acarretou em incompatibilidade com muitos dos módulos que haviam disponíveis no mercado brasileiro.

Os projetos do Arduino estão todos na pasta com mesmo nome. 

