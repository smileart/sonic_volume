const Led = require('./lib/led.js').DualColorLed
const Sonic = require('./lib/sonic.js').Sonic
const lc = require('linear-converter-to-go');
const LinearConversion = require('linear-conversion')(lc);

require('shelljs/global');

const led = new Led()
const sonic = new Sonic()

// amixer cset numid=1 -- 100500
const low_volume = -2400
const high_volume = 400

const dist_to_duty = (new LinearConversion([[1, 30], [0, 255]]))
const dist_to_db = (new LinearConversion([[1, 30], [low_volume, high_volume]]))
// const dist_to_db = (new LinearConversion([[1, 30], [0, 100]])) # blooetooth % ?

var previous_volume = high_volume

sonic.listen((distance) => {
  var dutyCycle, volume

  if(distance >= 1 && distance <= 30) {
    // LED
    dutyCycle = Math.floor(dist_to_duty.convert(distance))
    if(dutyCycle > 255) {dutyCycle = 255}
    if(dutyCycle < 5) {dutyCycle = 0}
    console.log(`Brightness :: ${dutyCycle}`)
    led.red(dutyCycle)

    // VOLUME
    volume = Math.floor(dist_to_db.convert(distance))
    console.log(`Volume :: ${previous_volume} → ${volume}`)
    exec(`amixer cset numid=1 -- ${volume}`, {async: true, silent: true})
    // exec(`amixer set Master ${volume}%`, {async: true, silent: true}) # bluetooth?
    previous_volume = volume
  } else {
    led.red(0)
  }
})

sonic.buzz()

function finalise() {
  console.log('  EXIT…')
  led.cleanup()
  process.exit()
}

process.on('SIGHUP', finalise)
process.on('SIGINT', finalise)
process.on('SIGQUIT', finalise)
process.on('SIGABRT', finalise)
process.on('SIGTERM', finalise)
process.on('SIGINT', finalise)
