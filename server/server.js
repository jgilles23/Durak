
import { State } from './../rules.js';
import { RandomAI, HeuristicAI } from './../ai.js';

function sleep(ms) {
    //Sleep function, input in miliseconds
    return new Promise(resolve => setTimeout(resolve, ms))
}

export class Server {
    constructor(verbose) {
        //Server for hosting the game of durak
        this.newGame();
    }
    newGame() {
        console.log("NEW GAME")
        this.state = new State();
        this.ai = new HeuristicAI(undefined); //Place the time for server to take an action here 
        //If the AI starts, play AI action
        if (this.state.activePlayer == 0) {
            this.applyAIAction();
        }
    }
    getState(player) {
        //Get the state of the board for what a particular player can see, player=undefined to return all information
        if (player === "undefined") { player = undefined }
        return this.state.strip(player);
    }
    applyAction(player, action) {
        //Apply an action that is given to the server
        //Play the human action
        console.log(`Player ${player} Action:`, action);
        if (action.substring(0, 4) == "Meta") {
            if (action == "Meta Rematch") {
                this.newGame();
            }
        } else {
            this.state.applyAction(action);
            //Play the AI action
            this.applyAIAction();
        }
    }
    async applyAIAction() {
        //Apply an AI action
        const aiAction = await this.ai.selectAction(this.getState(0));
        console.log('Waiting 0/1 sec');
        await sleep(1000);
        console.log('Computer Action:', aiAction); //STUB
        this.state.applyAction(aiAction);
    }
}