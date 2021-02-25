//ANCHOR Definitions
let testing = false;
let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");
let cardWidth = 0.115;
let cardHeight = cardWidth / 0.7;

//ANCHOR Options Handler
function updateOptions(input, defaults, args) {
    //Updates options for the following priority:
    //0) arguments (where not undefined) 1) user provided inputs 2) higher class defaults 3) lower class defaults
    let options = defaults;
    if (typeof input == "string") {
        options.align = input;
    } else {
        for (let key in input) {
            options[key] = input[key];
        }
    }
    //overide with supers where supers are defined
    if (args != undefined) {
        for (let key in args) {
            if (args[key] != undefined) {
                options[key] = args[key];
            }
        }
    }
    return options
}

//ANCHOR Box Class
//Class for objects that are drawn and have things drawn in them
class Box {
    constructor(parent, w, h, options) {
        /*Makes a box object, the super class for all other objects in Durak
        All stored values are in pixles relative to the canvas
        Defaults are marked with *
        -parent - parent Box class, if undefined will make a root box
        -w - width, (default is "norm" type)
        -h - height, (default is "norm" type)
        -options - can be string or object
            as string* - "[t*,b,c][l*,r,c]" placement of Box in parent
            as object - {
                align = "[t*,b,c][l*,r,c]", 
                wh_type = "[norm* (0.0 to 1.0 relative to parent), pixles, root (0.0 to 1.0 relative to root)]"} - modifies width and height
        */
        //Setup parameters
        let defaults = {
            isRoot: false,
            align: "tl",
            whType: "norm",
            xyType: "norm",
            offset_x: 0,
            offset_y: 0,
            strokeColor: testing ? "red" : undefined,
            fillColor: undefined,
            children: [],
            mouseFocus: false //only (1) object should ever have mouse focus true
        }
        options = updateOptions(options, defaults);
        //Copy the parameters to the class -- Happens in Box class only
        for (const key in options) {
            this[key] = options[key];
        }
        //Setup for root vs. non-root Box
        if (this.isRoot) {
            this.parent = this;
            this.root = this;
        } else {
            this.parent = parent;
            this.root = parent.root;
            this.parent.children.push(this);
        }
        //Setup other parameters from hard typed inputes
        this.input_w = w;
        this.input_h = h;
        this.children = [];
        //Transfer options
        if (options === undefined) { //If options not provided
            options = "tl"
        }
        if (typeof options == "string") { //If options is align string
            this.align = options;
        } else { //Many options are provided and should be set
            for (const key in options) {
                this[key] = options[key]
            }
        }
        //Choose the anchor for further calculations
        let anchor;
        if (this.isRoot) {
            anchor = { x: 0, y: 0, w: canvas.width, h: canvas.height }
        } else if (this.whType == "norm") {
            anchor = this.parent
        } else if (this.whType == "root") {
            anchor = this.root
        } else {
            throw ".whType not valid: " + this.whType;
        }
        //Calcualte the width and height
        this.w = anchor.w * w;
        this.h = anchor.h * h;
        //Choose new anchor for x and y position calculations
        if (this.isRoot) {
            anchor = { x: 0, y: 0, w: canvas.width, h: canvas.height }
        } else if (this.xyType == "norm") {
            anchor = this.parent;
        } else if (this.xyType == "root") {
            anchor = this.root;
        } else {
            throw ".xyType not valid: " + this.xyType;
        }
        //Calculate y position
        if (this.align.charAt(0) == "t") {
            this.y = anchor.y;
        } else if (this.align.charAt(0) == "b") {
            this.y = anchor.y + anchor.h - this.h;
        } else if (this.align.charAt(0) == "c") {
            this.y = anchor.y + anchor.h / 2 - this.h / 2;
        } else {
            throw ".align not valid: " + this.align;
        }
        //Calculate x position
        if (this.align.charAt(1) == "l") {
            this.x = anchor.x;
        } else if (this.align.charAt(1) == "r") {
            this.x = anchor.x + anchor.w - this.w;
        } else if (this.align.charAt(1) == "c") {
            this.x = anchor.x + anchor.w / 2 - this.w / 2;
        } else {
            throw ".align not valid: " + this.align;
        }
        //Add offsets if applicable
        this.y += this.offset_y * anchor.h;
        this.x += this.offset_x * anchor.w;
    }
    //get methods for commonly used parameters
    get mid_x() { //center of x position
        return this.x + this.w / 2;
    }
    get mid_y() { //Center of y position
        return this.y + this.h / 2;
    }
    get right() { //Right bound
        return this.x + this.w;
    }
    get bottom() { //bottom bound
        return this.y + this.h;
    }
    //Method to draw a box
    draw() {
        //Draw this box
        if (this.strokeColor != undefined || this.fillColor != undefined) {
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.w, this.h);
            if (this.fillColor != undefined) {
                ctx.fillStyle = this.fillColor;
                ctx.fill()
            }
            if (this.strokeColor != undefined) {
                ctx.strokeStyle = this.strokeColor;
                ctx.stroke();
            }
            ctx.closePath();
        }
        //Recurse through children and draw them
        this.children.forEach(b => b.draw())
    }
    //Clear mouse focus
    clearMouseFocus() {
        this.mouseFocus = false;
        this.children.forEach(b => b.clearMouseFocus());
    }
    //Set mouse focus
    setMouseFocus() {
        //Iterate through children in reverse draw order
        for (let i = this.children.length - 1; i >= 0; i--) {
            this.children[i].setMouseFocus();
            //Breakout of clicks when object found
            if (this.children[i].mouseFocus === true) {
                return
            }
        }
    }
    //Method to handle mouse clicks
    mouseUp() {
        for (let i = this.children.length - 1; i >= 0; i--) {
            //Breakout of clicks when object found
            let ret = this.children[i].mouseUp();
            if (ret === true) {
                return true
            }
        }
    }
}

//ANCHOR Root Class
class Root extends Box {
    constructor(w, h, options) {
        let defaults = {
            isRoot: true
        }
        options = updateOptions(options, defaults)
        super(undefined, w, h, options)
    }
    draw() {
        //Clear mouseFocus, and apply mouse focus
        this.clearMouseFocus();
        this.setMouseFocus();
        //Call draw for the superclass
        super.draw()
    }
    empty() {
        this.children = [];
    }
}

//ANCHOR TextBox Class
//Class for rendering text
class TextBox extends Box {
    constructor(parent, w, h, options, text) {
        /*Class for rendering text in a Box class, inherits from Box
        -text - text to render
        */
        let defaults = {
            strokeColor: testing ? "pink" : undefined,
            textColor: "black",
            font: "16px Arial",
        }
        options = updateOptions(options, defaults);
        super(parent, w, h, options);
        //Setup parameters based on hard typed inputs
        this.text = text;
    }
    draw() {
        super.draw();
        ctx.font = this.font;
        ctx.fillStyle = this.textColor;
        let x, y
        if (this.align.charAt(0) == "t") {
            ctx.textBaseline = "top";
            y = this.y;
        } else if (this.align.charAt(0) == "b") {
            ctx.textBaseline = "bottom";
            y = this.bottom;
        } else if (this.align.charAt(0) == "c") {
            ctx.textBaseline = "middle";
            y = this.mid_y;
        }
        if (this.align.charAt(1) == "l") {
            ctx.textAlign = "left";
            x = this.x;
        } else if (this.align.charAt(1) == "r") {
            ctx.textAlign = "right";
            x = this.right;
        } else if (this.align.charAt(1) == "c") {
            ctx.textAlign = "center";
            x = this.mid_x;
        }
        ctx.fillText(this.text, x, y)
    }
}

//ANCHOR Button Class
//Clickable Button Class
class Button extends TextBox {
    constructor(parent, w, h, options, text, onClick) {
        /*Class for making clickable buttons that do something
        Inherits Text class (use "" for empty text box)
        -onClick - a function to run when the box is clicked, if false .clickable will be set to false, supercededs options
        */
        let defaults = {
            strokeColor: "black", //Color without mouseover
            clickable: true,
            onClick: () => console.log("Clicked: Button")
        }
        options = updateOptions(options, defaults, { onClick: onClick });
        super(parent, w, h, options, text);
        //Check if onClick is false - remove clickable functionality
        if (this.onClick === false) {
            this.clickable = false;
        }
    }
    draw() {
        if (this.clickable == true) {
            if (this.mouseFocus == true) {
                if (canvas.mouseDown) {
                    //Mouse Down
                    this.strokeColor = "red";
                    this.textColor = "red";
                }
                else {
                    //Mouse Over
                    this.strokeColor = "purple";
                    this.textColor = "purple";
                }
            } else {
                //Clickable
                this.strokeColor = "blue";
                this.textColor = "blue";
            }
        } else {
            //Not Clickable
            this.strokeColor = "black";
            this.textColor = "black";
        }
        super.draw()
    }
    checkMouse() {
        let [mx, my] = [canvas.mouse_x, canvas.mouse_y];
        return mx >= this.x && mx < this.right && my >= this.y && my < this.bottom;
    }
    setMouseFocus() {
        if (this.checkMouse()) {
            this.mouseFocus = true;
            return;
        }
        super.setMouseFocus();
    }
    mouseUp() {
        if (this.mouseFocus && this.clickable) {
            this.onClick();
            return true
        }
        super.mouseUp();
    }
}

//ANCHOR EmptyCard Class
class EmptyCard extends Button {
    constructor(parent, options, onClick) {
        /*Card to be used
        -name - [A,2,...,T,J,Q,K][c,d,h,s]
        Card sizing is absolute - defined in card size above
        */
        let defaults = {
            whType: "root",
            fillColor: undefined,
            onClick: () => console.log("Clicked: EmptyCard"),
        }
        options = updateOptions(options, defaults, { onClick: onClick });
        super(parent, cardWidth, cardHeight, options, "")
    }
}

//ANCHOR Card Class
let suitLookup = { c: '\u2663', d: '\u2666', h: '\u2665', s: '\u2660' }
class Card extends EmptyCard {
    constructor(parent, options, name, onClick) {
        /*Card without a suit, no inherent text
        could be used for card spots, or face down cards*/
        let defaults = {
            faceup: true,
            fillColor: "white",
            textColor: "red",
            onClick: () => console.log("Clicked: " + this.name),
        }
        options = updateOptions(options, defaults, { onClick: onClick })
        super(parent, options)
        //Additonal parameters from input
        this.name = name;
        this.rank = name.charAt(0);
        this.suit = name.charAt(1);
        this.suitString = suitLookup[this.suit];
        //Setup the text box on the card
        let subTextColor = (this.suit == "c" || this.suit == "s") ? "black" : "red"
        new TextBox(this, 0.8, 0.2, { align: "tl", offset_x: 0.1, offset_y: 0.1, textColor: subTextColor }, `${this.rank}${this.suitString}`)
    }
    draw() {
        if (this.faceup) {
            super.draw()
        } else {
            let temp = this.children;
            this.children = [];
            this.fillColor = "darkgrey";
            super.draw();
            this.fillColor = "white";
            this.children = temp;
        }
    }
    onClick() {
        console.log(`Clicked: ${this.name}`)
    }
}

//ANCHOR CardMatrix Class
//Creates arrays of cards
class CardMatrix extends Box {
    constructor(parent, w, h, options, matrix, cardOptions, cardOnClicks) {
        /*Make a matrix of cards based on assigned matrix, cards placed to fill box
        Where only single row of matrix is provided, centers the cards
        *see Box for other definitons
        -matrix - nested array ex. [["7h","Ad"],["Th",""]] of the cards to be placed in the array, "" filled with a blank space
        -cardOptions - options, a matrix of options to be applied to the cards, matrix must match size of names, if {} applies to all
        -cardFunctions - matrix of functions to apply to the cards, shape must match "matrix", if values are false then .clickable will be set to false (per EmptyCard)
        */
        super(parent, w, h, options);
        this.matrix = matrix;
        //Evenly space out rows within h based on rows in matrix
        let y_max = (1 - (cardHeight * this.root.h / this.h));
        for (let j = 0; j < matrix.length; j++) {
            let y;
            if (matrix.length === 1) { //Center when length is 1
                y = 0.5 - (cardHeight * this.root.h / this.h) / 2;
            } else { //Otherwise evenly space
                y = y_max / (matrix.length - 1) * j;
            }
            //Evenly space out columns within w based on columns in matrix
            let x_max = (1 - (cardWidth * this.root.w / this.w));
            for (let i = 0; i < matrix[j].length; i++) {
                let x;
                if (matrix[j].length === 1) { //Center when length 1
                    x = 0.5 - (cardWidth * this.root.w / this.w) / 2;
                } else { //Otherwise evenly space
                    x = x_max / (matrix[j].length - 1) * i;
                }
                //Establish card name for ease of use
                let cardName = matrix[j][i];
                if (cardName == "") {
                    //Skip card creation
                    continue;
                }
                //Select the correct options for card
                let cDefaults = { offset_x: x, offset_y: y };
                let cOptions
                if (cardOptions === undefined) { //No options provided
                    cOptions = {}
                } else if (Array.isArray(cardOptions)) { //Options provided in Matrix
                    cOptions = cardOptions[j][i]
                } else { //Use single option provided for all cards
                    cOptions = cardOptions
                }
                //Select the correct onClick for card
                let cOnClick
                if (cardOnClicks === undefined) { //No options provided
                    cOnClick = undefined;
                } else if (Array.isArray(cardOnClicks)) { //Options provided in Matrix
                    cOnClick = cardOnClicks[j][i];
                } else { //Use single option provided for all cards
                    cOnClick = cardOnClicks;
                }
                //Create Card
                if (cardName == "00") {
                    cDefaults.clickable = false;
                    cOptions = updateOptions(cOptions, cDefaults)
                    new EmptyCard(this, cOptions, cOnClick);
                } else {
                    cDefaults.clickable = true;
                    cOptions = updateOptions(cOptions, cDefaults)
                    new Card(this, cOptions, cardName, cOnClick);
                }
            }
        }
    }
}

//ANCHOR Handlers
document.addEventListener("mousemove", mouseMoveHandler, false);
function mouseMoveHandler(e) {
    canvas.mouse_x = e.pageX - canvas.offsetLeft;
    canvas.mouse_y = e.pageY - canvas.offsetTop;
}
document.addEventListener("mousedown", mouseDownHandler, false);
function mouseDownHandler() {
    canvas.mouseDown = true;
}
document.addEventListener("mouseup", mouseUpHandler, false);
function mouseUpHandler() {
    canvas.mouseDown = false;
    root.mouseUp(); //Handle the mouseup event
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
        //Create and sort the deck
        let randNums = {}
        allCards.forEach(x => {
            randNums[x] = Math.random();
        });
        this.deck = allCards.map(x => x);
        this.deck.sort((a, b) => randNums[a] - randNums[b])
        //Draw tsar card
        this.tsar = this.pick();
        //Draw hands
        this.hand0 = [];
        //this.actions0 = [];
        this.hand1 = [];
        //this.actions1 = [];
        for (let i = 0; i < 6; i++) {
            this.hand0.push(this.pick());
            //this.actions0.push(this.playFromHand(0, i));
            this.hand1.push(this.pick());
            //this.actions1.push(this.playFromHand(1, i));
        }
        this.sortHands()
        //Create the fields
        this.field0 = []
        this.field1 = []
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
    suitOf(card) {return card.charAt(1)}
    get tsarSuit() {
        return this.tsar.charAt(1)
    }
    //ANCHOR Game update
    update() {
        /*Updates the game given the current state of the game
        Updates include: avaliable actions, cleanup, gameOver
        Finally calls this.render()
        */
        //Clear previous actions
        this.actions0 = [];
        this.actions1 = [];
        //No actions for inactive player
        this.hand(this.inactivePlayer).forEach(() => this.actions(this.inactivePlayer).push(false));
        //Define some useful variables
        let hand = this.hand(this.activePlayer);
        let field = this.field(this.activePlayer);
        let actions = this.actions(this.activePlayer);
        //Determine what action the active player needs to take
        if (this.activeAction == "defend") {
            //DEFEND
            //Acceptable defender actions
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
                actions.push(this.playFromHand(this.activePlayer, i))
            }
        }
        //Finally call this.render() to re-fresh the window
        this.render()
    }
    //ANCHOR Game render/update
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
        //Setup play area 
        let playColumn = new Box(this.root, 0.75, 1, "tr");
        new CardMatrix(playColumn, 0.7, 0.25, "tc", [this.hand0], undefined, [this.actions0]); //hand0
        new CardMatrix(playColumn, 1, 0.25, { align: "tc", offset_y: 0.25 }, [pad(this.field0, "00")], { clickable: false }); //field0
        new CardMatrix(playColumn, 1, 0.25, { align: "tc", offset_y: 0.5 }, [pad(this.field1, "00")], { clickable: false }); //field1
        new CardMatrix(playColumn, 1, 0.25, "bc", [this.hand1], undefined, [this.actions1]); //hand1
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
            console.log("Played: " + card, this);
            //Refresh
            this.update();
        }
    }
}

//ANCHOR Assets
let root = new Root(0.95, 0.95, "cl");
let gamez = new Game(root)
gamez.render()

//ANCHOR Draw function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    root.draw();
    requestAnimationFrame(draw);
}
//Run the script
draw();