const { Gpio } = require('pigpio');

// Pins
const FAN_PWM_PIN = 18; // GPIO18 (PWM)
const FAN_TACH_PIN = 23; // GPIO23 (Tachometer)

// Setup PWM (25kHz standard for Noctua)
const pwm = new Gpio(FAN_PWM_PIN, { mode: Gpio.OUTPUT });
pwm.hardwarePwmWrite(25000, 350000); // 25kHz, 50% duty cycle (500000 = 50% of 1M)

// Setup Tachometer input with pull-up and alerts
const tach = new Gpio(FAN_TACH_PIN, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_UP,
    alert: true,
});

let pulseCount = 0;
let startTime = process.hrtime.bigint();

tach.on('alert', (level) => {
    if (level === 0) {
        // falling edge
        pulseCount++;
    }
});

setInterval(() => {
    const now = process.hrtime.bigint();
    const elapsedSeconds = Number(now - startTime) / 1e9;

    const rpm = (pulseCount / 2) * (60 / elapsedSeconds); // 2 pulses per rev

    console.log(`Fan RPM: ${rpm.toFixed(0)}`);

    // Reset counters
    pulseCount = 0;
    startTime = now;
}, 1000);

// Optional: clean exit
process.on('SIGINT', () => {
    console.log('Stopping fan...');
    pwm.hardwarePwmWrite(0, 0); // stop PWM
    process.exit();
});
