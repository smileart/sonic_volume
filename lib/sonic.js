'use strict'

var Gpio = require('pigpio').Gpio
var async = require('asyncawait/async');
var await = require('asyncawait/await');

exports.Sonic = class Sonic {

  constructor(trigger_pin = 17, echo_pin = 24) {
    this.trigger = new Gpio(trigger_pin, {mode: Gpio.OUTPUT})
    this.echo = new Gpio(echo_pin, {mode: Gpio.INPUT, alert: true})

    // The number of microseconds it takes sound to travel 1cm at 20 degrees celcius
    // See: http://hyperphysics.phy-astr.gsu.edu/hbase/Sound/souspe.html
    this.MICROSECDONDS_PER_CM = 1e6/34359;

    this.cleanup()
  }

  listen(callback) {
    var startTick
    var self = this

    this.echo.on('alert', function (level, tick) {
      var endTick, diff, distance

      if (level == 1) {
        startTick = tick
      } else {
        endTick = tick
        diff = (endTick >> 0) - (startTick >> 0) // Unsigned 32 bit arithmetic
        distance = (diff / 2 / self.MICROSECDONDS_PER_CM) // cm

        callback(distance)
      }
    });
  }

  buzz() {
    var self = this
    setInterval(function () {
      self.trigger.trigger(10, 1); // Set trigger high for 10 microseconds
    }, 200);
  }

  cleanup() {
    this.trigger.digitalWrite(0); // Make sure trigger is low
  }
}

// const sonic = new Sonic()
// sonic.listen((distance) => {
//   console.log(`YEAH! ${distance}`);
// })
//
// sonic.buzz()
//
// function finalise() {
//   console.log('  EXIT…')
//   sonic.cleanup()
//   process.exit()
// }
//
// process.on('SIGHUP', finalise)
// process.on('SIGINT', finalise)
// process.on('SIGQUIT', finalise)
// process.on('SIGABRT', finalise)
// process.on('SIGTERM', finalise)
// process.on('SIGINT', finalise)
