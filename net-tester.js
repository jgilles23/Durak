import { Box, Root, TextBox, Button, EmptyCard, Card, CardMatrix } from './boxes.js';
//import { State } from './rules.js';
import { Server, NetServer, NetPortal } from './server.js';

function sleep(ms) {
    //Sleep function, input in miliseconds
    return new Promise(resolve => setTimeout(resolve, ms))
}

let server = new NetServer();
let portal = new NetPortal();

let response = await portal.getState(0);
console.log(response)
