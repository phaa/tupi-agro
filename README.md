# Tupi Agro
Project with the purpose of managing humidity, temperature, soil pH, and fertigation parameters through microcontrollers installed in greenhouses for the production of colored peppers.

# API
The web project consists of an API developed in Nodejs and Express. It has an authentication system, dashboard, scheduling, and autonomous operation mode, i.e., it turns the greenhouse actuators on and off based on pre-established parameters.

# IoT
This project works in conjunction with an IoT system in C++ and Arduino, which is responsible for collecting and sending data.

For this project, I performed several tests and studies on the best libraries and practices for data transmission in greenhouses and, therefore, I chose to use Ethernet connections that are more stable and lightweight to implement in small Arduino modules.

Previously, the project used an ESP32, however, because it operates at a voltage of 3.3V, it resulted in incompatibility with many of the modules that were available on the Brazilian market.

The Arduino projects are all in the folder with the same name.
