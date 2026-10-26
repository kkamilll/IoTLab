export const productEnrichmentData = {
  "Arduino Uno R3": {
    description: `Klasyczna i najbardziej rozpoznawalna płytka rozwojowa oparta na 8-bitowym mikrokontrolerze ATmega328P. Stanowi podstawowe wyposażenie stanowisk dydaktycznych w laboratorium IoT, służąc do nauki podstaw elektroniki, programowania mikrokontrolerów w języku C/C++ oraz prototypowania układów sterowania.

Płytka posiada 14 cyfrowych wyprowadzeń wejścia/wyjścia (z czego 6 może pracować w trybie PWM), 6 wejść analogowych podłączonych do 10-bitowego przetwornika ADC oraz rezonator kwarcowy 16 MHz. Jest w pełni kompatybilna z ekosystemem nakładek Arduino Shield.

Wskazówka laboratoryjna: Układ pracuje z poziomami logicznymi 5V. Zalecane zasilanie z portu USB lub zasilacza wtyczkowego DC 7–12V. Maksymalny prąd na pojedynczy pin I/O wynosi 20 mA.`,
    extraFields: {},
    labRoom: "Sala 101 - Systemy Wbudowane i Prototypowanie",
    tags: ["arduino", "uno-r3", "atmega328p", "mikrokontrolery", "avr", "embedded", "edukacja", "prototypowanie"]
  },

  "ESP32 DevKit V1": {
    description: `Zaawansowany moduł deweloperski IoT wyposażony w dwurdzeniowy, 32-bitowy procesor Xtensa LX6 taktowany zegarem do 240 MHz. Zintegrowana łączność Wi-Fi 802.11 b/g/n oraz Bluetooth v4.2 BR/EDR + BLE czynią z niego kluczową platformę do budowy bezprzewodowych węzłów sensorycznych, serwerów MQTT oraz bram telemetrii.

Moduł zawiera wbudowaną antenę PCB, stabilizator napięcia 3.3V oraz konwerter USB-UART (CP2102), co umożliwia bezpośrednie programowanie i debugowanie z poziomu Arduino IDE, ESP-IDF lub MicroPython.

Wskazówka laboratoryjna: Piny I/O tolerują wyłącznie napięcie 3.3V. Podłączenie sygnałów 5V bez konwertera poziomów logicznych grozi trwałym uszkodzeniem układu.`,
    extraFields: {},
    labRoom: "Sala 101 - Systemy Wbudowane i Prototypowanie",
    tags: ["esp32", "wifi", "bluetooth", "ble", "iot", "espressif", "32-bit", "mqtt", "telemetria"]
  },

  "STM32 Nucleo-64": {
    description: `Oficjalna płytka ewaluacyjna STMicroelectronics z mikrokontrolerem STM32F401RET6 opartym na wydajnym 32-bitowym rdzeniu ARM Cortex-M4 z jednostką zmiennoprzecinkową FPU oraz rozszerzeniami DSP. Wykorzystywana na zajęciach z zaawansowanych systemów wbudowanych i cyfrowego przetwarzania sygnałów.

Płytka posiada zintegrowany programator i debugger ST-LINK/V2-1 (złącze Mini-USB), eliminujący potrzebę stosowania zewnętrznych sond JTAG/SWD. Złącza Morpho oraz kompatybilność ze standardem Arduino Uno R3 ułatwiają podłączanie modułów rozszerzających.

Wskazówka laboratoryjna: Obsługa w środowiskach STM32CubeIDE, Keil MDK lub PlatformIO. Programator ST-LINK udostępnia wirtualny port COM (VCP) do komunikacji szeregowej z komputerem PC.`,
    extraFields: {},
    labRoom: "Sala 102 - Systemy Mikroprocesorowe ARM",
    tags: ["stm32", "arm", "cortex-m4", "nucleo", "stlink", "dsp", "embedded", "stm32cube"]
  },

  "Raspberry Pi 4 Model B (4GB)": {
    description: `Wydajny minikomputer jednoukładowy (SBC) czwartej generacji, idealny do realizacji bramek IoT, lokalnego przetwarzania danych brzegowych (Edge Computing), serwerów bazodanowych oraz systemów wizyjnych.

Jednostka napędzana jest 64-bitowym, czterordzeniowym procesorem Broadcom BCM2711 ARM Cortex-A72 o taktowaniu 1.5 GHz oraz 4 GB pamięci RAM LPDDR4. Posiada dwa porty micro-HDMI z obsługą rozdzielczości do 4K przy 60 fps, dwa porty USB 3.0 oraz gigabitowy interfejs Ethernet (True Gigabit Ethernet).

Wskazówka laboratoryjna: Wymagane zasilanie min. 5V / 3.0A przez gniazdo USB-C. Ze względu na wydzielanie ciepła zaleca się stosowanie radiatorów lub aktywnego chłodzenia wentylatorem.`,
    extraFields: {},
    labRoom: "Sala 102 - Systemy Mikroprocesorowe ARM",
    tags: ["raspberrypi", "rpi4", "sbc", "linux", "arm64", "edge-computing", "iot-gateway", "python"]
  },

  "Raspberry Pi 5 (8GB)": {
    description: `Najnowocześniejszy i najszybszy minikomputer z rodziny Raspberry Pi. Oferuje 2-3 krotnie wyższą wydajność procesora i układu graficznego w porównaniu z modelem 4B dzięki czterordzeniowemu układowi Broadcom BCM2712 ARM Cortex-A76 taktowanemu 2.4 GHz.

Model ten po raz pierwszy wprowadza jednoukładowy kontroler I/O RP1 (zaprojektowany bezpośrednio przez Raspberry Pi), zapewniający bezprecedensową przepustowość peryferiów, zintegrowany kontroler PCIe 2.0 x1 oraz sprzętowy zegar czasu rzeczywistego (RTC) z opcją podtrzymania bateryjnego.

Wskazówka laboratoryjna: Dedykowany do wymagających projektów sztucznej inteligencji, analizy strumieni wideo, uczenia maszynowego (TinyML) oraz klastrowania węzłów IoT. Zasilanie zasilaczem USB-C PD 27W (5V/5A).`,
    extraFields: {},
    labRoom: "Sala 102 - Systemy Mikroprocesorowe ARM",
    tags: ["raspberrypi", "rpi5", "sbc", "arm64", "cortex-a76", "pcie", "nvme", "tinyml", "edge-ai"]
  },

  "DHT11 Temperature & Humidity Sensor": {
    description: `Popularny i prosty w obsłudze cyfrowy czujnik temperatury oraz wilgotności względnej powietrza. Wykorzystuje rezystancyjny sensor wilgotności oraz termistor NTC sprzężone z 8-bitowym mikrokontrolerem konwertującym odczyty na pojedynczą cyfrową szynę 1-Wire.

Moduł wyposażony jest w rezystor podciągający magistralę danych (pull-up 4.7kΩ–10kΩ), co pozwala na bezpośrednie podłączenie do pinów mikrokontrolerów Arduino, ESP32 lub STM32 bez dodatkowych elementów zewnętrznych.

Wskazówka laboratoryjna: Częstotliwość próbkowania wynosi maksymalnie 1 Hz (jeden pomiar na sekundę). Idealny do podstawowych ćwiczeń telemetrycznych i stacji pogodowych.`,
    extraFields: {},
    labRoom: "Sala 201 - Sensoryka i Pomiary Środowiskowe",
    tags: ["sensor", "dht11", "temperatura", "wilgotnosc", "1wire", "meteo", "telemetria"]
  },

  "DHT22 Temperature & Humidity Sensor": {
    description: `Precyzyjny cyfrowy czujnik temperatury i wilgotności (AM2302) o podwyższonej dokładności i znacznie szerszym zakresie pomiarowym niż model DHT11. Doskonały wybór do stacji meteo, systemów klimatyzacji HVAC oraz monitorowania parametrów mikroklimatu w serwerowniach i laboratoriach.

Zapewnia 16-bitową rozdzielczość pomiarową z ujemnym zakresem temperatur aż do -40°C oraz pełnym zakresem wilgotności od 0 do 100% RH.

Wskazówka laboratoryjna: Dopuszczalny interwał odczytu to min. 2 sekundy (0.5 Hz). Zasilanie 3.3V–5V. W zestawie z rezystorem podciągającym pin danych.`,
    extraFields: {},
    labRoom: "Sala 201 - Sensoryka i Pomiary Środowiskowe",
    tags: ["sensor", "dht22", "am2302", "temperatura", "wilgotnosc", "hvac", "stacja-meteo", "precision"]
  },

  "HC-SR04 Ultrasonic Distance Sensor": {
    description: `Ultradźwiękowy czujnik odległości działający na zasadzie echolokacji fal dźwiękowych o częstotliwości 40 kHz. Wykorzystywany powszechnie w robotyce mobilnej, pojazdach autonomicznych do wykrywania przeszkód oraz przemysłowych układach pomiaru poziomu cieczy i materiałów sypkich.

Moduł posiada 4 wyprowadzenia: VCC, GND, TRIG (wyzwalanie impulsu ultradźwiękowego min. 10 µs) oraz ECHO (czas trwania stanu wysokiego jest proporcjonalny do mierzonej odległości).

Wskazówka laboratoryjna: Napięcie robocze modułu to 5V. Pin ECHO wysyła sygnał 5V – w przypadku podłączania do ESP32/Raspberry Pi (3.3V) należy bezwzględnie zastosować dzielnik napięcia (np. 1kΩ / 2kΩ) na linii ECHO!`,
    extraFields: {},
    labRoom: "Sala 201 - Sensoryka i Pomiary Środowiskowe",
    tags: ["sensor", "ultrasonic", "sonar", "hcsr04", "odleglosc", "robotyka", "obstacle-avoidance"]
  },

  "LoRa32 Module (SX1276)": {
    description: `Długozasięgowy moduł radiowy LPWAN bazujący na transceiverze Semtech SX1276 połączonym z mikrokontrolerem ESP32. Umożliwia realizację transmisji telemetrycznej na dystansach rzędu 5–15 km w otwartej przestrzeni przy minimalnym poborze energii.

Przystosowany do europejskiego pasma ISM 868 MHz (lub 915 MHz). Na płytce zintegrowano wyświetlacz OLED 0.96" I2C (128x64 px), gniazdo antenowe SMA/IPEX, obwód ładowania ogniw Li-Ion 18650 oraz sprzętowy układ zarządzania zasilaniem.

Wskazówka laboratoryjna: NIGDY nie uruchamiaj modułu radiowego z nadawaniem bez przykręconej anteny – grozi to natychmiastowym spaleniem stopnia końcowego mocy w układzie SX1276!`,
    extraFields: {},
    labRoom: "Sala 301 - Sieci Bezprzewodowe i Telemetria",
    tags: ["lora", "lorawan", "sx1276", "esp32", "868mhz", "lpwan", "oled", "telemetria", "long-range"]
  },

  "SG90 Micro Servo Motor": {
    description: `Niezwykle popularny, lekki (9 gramów) mikromechanizm serwomechanizmu orczykowego o zakresie obrotu 180 stopni. Powszechnie stosowany w modelarstwie, małych manipulatorach robotycznych, obrotnicach głowic kamerowych oraz mechanizmach blokujących.

Sterowanie odbywa się standardowym sygnałem PWM o okresie 20 ms (50 Hz), gdzie szerokość impulsu od 1.0 ms do 2.0 ms determinuje pozycję kątową osi wyjściowej orczyka.

Wskazówka laboratoryjna: Zasilanie 4.8V–6.0V. Ze względu na zakłócenia indukcyjne i piki prądowe przy starcie silnika (do 500-650 mA pod obciążeniem), zasilaj serwo z zewnętrznego źródła zasilania, a nie bezpośrednio z pinu 5V mikrokontrolera. Pamiętaj o wspólnym połączeniu mas (GND).`,
    extraFields: {},
    labRoom: "Sala 101 - Systemy Wbudowane i Prototypowanie",
    tags: ["serwo", "silnik", "sg90", "pwm", "robotyka", "aktuator", "orczyk", "manipulator"]
  },

  "5V Relay Module (4-channel)": {
    description: `Czterokanałowy moduł przekaźnikowy wyposażony w transoptorową optoizolację galwaniczną dla każdego kanału. Pozwala na bezpieczne załączanie obciążeń wysokonapięciowych (sieć 230V AC) lub wysokoprądowych obwodów DC za pomocą niskonapięciowych sygnałów cyfrowych z mikrokontrolera.

Każdy przekaźnik posiada komplet wyprowadzeń śrubowych ARK w konfiguracji NO (Normally Open), NC (Normally Closed) oraz COM (Common). Diody LED na płytce sygnalizują stan załączenia cewki każdego z przekaźników.

Wskazówka laboratoryjna: Domyślnie moduł wyzwalany jest stanem niskim (Active-LOW). Zworka JD-VCC umożliwia całkowite odseparowanie zasilania cewek przekaźników od zasilania układu logicznego mikrokontrolera, eliminując ryzyko resetowania procesora przez zakłócenia EMF.`,
    extraFields: {},
    labRoom: "Sala 301 - Sieci Bezprzewodowe i Telemetria",
    tags: ["przekaznik", "relay", "4channel", "optoizolacja", "230v", "smart-home", "automatyka", "aktuator"]
  }
};
