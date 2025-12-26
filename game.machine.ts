import {assign, createActor, createMachine, setup} from "xstate";

interface Pokemon {
  id: string;
  atk: number;
  HP: number;
  name: string;
  def: number;
  alive: boolean;
}

interface Player {
  id: number;
  name: string;
  HP: number;
  deck: Pokemon[];
  currentPokemon: Pokemon | null;
}

interface GameContext {
  round: number;
  player1: Player; // I believe this is context, because we can switch to any player information
  player2: Player;
  winner: Player | null;
  allPokemon: Pokemon[]; //list of all possible pokemons (user select deck from here)
  selectedPokemonList: string[] // id list
}

const initialContext: GameContext = {
  round: 0,
  player1: {
    currentPokemon: {
      id: '1',
      atk: 35,
      HP: 100,
      name: 'Bulbasaur',
      def: 20,
      alive: true
    },
    deck: [],
    id: 0,
    name: "Player1",
    HP: 900
  },
  player2: {
    currentPokemon: {
      id: '2',
      atk: 35,
      HP: 100,
      name: 'Charmander',
      def: 20,
      alive: true
    },
    deck: [],
    id: 0,
    name: "Player2",
    HP: 900
  },
  winner: null,
  allPokemon: [],
  selectedPokemonList: []
}

interface PlayerTurn {
  initial: 'executingTurn',
  states: {
    executingTurn: {
      on: {
        SWITCH: {
          guard: 'canSwitchPokemon',
          target: 'calculateNextTurn',
          actions: 'switchPokemon'
        }
      }
    }
    switchPokemon: {},
    resolvingAttack: {}
    calculatingNextTurn: {
      always: [
        { guard: 'isPlayerXDead', target: '#gameOver' },
        { target: '#playing.playerXTurn' }
      ]
    }
  }
}

type playerType = 'player1' | 'player2';

interface HpGuard {
  threshold: number;
  player: playerType;
}

const gameMachine = setup({
  types: {
    context: {} as GameContext,
  },
  actors: {},
  actions: {
    dealDamage: assign(({ context, event }, params: { attacker: playerType, defender: playerType }) => {
      const { attacker, defender } = params;

      if(!context[attacker].currentPokemon || !context[defender].currentPokemon) throw new Error('Pokemon not selected')

      const damage = Math.max(0, context[attacker].currentPokemon.atk - context[defender].currentPokemon.def)

      const newHp = Math.max(0, context[defender].currentPokemon.HP - damage)

      const currentPokemon = {
        ...context[defender].currentPokemon,
        HP: newHp
      }

      const isDead = newHp === 0;

      console.debug({
        damage,
        newHp,
        isDead,
        currentPokemon
      })

      // Well we also need to update for the pokemon go back to the deck as `alive: false`
      return {
        ...context,
        [defender]: {
          ...context[defender],
          currentPokemon: isDead ? null : currentPokemon,
        }
      }
    }),
  },
  guards: {
    canSwitchPokemon: ({ context }) => context.round % 2 ===0 ,
    isHPOverThreshold: ({ context }, params: HpGuard) => {
      const { threshold, player } = params;

      return context[player].HP > threshold;
    }
  },
}).createMachine({
  id: 'game',
  initial: 'idle',
  states: {
    idle: {
      always: 'playing',
    },
    definePlayer: {},
    selectingDeck: {},
    selectingStartingPokemon: {},
    playing: {
      initial: 'player1Turn',
      states: {
        player1Turn: {
          initial: 'executingTurn',
          states: {
            executingTurn: {
              on: {
                switch: {},
                attack: {
                  guard: { type: 'isHPOverThreshold', params: { threshold: 0, player: 'player1' } },
                  actions: { type: 'dealDamage', params: { attacker: 'player1', defender: 'player2' } },
                }
              }
            }
          }
        },
        player2Turn: {},
      }
    },
    gameOver: {}
  },
  context: initialContext
})

const gameActor = createActor(gameMachine);

gameActor.start();

console.log('game actor started', gameActor.getSnapshot().value)

gameActor.send({ type: 'attack' })

console.log('game actor attacked', gameActor.getSnapshot().value)

/* snippets:

executingTurn: {
  on: {
    SWITCH: {
      target: 'calculateNextTurn',
        actions: 'switchPokemon',  // action executa durante a transição
    }
  }
}

resolvingAttack: {
  entry: 'dealDamage',  // action ao ENTRAR no state
  always: 'calculateNextTurn',  // transição imediata
}

 */
