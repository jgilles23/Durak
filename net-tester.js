import { Server, NetServer, NetPortal } from './server.js';
import { State } from "./rules.js"
import { RandomAI } from "./ai.js"

function sleep(ms) {
    //Sleep function, input in miliseconds
    return new Promise(resolve => setTimeout(resolve, ms))
}

//Setup the portal for talking to the server
console.log("waiting")
await sleep(200);
console.log("done waiting")
let portal = new NetPortal();

//Setup a random ai
let P = new RandomAI(undefined);

let response
let state
//Get the current state of the system
response = await portal.getState(undefined);
state = new State(response);
state.print(true);

do {
    //Return a selected action
    let action = await P.selectAction(state)
    console.log("applying action", action)
    response = await portal.applyAction(1, action)
    state = new State(response);
    state.print(true);

    await sleep(100)
    //Get the current state of the system
    response = await portal.getState(undefined);
    state = new State(response);
    state.print(true);
} while (state.winner === undefined)