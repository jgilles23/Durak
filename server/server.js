
import { State } from './../rules.js';
import { RandomAI, HeuristicAI } from './../ai.js';

function sleep(ms) {
    //Sleep function, input in miliseconds
    return new Promise(resolve => setTimeout(resolve, ms))
}

export class Server {
    constructor(player0 = "Human", player1 = "Human") {
        //Choose ai from opponent, default is Human player, aka no AI is assigned
        this.player0 = player0;
        this.player1 = player1;
        //Server for hosting the game of durak
        this.newGame();
    }
    newGame() {
        console.log("Server: NEW GAME")
        this.state = new State();
        //If the AI starts, play AI action
        this.applyAIAction();
    }
    getState(player) {
        //Get the state of the board for what a particular player can see, player=undefined to return all information
        if (player === "undefined") { player = undefined }
        return this.state.strip(player);
    }
    applyAction(player, action) {
        //Apply an action that is given to the server
        //Play the human action
        console.log(`Server: Player ${player} Action:`, action);
        if (action.substring(0, 4) == "Meta") {
            if (action == "Meta Rematch") {
                this.newGame();
            } else if (action == "Meta New Game") {
                this.newGame();
            } else {
                throw Error(`Unhandled meta action in Server.applyAction: ${action}`)
            }
        } else {
            this.state.applyAction(action);
            //Play the AI action
            this.applyAIAction();
        }
        return this.getState(player);
    }
    async applyAIAction() {
        //Apply an AI action, for either player
        //Catch situation at end of game
        if (this.state.winner !== undefined) {
            console.log('Server: The game is over.')
            return
        }
        let quit = false;
        while (quit === false) {
            if (this.state.activePlayer === 0 && this.player0 != "Human") {
                const aiAction = await this.player0.selectAction(this.getState(0));
                console.log('Server: Computer 0 Action:', aiAction); //STUB
                this.state.applyAction(aiAction);
            } else if (this.state.activePlayer === 1 && this.player1 != "Human") {
                const aiAction = await this.player1.selectAction(this.getState(0));
                console.log('Server: Computer 1 Action:', aiAction); //STUB
                this.state.applyAction(aiAction);
            } else {
                console.log('Server: Awaiting human action.')
                quit = true;
            }
        }
    }
}