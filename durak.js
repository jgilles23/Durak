//ANCHOR Definitions
import { Box, Root, TextBox, Button, EmptyCard, Card, CardMatrix } from './boxes.js';
//import { State } from './rules.js';
import { Portal } from './server/portal.js';
import { Server } from './server/server.js';
let testing = false;
let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");
let cardWidth = 0.110;
let cardHeight = cardWidth / 0.7;
let pingDelay = 2000; //ms

function sleep(ms) {
    //Sleep function, input in miliseconds
    return new Promise(resolve => setTimeout(resolve, ms))
}

//Game resorcess
let allSuits = ["c", "d", "s", "h"]
let rankToValue = { "6": 6, "7": 7, "8": 8, "9": 9, "T": 10, "J": 11, "Q": 12, "K": 13, "A": 14 }
let allCards = [];
for (let i = 0; i < allSuits.length; i++) {
    for (let rank in rankToValue) {
        allCards.push(rank + allSuits[i])
    }
}

//Human client
export class Client {
    constructor(root, server) {
        //Client for playing durak game
        this.server = server;
        this.state = undefined //this.server.getState(1); //Create new game of durak
        this.root = root; //Store root window
    }
    render() {
        /*Renders the game on the provided window of Root class
        */
        //Helper functions
        function pad(A, val) {
            //Pads an Array with vals to length 6 and returns
            let padded = A.map(x => x);
            for (let i = padded.length; i < 6; i++) { padded.push(val) }
            return padded
        }
        let actionButton = (offset_y, text, onClick) => {
            //Button template
            new Button(playColumn, 0.3, 0.055, { align: "cc", offset_y: offset_y, fillColor: "white" }, text, onClick)
        }
        let getActions = (hand, playableCards) => {
            //get the actions for a set of cards in a hand
            let actionFunctions = hand.map(card => {
                if (playableCards.includes(card)) {
                    return this.reportFactory(card)
                } else {
                    return false
                }
            })
            return actionFunctions
        }
        //Clear the root of any existing information
        this.root.empty();
        let opts;
        //
        //Setup deckColumn items
        let deckColumn = new Box(this.root, 0.25, 1, "tl");
        let player0Box = new Box(deckColumn, 1, 0.25, "tl");
        let player1Box = new Box(deckColumn, 1, 0.25, "br")
        let deck = new EmptyCard(deckColumn, { align: "cc", offset_y: 0.125, fillColor: "darkgrey", clickable: false });
        new TextBox(deck, 0.5, 0.5, "cc", this.state.deck.length)
        let tsar = new Card(deckColumn, { align: "cc", offset_y: -0.125, clickable: false }, this.state.tsar)
        opts = this.state.activePlayer == 0 ? { align: "cc", textColor: "red" } : "cc" //Make active player red
        new TextBox(player0Box, 1, 0.2, opts, "Computer") //"Player 0"
        new TextBox(tsar, 1, 0.2, { align: "bc", offset_y: -1 }, "Tsar")
        new TextBox(deck, 1, 0.2, { align: "bc", offset_y: -1 }, "Deck")
        opts = this.state.activePlayer == 1 ? { align: "cc", textColor: "red" } : "cc" //Make active player red
        new TextBox(player1Box, 1, 0.2, opts, "Human") //"Player 1"
        //
        //Setup play area 
        let playColumn = new Box(this.root, 0.70, 1, { align: "tl", offset_x: 0.25 });
        if (this.state.specialActions.includes("Rematch")) {
            new TextBox(playColumn, 1, 0.2, "cc", "Refresh the page for a rematch.")
            //actionButton(0, "Rematch", this.reportFactory("Rematch"))
        }
        //Setup each players hand and field
        for (let player = 0; player < 2; player++) {
            //Setup variables
            let hand = this.state.hands[player];
            let handOffset = [0.0, 0.75][player]; //Relative to top
            let field = this.state.fields[player];
            let fieldOffset = [0.25, 0.5][player]; //Relative to top
            let buttonOffset = [-0.25, 0.25][player]; //Relative to center
            //Display the player hands
            let actions
            if (player != this.state.activePlayer) {
                actions = hand.map(() => false);
            } else {
                actions = getActions(hand, this.state.cardActions);
            }
            let handWidth = Math.min(1, (deck.w + deck.w * 0.6 * (this.state.hands[player].length - 1)) / playColumn.w);
            let handBox = new CardMatrix(playColumn, handWidth, 0.25, { align: "tc", offset_y: handOffset }, [hand], undefined, [actions]); //hand0
            //Display the player field
            new CardMatrix(playColumn, 1, 0.25, { align: "tc", offset_y: fieldOffset }, [pad(field, "00")], { clickable: false });
            let buttonAction;
            if (player === 1) {
                buttonAction = (text) => this.reportFactory(text);
            } else {
                buttonAction = () => false;
            }
            if (player == this.state.activePlayer) {
                //Show other buttons
                if (this.state.specialActions.includes("Pickup")) {
                    actionButton(buttonOffset, "Pickup", buttonAction("Pickup"))
                }
                if (this.state.specialActions.includes("End Attack")) {
                    actionButton(buttonOffset, "End Attack", buttonAction("End Attack"))
                }
            }
            if (this.state.winner === player) {
                new TextBox(handBox, 0.5, 0.3, "cc", `This Player Wins!`)
            }

        }
    }
    reportFactory(text) {
        //Returns a report function
        return () => this.report(text)
    }
    async report(text) {
        //Send action to the server
        this.state = await this.server.applyAction(1, text);
        //Rener on oppoent play
        this.renderOnMyTurn(pingDelay);
    }
    async renderOnMyTurn(pingDelay) {
        //Check to ensure a ping delay is defined
        if (pingDelay===undefined) {
            throw new Error('pingDelay not defined in renderOnMyTurn.')
        }
        //Function to render the game, then wait for the state of the game to change, then render again
        if (this.state === undefined) {
            this.root.empty();
            new TextBox(this.root, 1, 0.2, { align: "cc" }, "Connecting with Server (please wait up to 30 seconds)");
            //Get the state from the server
            this.state = await this.server.getState(1);
            console.log("First connection to server successful.")
        }
        //Ensure the game is rendered
        this.render()
        if (this.state.activePlayer == 0) {
            //Wait until the server reports new state, then render
            let state = await this.server.getState(1);
            while (this.state.actionCount === state.actionCount) { //TODO Fails if game is refreshed at turn 1
                await sleep(pingDelay);
                state = await this.server.getState(1);
            }
            this.state = state;
            this.render()
            console.log('Awaiting human action. (post)')
        } else {
            console.log('Awaiting human action. (pre)')
        }
    }
}

class MainMenu {
    constructor(root) {
        //Main maenu for Durak game
        this.root = root;
    }
    render() {
        //helper function for creating a client
        const gameCreator = (server, pingDelay) => {
            //Starts a new game of durak
            let client = new Client(root, server);
            client.renderOnMyTurn(pingDelay);
        }
        //Render the menu on the root
        this.root.empty();
        let w = 0.4;
        let h = 0.07;
        new TextBox(this.root, w, h, { align: "tc", offset_y: 0.5 * h }, "Welcome to Durak")
        new TextBox(this.root, w, h, { align: "tc", offset_y: 2 * h }, "Choose Game Type")
        new Button(this.root, w, h, { align: "tc", offset_y: 3 * h }, "Easy Computer", () => { gameCreator(new Server(), 1000) })
        new Button(this.root, w, h, { align: "tc", offset_y: 4.5 * h }, "Medium Computer", () => { gameCreator(new Server(), 1000) })
        new Button(this.root, w, h, { align: "tc", offset_y: 6 * h }, "Online as Player 0", () => { gameCreator(new Portal(), pingDelay) })
        new Button(this.root, w, h, { align: "tc", offset_y: 7.5 * h }, "Online as Player 1", () => { gameCreator(new Portal(), pingDelay) })
    }
}

//Draw function - called over and over
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    root.draw();
    requestAnimationFrame(draw);
}

//Setup canvas
let a = Math.min(window.innerWidth, window.innerHeight)
canvas.width = a * 0.9;
canvas.height = a * 0.9;
//Setup the root on the canvas
let root = new Root(canvas, 1, 1, { align: "tl", cardWidth: cardWidth, cardHeight: cardHeight, testing: testing });

//Prepare and render the main menu
let mainMenu = new MainMenu(root);
mainMenu.render();

//Call draw function -- contant calls
draw();


/*
let portal = new Portal();
let returned = await portal.getState(undefined);
console.log("returned",returned)
*/
