/*
Defines the durak state object and 
*/
//Definitions
let initialDeckSize = 36; //Normal game is 36 cards

//Create a set of the avaliable cards
let allSuits = ["c", "d", "s", "h"]
let rankToValue = { "6": 6, "7": 7, "8": 8, "9": 9, "T": 10, "J": 11, "Q": 12, "K": 13, "A": 14 }
export let allCards = [];
for (let i = 0; i < allSuits.length; i++) {
    for (let rank in rankToValue) {
        allCards.push(rank + allSuits[i])
    }
}
//Some helper functions
export function valOf(card) { return rankToValue[card.charAt(0)] }
export function suitOf(card) { return card.charAt(1) }
function copy_A_to_B(A, B) {
    //Copy from State class A to State class B
    B.deck = [...A.deck];
    B.discard = [...A.discard];
    B.hands = A.hands.map(hand => [...hand]);
    B.fields = A.fields.map(field => [...field]);
    B.tsar = A.tsar;
    B.attacker = A.attacker;
    //B.activePlayer = A.activePlayer;
    B.winner = A.winner;
    B.cardActions = [...A.cardActions];
    B.specialActions = [...A.specialActions];
    B.actionCount = A.actionCount;
    B.lastAction = A.lastAction;
    //Does not return a B is modified in place
}

//Class for holding and manipulating the current state of the game
export class State {
    constructor(prototype) {
        /*Setup a current state of a game of durak
        Input: prototype:
            - if undefined - new game of durak created
            - if State class or stripped - creates copy of object
        */
        if (prototype === undefined) {
            this.deck = [];
            this.discard = [];
            this.makeDeck(); //this.deck = [...]
            this.hands = [[], []];
            this.fields = [[], []];
            this.tsar = this.deck.pop();
            this.attacker = Math.round(Math.random()); //Start with random player
            this.winner = undefined;
            this.drawToSix(); //6 cards each player hand
            //Variables in which to store actions
            this.cardActions = [];
            this.specialActions = [];
            //Store the action number of the game
            this.actionCount = 0;
            this.lastAction = undefined;
            //Get the actions
            this.getActions();
        } else {
            copy_A_to_B(prototype, this)
        }
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
        this.actionCount += 1;
        this.getActions();
    }
    pickupField() {
        //Pickup the field and draw to 6 cards
        this.fields.forEach(field => field.forEach(card => this.activeHand.push(card)));
        this.fields = [[], []];
        this.drawToSix();
        this.actionCount += 1;
        this.getActions();
    }
    endAttack() {
        //Next player is the attacker
        this.discard.push(...this.fields[0]);
        this.discard.push(...this.fields[1]);
        this.fields = [[], []];
        this.attacker = this.defender;
        this.drawToSix();
        this.actionCount += 1;
        this.getActions();
    }
    newGame() {
        this.actionCount += 1;
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
        //Save the most recent action
        this.lastAction = text;
    }
    strip(player) {
        //Strips all information and returns a stripped object for the indicated player, if player = undefined, will return informaiton for both players
        this.sortHands();
        let stripped = {};
        copy_A_to_B(this, stripped);
        stripped.activePlayer = this.activePlayer;
        //Remove information that the player should not have
        if (player != undefined) {
            stripped.deck = this.deck.map(() => "0B");
            stripped.hands[this.otherPlayer(player)] = this.hands[this.otherPlayer(player)].map(() => "0B");
            if (player != this.activePlayer) {
                stripped.cardActions = [];
                //stripped.specialActions = [];
            }
        }
        return stripped
    }
    //Hashes the current game state and returns
    hash() {
        this.sortHands();
        let compress = (x) => x.map(y => y.join("")).join(",");
        let str = `h:${compress(state.hands)} f:${compress(state.fields)} d:${this.deck.length}`;
        return str;
    }
    //Makes Copy
    copy() {
        //Make a copy of this game of durak, useful for AIs
        return new State(this);
    }
    //Prints the current state to the console
    print(multiline,log) {
        let str = '';
        //Print state to console, if multiline is truthy makes print easier to read, if log is false, will not auto print
        if (multiline) {
            str += `Durak: action ${this.actionCount}, tsar ${this.tsar}, deck ${this.deck.length},  discard ${this.discard.length}, last ${this.lastAction}, winner ${this.winner}\n`
            //str += ` ${this.deck}\n`
            str += ` ${this.activePlayer == 0 ? "*" : " "}hand0: ${this.hands[0]}\n`
            str += `  field: ${this.fields[0]}\n`
            str += `  field: ${this.fields[1]}\n`
            str += ` ${this.activePlayer == 1 ? "*" : " "}hand1: ${this.hands[1]}\n`
            str += `  actions: (${this.cardActions}) | (${this.specialActions})`
        }
        else {
            str += `Durak<${this.actionCount}>: tsar ${this.tsar}, deck ${this.deck.length}, winner ${this.winner}, active ${this.activePlayer}, hands (${this.hands[0]}) (${this.hands[1]}), fields (${this.fields[0]}) (${this.fields[1]}), actions (${this.cardActions}) (${this.specialActions})`
        }
        if (log !== false) {
            console.log(str)
        }
        return str
    }
}