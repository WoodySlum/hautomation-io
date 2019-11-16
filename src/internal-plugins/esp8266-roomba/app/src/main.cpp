#include <Hautomation.h>

String JSON_CONFIG = "%config%";
Hautomation hautomation = Hautomation();

#define SERIAL_RX     D5  // pin for SoftwareSerial RX
#define SERIAL_TX     D6  // pin for SoftwareSerial TX
#define BRC_PIN 0

void resetRoomba() {
	digitalWrite(BRC_PIN, LOW);
	delay(100);
	digitalWrite(BRC_PIN, HIGH);
	Serial.begin(19200);

    Serial.write(128);
    delay(50);
    Serial.write(129);
    delay(50);
    Serial.write(11);
    delay(50);
    Serial.write(7);
    delay(50);

	delay(500);
	Serial.begin(115200);

    Serial.write(128);
    delay(50);
    Serial.write(129);
    delay(50);
    Serial.write(11);
    delay(50);
    Serial.write(7);
    delay(50);

	digitalWrite(BRC_PIN, LOW);
	delay(100);
	digitalWrite(BRC_PIN, HIGH);
	//timer.setTimeout(5000, StayAwake);
}

void awake() {
    digitalWrite(BRC_PIN, LOW);
    delay(500);
    digitalWrite(BRC_PIN, HIGH);
    delay(500);
}

void startRoomba() {
    awake();
    Serial.write(131);
    delay(50);
    Serial.write(135);
    delay(50);
    Serial.write(128);
    hautomation.getWebServer().send(200, "application/json", "{\"success\":true}");
}

void stopRoomba() {
    awake();
    Serial.write(131);
    delay(50);
    Serial.write(133);
    delay(50);
    Serial.write(128);
    hautomation.getWebServer().send(200, "application/json", "{\"success\":true}");
}

void spotRoomba() {
    awake();
    Serial.write(131);
    delay(25);
    Serial.write(134);
    delay(25);
    Serial.write(128);
    delay(25);
    hautomation.getWebServer().send(200, "application/json", "{\"success\":true}");
}

void dockRoomba() {
    awake();
    Serial.write(131);
    delay(25);
    Serial.write(143);
    delay(25);
    Serial.write(128);
    delay(25);
    hautomation.getWebServer().send(200, "application/json", "{\"success\":true}");
}

void ping() {
    hautomation.ping();
    hautomation.getWebServer().send(200, "application/json", "{\"success\":true}");
}

void statusRoomba() {
/*    char tmp[5];
	char buffer[10];
    int i = 0;

    String status_log;
    // Clean buffer
	while (Serial.available() > 0) {
		Serial.read();
		i++;
		delay(1);
	}
    if ( i > 0 ) {
		status_log += "Dumped ";
		status_log += i;
		status_log += " bytes.\n";
	}

    // Serial.write(28);
    // delay(25);
    Serial.write(148);
    delay(25);
    Serial.write(1);
    delay(25);
    Serial.write(3);
    delay(25);
    delay(500);

    i = 0;
	status_log += "RX: ";
	while ( Serial.available() > 0) {
		buffer[i] = Serial.read();
		status_log += String(buffer[i], DEC);
		status_log += " ";
		i++;
		delay(5);
	}
	status_log += "\n";

    if ( i == 0 ) {
		status_log += "ERROR: No response\n";
	}

	// Handle an incomplete packet (too much or too little data)
	if (i != 10) {
		status_log += "ERROR: Incomplete packet recieved ";
		status_log += i;
		status_log += " bytes.\n";
	}*/

    hautomation.getWebServer().send(200, "application/json", "{\"success\":true}");
}


void setup() {
    hautomation.setup(JSON_CONFIG);

    pinMode(BRC_PIN, OUTPUT);
    digitalWrite(BRC_PIN, HIGH);
    delay(25);

    hautomation.getWebServer().on("/reset", resetRoomba);
    hautomation.getWebServer().on("/start", startRoomba);
    hautomation.getWebServer().on("/stop", stopRoomba);
    hautomation.getWebServer().on("/spot", spotRoomba);
    hautomation.getWebServer().on("/dock", dockRoomba);
    hautomation.getWebServer().on("/status", statusRoomba);
    hautomation.getWebServer().on("/ping", ping);
}

void loop() {
    hautomation.getWebServer().handleClient();
}
