//ANCHOR Definitions
import {Box,Root,TextBox,Button,EmptyCard,Card,CardMatrix} from './boxes.js'
let testing = false;
let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");
let cardWidth = 0.115;
let cardHeight = cardWidth / 0.7;
let initialDeckSize = 10; //Default and max is 36



//ANCHOR Handlers

//Game resorcess
let allSuits = ["c", "d", "s", "h"]
let rankToValue = { "6": 6, "7": 7, "8": 8, "9": 9, "T": 10, "J": 11, "Q": 12, "K": 13, "A": 14 }
let allCards = [];
for (let i = 0; i < allSuits.length; i++) {
    for (let rank in rankToValue) {
        allCards.push(rank + allSuits[i])
    }
}
//Helper functions
function valOf(x) { return rankToValue[x.charAt(0)] }
//ANCHOR Game Class
class Game {
    constructor(root) {
        /* Holds all information related to the state of durak, holds functions needed to play durak
        -root - Root class (of Box class) a window on which the game will be rendered
        */
        //Save the windows on which the game is to be rendered
        this.root = root;
        //Create and randomize the deck
        let randNums = {}
        allCards.forEach(x => {
            randNums[x] = Math.random();
        });
        this.deck = allCards.map(x => x);
        this.deck.sort((a, b) => randNums[a] - randNums[b]);
        this.deck = this.deck.slice(0,initialDeckSize)
        //Draw tsar card
        this.tsar = this.pick();
        //Draw hands and sort
        this.hand0 = [];
        this.hand1 = [];
        this.drawToSix(); //includes sort
        //Create the fields
        this.field0 = [];
        this.field1 = [];
        //Choose attacker
        this.attacker = 0;
        //Finally update -> render
        this.update();
    }
    //ANCHOR Game helper functions
    hand(player) { return player == 0 ? this.hand0 : this.hand1 }
    field(player) { return player == 0 ? this.field0 : this.field1 }
    actions(player) { return player == 0 ? this.actions0 : this.actions1 }
    otherPlayer(player) { return player == 0 ? 1 : 0 }
    get defender() { return this.otherPlayer(this.attacker) }
    pad(A, val) {
        //Pads an Array with vals to length 6 and returns
        let padded = A.map(x => x);
        for (let i = padded.length; i < 6; i++) {
            padded.push(val);
        }
        return padded;
    }
    pick() {
        //Draw a card
        return this.deck.pop()
    }
    drawToSix() {
        ////Draw back up to 6 cards and sort the hand
        for (let i = 0; i < 6; i++) {
            //Attacker draws a card
            if (this.hand(this.attacker).length < 6 && this.deck.length > 0) {
                this.hand(this.attacker).push(this.pick())
            }
            //Then defender draws a card
            if (this.hand(this.defender).length < 6 && this.deck.length > 0) {
                this.hand(this.defender).push(this.pick())
            }
        }
        //Sort hand
        this.sortHands();
    }
    sortHands() {
        //Sort both hands in suit order
        function suitValue(x) { return allSuits.indexOf(x.charAt(1)) }
        function totalValue(x) { return 100 * suitValue(x) + valOf(x) }
        function compare(a, b) { return totalValue(a) - totalValue(b) }
        this.hand0.sort(compare);
        this.hand1.sort(compare);
    }
    get activeAction() {
        //Return the active action either "attacking" or "defending"
        if (this.field(this.attacker).length > this.field(this.defender).length) {
            return "defend";
        } else {
            return "attack";
        }
    }
    get activePlayer() {
        //Return the player number of the active player
        if (this.activeAction == "attack") {
            return this.attacker;
        } else {
            return this.defender;
        }
    }
    get inactivePlayer() {
        //Return the player whos turn it isnt
        return this.otherPlayer(this.activePlayer)
    }
    valOf(card) { return rankToValue[card.charAt(0)] }
    suitOf(card) { return card.charAt(1) }
    get tsarSuit() {
        return this.tsar.charAt(1)
    }
    nextAttacker() {
        //Step to the next turn, discard the field
        this.field0 = [];
        this.field1 = [];
        //Change the active player
        this.attacker = this.otherPlayer(this.attacker);
        //Draw up to 6, sort
        this.drawToSix();
    }
    //ANCHOR Game onClick functions to apply to cards
    playFromHand(player, cardPosition) {
        //Generates a function, that when called plays a card from the players hand
        return () => {
            let card = this.hand(player)[cardPosition];
            //Put the card in the field
            this.field(player).push(card);
            //Remove from hand,
            this.hand(player).splice(cardPosition, 1);
            this.actions(player).splice(cardPosition, 1)
            //Update the game because of changes
            //console.log("Played: " + card);
            //Refresh
            this.update();
        }
    }
    pickupField(player) {
        //Generates a funcation that when called picks up cards from the field and places in players hand
        return () => {
            this.field0.forEach(card => this.hand(player).push(card));
            this.field1.forEach(card => this.hand(player).push(card));
            this.field0 = [];
            this.field1 = [];
            //Draw to 6, sort
            this.drawToSix();
            //Refresh
            this.update();
        }
    }
    endAttack() {
        //Generates a funciton that when called ends the attack for a player, field is discarded
        return () => {
            this.nextAttacker();
            //Refresh
            this.update();
        }
    }
    newGame() {
        return () => {
            this.root.empty();
            new Game(this.root);
            //HALT this game
        }
    }

    //ANCHOR Game update
    update() {
        /*Updates the game given the current state of the game
        Updates include: avaliable actions, cleanup, gameOver
        Finally calls this.render()
        */
        //Sort hands
        this.sortHands()
        //Clear previous actions
        this.actions0 = [];
        this.actions1 = [];
        //Create visual flags
        this.pickup = [false, false];
        this.endButton = [false, false];
        this.winner = undefined;
        //Check if the game is over
        if (this.deck.length == 0) {
            //Don't think there is a possibility of a tie, cards always discarded in pairs, odd number of cards once the tsar is excuded - kinda brillient
            if (this.hand0.length == 0) { this.winner = 0 } //player0 wins
            if (this.hand1.length == 0) { this.winner = 1 } //player1 wins
            if (this.winner !== undefined) {
                console.log("winner", this.winner)
                //Everything becomes unclickable
                this.hand0.forEach(() => this.actions0.push(false));
                this.hand1.forEach(() => this.actions1.push(false));
                //Render
                this.render()
                return //Do not continue update, render without buttons and not clickable
            }
        }
        //No actions for inactive player
        this.hand(this.inactivePlayer).forEach(() => this.actions(this.inactivePlayer).push(false));
        //Define some useful variables
        let hand = this.hand(this.activePlayer);
        let field = this.field(this.activePlayer);
        let actions = this.actions(this.activePlayer);
        //Determine what action the active player can take
        if (this.activeAction == "defend") {
            //DEFEND
            //Acceptable defender actions
            this.pickup[this.activePlayer] = true; //Defender can always pick up
            for (let i = 0; i < hand.length; i++) {
                //Prepare onClick function
                let onClick = this.playFromHand(this.activePlayer, i)
                //Test wich cards can be played, helper functions below
                let card = hand[i];
                let enemy = this.field(this.attacker).slice(-1)[0];
                if (this.suitOf(card) == this.suitOf(enemy)) {
                    //Same suit, value must be higher
                    if (this.valOf(card) > this.valOf(enemy)) {
                        actions.push(onClick);
                    } else {
                        actions.push(false);
                    }
                } else if (this.suitOf(card) == this.tsarSuit) {
                    //Tsar suit can always be played
                    actions.push(onClick);
                } else {
                    //Different suits cannot be played
                    actions.push(false);
                }
            }
        } else {
            //ATTACK
            //Attacker has all actions avaliable
            for (let i = 0; i < hand.length; i++) {
                let card = hand[i];
                if (field.length === 0) {
                    //Can play any card a 1st card
                    actions.push(this.playFromHand(this.activePlayer, i));
                } else if (field.length >= 6) {
                    //Cannot play card, field is full
                    actions.push(false)
                } else {
                    //Check if the value matches an already played value
                    let playedValues = new Set();
                    this.field0.forEach(x => playedValues.add(this.valOf(x)))
                    this.field1.forEach(x => playedValues.add(this.valOf(x)))
                    if (playedValues.has(this.valOf(card))) {
                        //Value has been played, playable
                        actions.push(this.playFromHand(this.activePlayer, i));
                    } else {
                        //Cannot play, value does not match previously played value
                        actions.push(false)
                    }
                }
            }
            //Attacker can end attack after playing at least 1 card
            if (field.length > 0) {
                this.endButton[this.attacker] = true;
            }
        }
        //Finally call this.render() to re-fresh the window
        this.render()
    }
    //Check if the game is over 
    //ANCHOR Game render
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
        //Clear the root of any existing information
        this.root.empty();
        let opts;
        //Setup deckColumn items
        let deckColumn = new Box(this.root, 0.25, 1, "tl");
        let player0Box = new Box(deckColumn, 1, 0.25, "tl");
        let player1Box = new Box(deckColumn, 1, 0.25, "br")
        let deck = new EmptyCard(deckColumn, { align: "cc", offset_y: 0.125, fillColor: "darkgrey", clickable: false });
        new TextBox(deck, 0.5, 0.5, "cc", this.deck.length)
        let tsar = new Card(deckColumn, { align: "cc", offset_y: -0.125, clickable: false }, this.tsar)
        opts = this.activePlayer == 0 ? { align: "cc", textColor: "red" } : "cc" //Make active player red
        new TextBox(player0Box, 1, 0.2, opts, "Player 0") //"Player 0"
        new TextBox(tsar, 1, 0.2, { align: "bc", offset_y: -1 }, "Tsar")
        new TextBox(deck, 1, 0.2, { align: "bc", offset_y: -1 }, "Deck")
        opts = this.activePlayer == 1 ? { align: "cc", textColor: "red" } : "cc" //Make active player red
        new TextBox(player1Box, 1, 0.2, opts, "Player 1") //"Player 1"
        //Button template
        let actionButton = (offset_y, text, onClick) => { new Button(playColumn, 0.3, 0.055, { align: "cc", offset_y: offset_y, fillColor: "white" }, text, onClick) }
        //Setup play area 
        let playColumn = new Box(this.root, 0.75, 1, "tr");
        if (this.winner !== undefined) { actionButton(0, "Rematch", this.newGame()) }
        //Hand0
        console.log("cardWidth, playColumn.w",cardWidth, playColumn.w)
        let hand0Width = Math.min(1, (deck.w + deck.w * 0.6 * (this.hand0.length - 1)) / playColumn.w);
        let hand0 = new CardMatrix(playColumn, hand0Width, 0.25, "tc", [this.hand0], undefined, [this.actions0]); //hand0
        if (this.pickup[0]) { actionButton(-0.25, "Pickup", this.pickupField(0)) } //pickup0
        if (this.endButton[0]) { actionButton(-0.25, "End Attack", this.endAttack()) } //end0
        if (this.winner === 0) { new TextBox(hand0, 0.5, 0.3, "cc", "Player0 Wins") }
        //Fields required
        new CardMatrix(playColumn, 1, 0.25, { align: "tc", offset_y: 0.25 }, [pad(this.field0, "00")], { clickable: false }); //field0
        new CardMatrix(playColumn, 1, 0.25, { align: "tc", offset_y: 0.5 }, [pad(this.field1, "00")], { clickable: false }); //field1
        //Hand1
        let hand1Width = Math.min(1, (deck.w + deck.w * 0.6 * (this.hand1.length - 1)) / playColumn.w);
        let hand1 = new CardMatrix(playColumn, hand1Width, 0.25, "bc", [this.hand1], undefined, [this.actions1]); //hand1
        if (this.pickup[1]) { actionButton(0.25, "Pickup", this.pickupField(1)) } //pickup1
        if (this.endButton[1]) { actionButton(0.25, "End Attack", this.endAttack()) } //end1
        if (this.winner === 1) { new TextBox(hand1, 0.5, 0.3, "cc", "Player1 Wins") }
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

console.log(EmptyCard.test)

let root = new Root(canvas ,0.95, 0.95, {align:"cl",cardWidth:cardWidth,cardHeight:cardHeight, testing:testing});
let g = new Game(root);
root.game = g;
draw();