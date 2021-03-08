//ANCHOR Definitions
import { Box, Root, TextBox, Button, EmptyCard, Card, CardMatrix } from './boxes.js'
import { State } from './rules.js'
let testing = false;
let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");
let cardWidth = 0.115;
let cardHeight = cardWidth / 0.7;

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
    constructor(root) {
        //Client for playing durak game
        this.state = new State(); //Create new game of durak
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
        new TextBox(player0Box, 1, 0.2, opts, "Player 0") //"Player 0"
        new TextBox(tsar, 1, 0.2, { align: "bc", offset_y: -1 }, "Tsar")
        new TextBox(deck, 1, 0.2, { align: "bc", offset_y: -1 }, "Deck")
        opts = this.activePlayer == 1 ? { align: "cc", textColor: "red" } : "cc" //Make active player red
        new TextBox(player1Box, 1, 0.2, opts, "Player 1") //"Player 1"
        //
        //Setup play area 
        let playColumn = new Box(this.root, 0.75, 1, "tr");
        if (this.state.specialActions.includes("Rematch")) {
            actionButton(0, "Rematch", this.reportFactory("Rematch"))
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
            if (player == this.state.activePlayer) {
                //Show other buttons
                if (this.state.specialActions.includes("Pickup")) {
                    actionButton(buttonOffset, "Pickup", this.reportFactory("Pickup"))
                }
                if (this.state.specialActions.includes("End Attack")) {
                    actionButton(buttonOffset, "End Attack", this.reportFactory("End Attack"))
                }
                if (this.winner === player) {
                    new TextBox(handBox, 0.5, 0.3, "cc", `Player${player} Wins`)
                }
            }

        }
    }
    reportFactory(text) {
        //Returns a report function
        return () => this.report(text)
    }
    report(text) {
        console.log("Pressed:", text);
        this.state.applyAction(text);
        this.render();
        console.log(this.state); //STUB
    }
}

//ANCHOR Draw function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    root.draw();
    requestAnimationFrame(draw);
}

//ANCHOR Assets
let a = Math.min(window.innerWidth, window.innerHeight)
canvas.width = a * 0.9;
canvas.height = a * 0.9;

let root = new Root(canvas, 0.95, 0.95, { align: "cl", cardWidth: cardWidth, cardHeight: cardHeight, testing: testing });
let client = new Client(root);
client.render();
console.log(client)
console.log(client.state)
draw();

