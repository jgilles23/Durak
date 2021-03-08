/*
Defines the durak state object and 
*/
//Definitions
let initialDeckSize = 10;

//Create a set of the avaliable cards
let allSuits = ["c", "d", "s", "h"]
let rankToValue = { "6": 6, "7": 7, "8": 8, "9": 9, "T": 10, "J": 11, "Q": 12, "K": 13, "A": 14 }
let allCards = [];
for (let i = 0; i < allSuits.length; i++) {
    for (let rank in rankToValue) {
        allCards.push(rank + allSuits[i])
    }
}
//Some helper functions
function valOf(card) { return rankToValue[card.charAt(0)] }
function suitOf(card) { return card.charAt(1) }
//Class for holding and manipulating the current state of the game
export class State {
    constructor() {
        //State of Durak Game
        this.makeDeck(); //this.deck = [...]
        this.hands = [[], []];
        this.fields = [[], []];
        this.tsar = this.deck.pop();
        this.attacker = 0;
        this.winner = undefined;
        this.drawToSix(); //6 cards each player hand
        //Variables in which to store actions
        this.cardActions = [];
        this.specialActions = [];
        //Get the actions
        this.getActions();
    }
    //Useful properties
    otherPlayer(player) { return player == 1 ? 0 : 1 }
    get defender() { return this.otherPlayer(this.attacker) }
    get attackerHand() { return this.hands[this.attacker] }
    get defenderHand() { return this.hands[this.defender] }
    get attackerField() { return this.fields[this.attacker] }
    get defenderField() { return this.fields[this.defender] }
    get activePlayer() {
        return this.attackerField.length > this.defenderField.length ? this.defender : this.attacker
    }
    get inactivePlayer() { return this.otherPlayer(this.activePlayer) }
    get activeHand() { return this.hands[this.activePlayer] }
    get activeField() { return this.fields[this.activePlayer] }
    //Basic actions
    makeDeck() {
        //Create and randomize the deck
        let randNums = {}
        allCards.forEach(x => {
            randNums[x] = Math.random();
        });
        this.deck = allCards.map(x => x);
        this.deck.sort((a, b) => randNums[a] - randNums[b]);
        this.deck = this.deck.slice(0, initialDeckSize)
    }
    drawToSix() {
        //Each player draws to 6 cards
        for (let i = 0; i < 6; i++) {
            //Attacker hand, then defender hand draw cards in order
            let bothHands = [this.attackerHand, this.defenderHand];
            bothHands.forEach(hand => {
                if (hand.length < 6 && this.deck.length > 0) {
                    hand.push(this.deck.pop());
                }
            })
        }
    }
    sortHands() {
        function suitValue(x) { return allSuits.indexOf(x.charAt(1)) }
        function totalValue(x) { return 100 * suitValue(x) + valOf(x) }
        function compare(a, b) { return totalValue(a) - totalValue(b) }
        this.hands.forEach(hand => hand.sort(compare));
    }
    //Action actions
    playCard(card) {
        //Add card to the field, remove from hand
        this.activeHand.splice(this.activeHand.indexOf(card), 1);
        this.activeField.push(card);
        this.getActions();
    }
    pickupField() {
        //Pickup the field and draw to 6 cards
        this.fields.forEach(field => field.forEach(card => this.activeHand.push(card)));
        this.fields = [[], []];
        this.drawToSix();
        this.getActions();
    }
    endAttack() {
        //Next player is the attacker
        this.fields = [[], []];
        this.attacker = this.defender;
        this.drawToSix();
        this.getActions();
    }
    newGame() {
        let newState = new State()
        for (let key in newState) {
            this[key] = newState[key];
        }
    }
    //Client actions to be called
    getActions() {
        //Establish the variables
        this.cardActions = [];
        this.specialActions = [];
        //Check if game is over
        if (this.deck.length == 0) {
            if (this.hands[0].length == 0) { this.winner = 0 } //player0 wins
            if (this.hands[1].length == 0) { this.winner = 1 } //player1 wins
            if (this.winner != undefined) {
                this.specialActions.push("Rematch")
                return //Do not continue, game over
            }
        }
        if (this.attacker == this.activePlayer) {
            //Attacker actions
            if (this.attackerField.length == 0) {
                //All actions avaliable on first turn
                this.cardActions = this.attackerHand;
                return
            }
            //Only matching cards allowed
            this.specialActions.push('End Attack')
            let playedValues = new Set()
            this.fields.forEach(field => field.forEach(x => playedValues.add(valOf(x))))
            this.attackerHand.forEach(card => {
                if (playedValues.has(valOf(card))) {
                    this.cardActions.push(card)
                }
            })
        } else {
            //Defender actions
            this.specialActions.push("Pickup")
            let enemy = this.fields[this.attacker].slice(-1)[0];
            this.defenderHand.forEach(card => {
                if (suitOf(card) == suitOf(enemy)) {
                    //Same suit, value must be higher
                    if (valOf(card) > valOf(enemy)) {
                        this.cardActions.push(card);
                    }
                } else if (suitOf(card) == suitOf(this.tsar)) {
                    //Tsar suit can always be played
                    this.cardActions.push(card);
                }
            })
        }

    }
    applyAction(text) {
        //Apply the action indicated by the text
        if (this.cardActions.includes(text)) {
            //Play the card from the text
            this.playCard(text);
        } else if (this.specialActions.includes(text)) {
            //Apply special actions
            if (text == "Pickup") {
                this.pickupField();
            } else if (text == "End Attack") {
                this.endAttack();
            } else if (text == "Rematch") {
                this.newGame();
            }
        } else {
            throw "Attempted to play illegal action: " + text;
        }
    }
}