'use strict'

var Gpio = require('pigpio').Gpio
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var red_semaphore = require('semaphore')(1);
var green_semaphore = require('semaphore')(1);

exports.DualColorLed = class DualColorLed {

  constructor() {
    this.red_led = new Gpio(18, {mode: Gpio.OUTPUT})
    this.green_led = new Gpio(13, {mode: Gpio.OUTPUT})

    this.operators = {
      '+' : function(a, b) { return a + b; },
      '-' : function(a, b) { return a - b; },
      '*' : function(a, b) { return a * b; },
      '/' : function(a, b) { return a / b; },
    }

    this.comparisons = {
      '>' : function(a, b) { return a > b; },
      '<' : function(a, b) { return a < b; },
      '>=' : function(a, b) { return a >= b; },
      '<=' : function(a, b) { return a <= b; },
      '==' : function(a, b) { return a == b; }
    }

    this.cleanup()
  }

  green(value) {
    green_semaphore.take(() => {
      this.green_led.pwmWrite(value)
      green_semaphore.leave()
    })
  }

  red(value) {
    red_semaphore.take(() => {
      this.red_led.pwmWrite(value)
      red_semaphore.leave()
    })
  }

  orange(value = 14) {
    if(value < 14) { value = 0 }
    var red_value = Math.floor((4/17) * value)

    this.green(value)
    this.red(red_value)
  }

  yellow(value = 255) {
    if(value < 60) { value = 0 }

    this.green(value)
    this.red(Math.floor(value/25))
  }

  // for green: start = 0, finish = 60, speed = 1, delay = 10
  // for red: start = 0, finish = 255, speed = 3, delay = 10
  fade(direction = 'out', color = 'red', start = 255, finish = 0, speed = 1, delay = 10) {
    var self = this

    return new Promise((resolve, reject) => {
      if(direction === 'in') {
        var comparison = '>='
        var operator = '+'
      } else {
        var comparison = '<='
        var operator = '-'
      }

      var dutyCycle = start

      var tick = setInterval(((self) => {
        return () => {
          self[color](dutyCycle)
          dutyCycle = self.operators[operator](dutyCycle, speed)

          if (self.comparisons[comparison](dutyCycle, finish)) {
            resolve(true)
            clearInterval(tick)
          }
        }
      })(self), delay)
    })
  }

  pulse(color, times, delay) {
    var self = this
    return async((times) => {
      for (var i = 0; i <= times; i++) {
        await(self.fade('in', color, 0, 255, 1, delay))
        await(self.fade('out', color, 255, 1, 1, delay))
      }
    })(times)
  }

  blink(color, times, delay) {
    var self = this
    return async((times) => {
      for (var i = 0; i <= times; i++) {
        await(self.fade('in', color, 255, 255, 1, delay))
        await(self.fade('out', color, 0, 0, 1, delay))
      }
    })(times)
  }

  cleanup() {
    this.green(0)
    this.red(0)
  }
}

// const led = new DualColorLed()
//
// var start = new Date()
// var timer_id = setInterval(() => {
//   var now = new Date()
//   if(now - start >= (1000 * 60 * 1)) {
//     clearInterval(timer_id);
//   } else {
//     led.pulse('orange', 1, 5).then(() => {console.log('+1')})
//   }
// }, 255*5*2) // 255 iterations with step 1 * 10ms delay * 2 for 1 fade in and 1 fade out

// led.pulse('red', 10).then(() => {console.log('Done')})
// led.pulse('green', 10).then(() => {console.log('Done')})
// led.pulse('yellow', Infinity).then(() => {console.log('Done')})
// led.pulse('orange', Infinity).then(() => {console.log('Done')})

// led.blink('red', Infinity, 500).then(() => {console.log('Done')})
// led.blink('green', Infinity, 500).then(() => {console.log('Done')})
// led.blink('yellow', Infinity, 500).then(() => {console.log('Done')})
// led.blink('orange', Infinity, 500).then(() => {console.log('Done')})

// led.orange(255)
// led.yellow(255)
// setInterval(() => {}, 1000)

// function finalise() {
//   console.log('  EXIT…')
//   led.cleanup()
//   process.exit()
// }
//
// process.on('SIGHUP', finalise)
// process.on('SIGINT', finalise)
// process.on('SIGQUIT', finalise)
// process.on('SIGABRT', finalise)
// process.on('SIGTERM', finalise)
// process.on('SIGINT', finalise)
