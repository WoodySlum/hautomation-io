/*
 *  This sketch demonstrates how to set up a simple HTTP-like server.
 *  The server will set a GPIO pin depending on the request
 *    http://server_ip/gpio/0 will set the GPIO2 low,
 *    http://server_ip/gpio/1 will set the GPIO2 high
 *  server_ip is the IP address of the ESP8266 module, will be
 *  printed to Serial when the module is connected.
 */

#include <Hautomation.h>

String JSON_CONFIG = "%config%";
Hautomation hautomation = Hautomation();

void setup() {
  hautomation.setup(JSON_CONFIG);
  // Serial.println(hautomation.baseUrl());
  //

  hautomation.postSensorValue("1508003508", 22, 34);
}

void loop() {
    hautomation.loop();
}
