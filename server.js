import {State} from './rules.js'
import {RandomAI} from './ai.js'

export class Server {
    constructor() {
        //Server for hosting the game of durak
        console.log("NEW GAME")
        this.state = new State();
        this.ai = new RandomAI();
        //If the AI starts, play AI action
        if (this.state.activePlayer == 0) {
            this.applyAIAction();
        }
    }
    getState(player) {
        //Get the state of the board for what a particular player can see, player=undefined to return all information
        return this.state.strip(player);
    }
    applyAction(text) {
        //Apply an action that is given to the server
        //Play the human action
        console.log("Human Action:", text);
        this.state.applyAction(text);
        //Play the AI action
        this.applyAIAction();
    }
    async applyAIAction() {
        //Apply an AI action
        const aiAction = await this.ai.selectAction(this.getState(0));
        //const aiAction = await this.ai.resolveAfter2Seconds("Test 2")
        console.log('Computer Action:', aiAction); //STUB
        this.state.applyAction(aiAction);
    }
}