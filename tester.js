//File for testing items related to the AI functions
import { State } from './rules.js';
import { RandomAI, HeuristicAI, EndgameAI } from './ai.js';

// let state = new State();
// let s = state.strip();
// s.deck = [];
// for (let player = 0; player < 2; player++) {
//     s.hands[player] = s.hands[player].slice(0, 6)
// }
// state = new State(s)
// state.getActions();
// //state.print();

// let computer = new EndgameAI();
// let action = await computer.selectAction(state);
// console.log('Selected Action:',action)


async function hostGame(players, verbose) {
    //Host a game between 2 AI players, use simple prints, (not UI based)
    if (verbose) { console.log("NEW GAME") };
    let state = new State();
    while (state.winner === undefined && state.actionCount < 200) {
        if (verbose) { state.print(true, true) };
        //Let the ai choose an action
        let aiAction = await players[state.activePlayer].selectAction(state.strip(state.activePlayer));
        if (verbose) { console.log(`Player${state.activePlayer} action: ${aiAction}`) };
        //apply the action
        state.applyAction(aiAction);

    }
    if (verbose) { console.log(`WINNER ${state.winner} ${players[state.winner].constructor.name}`) };
    return state.winner;
}

async function battle(playerClasses, iterations) {
    //Input classes callable with new Class()
    //iterations defines the number of games to host
    let games = [];
    for (let i = 0; i < iterations; i++) {
        let players = playerClasses.map(x => new x());
        games.push(hostGame(players, false))
    }
    let winners = await Promise.all(games);
    //Count the outcomes of the games - winner 0,1,undefined
    let results = {0:0, 1:0, undefined:0};
    winners.forEach(x => {
        results[x] += 1;
    })
    console.log(results)
}

battle([RandomAI, HeuristicAI], 10);
//hostGame([new RandomAI(),new EndgameAI()], true)
new RandomAI(0,"Pants","Shoes")