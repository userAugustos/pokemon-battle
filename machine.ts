import { createMachine, assign, createActor } from 'xstate';

const playerMachine = createMachine({
  id: 'player',
  type: 'parallel',
  states: {
    track: {
      initial: 'paused',
      states: {
        paused: {
          on: {PLAY: 'playing'}
        },
        playing: {
          on: { STOP: 'paused' }
        }
      }
    },
    volume: {
      initial: 'normal',
      states: {
        normal: {
          on: { MUTE: 'muted' }
        },
        muted: {
          on: { UNMUTE: 'normal' }
        }
      }
    }
  }
})

const playerActor = createActor(playerMachine);

playerActor.start();

console.log('state value of parallel video/audio player',playerActor.getSnapshot().value)

const coffeeMachine = createMachine({
  id: 'coffee',
  initial: 'preparing',
  states: {
    preparing: {
      states: {
        // here is what they call on docs: "regions"
        // U should avoid transitions between regions, so grindBeans SHOULD NOT lead to something on boilWater, because they parallel
        grindBeans: {
          initial: 'grindingBeans',
          states: {
            grindingBeans: {
              on: {
                BEANS_GROUND: {
                  target: 'beansGround'
                }
              }
            },
            beansGround: {
              type: 'final'
            }
          }
        },
        boilWater: {
          initial: 'boilingWater',
          states: {
            boilingWater: {
              on: {
                WATER_BOILED: {
                  target: 'waterBoiled'
                }
              }
            },
            waterBoiled: {
              type: 'final'
            }
          }
        },
      },
      type: 'parallel',
      onDone: {
        target: 'makingCoffee'
      }
    },
    makingCoffee: {},
  }
})


const coffeeActor = createActor(coffeeMachine);

coffeeActor.start();

console.log('coffee actor boiling and griding', coffeeActor.getSnapshot().value)

coffeeActor.send({ type: 'WATER_BOILED' })

console.log('Water boiled, it does not affect beans', coffeeActor.getSnapshot().value)
