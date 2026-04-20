#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <PubSubClient.h>


// for millis clock
unsigned long lastTime = 0;


// sensors global
constexpr byte TEMP_PIN = 32;
OneWire Temp_Wire(TEMP_PIN);
DallasTemperature Temp_Sensor(&Temp_Wire);



// networking global
const char *SSID = "your network name";
const char *PASSWORD = "your password";

WiFiClient espClient; // the network socket
PubSubClient mqttClient(espClient);


void setup()
{
	Serial.begin(115200);
	Temp_Sensor.begin();

	// =========== WIFI ============ //

	WiFi.begin(SSID, PASSWORD);
	while (WiFi.status() != WL_CONNECTED)
	{
		delay(500);
		Serial.println("Connecting to WiFi<@_@>...");
	}
	Serial.println("Connected to WiFi :D");
	Serial.println(WiFi.localIP());

	// ============================= //

	// =========== MQTT ============ //

	mqttClient.setServer("10.4.42.128", 1883);
	mqttClient.connect("FM-Tankie_1");

	if (mqttClient.connected())
	{
		Serial.println("Connected to MQTT broker :D");
	}
	else
	{
		Serial.println("Failed to connect to MQTT broker D:! Check your settings and try again...");
	}

	// ============================= //
}

void loop()
{
	unsigned long currentTime = millis();

	if (currentTime - lastTime >= 2000) // sending data every 2 seconds
	{
		// getting tempture data
		lastTime = currentTime;
		Temp_Sensor.requestTemperatures();
		float Temp = Temp_Sensor.getTempCByIndex(0);

		if (Temp == -127.0)
		{
			Serial.println("Sensor error! Check wiring ...."
						   " "
						   "ಠ╭╮ಠ");
		}
		else
		{
			Serial.print(Temp);
			Serial.println(" °C");
		}

		// building JSON payload
		char payload[50];
		snprintf(payload, sizeof(payload), "{\"temperature\": %.1f}", Temp);

		// publishing to MQTT broker
		mqttClient.publish("FishMaster/tank/Tankie", payload)
			? Serial.println("Message published successfully :D")
			: Serial.println("Failed to publish message D: ! Check your MQTT broker settings and try again...");
	}
}
