/*
Module for drawing on the canvas in JavaScript
Start with a Root() call to spin a Box in the canvas, all other boxes are derivative, rendered from, and drawn from the root
*/

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
    //overide with input arguments where input arguments are defined
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
export class Box {
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
        let args = {
            input_w: w,
            input_h: h,
        }
        let defaults = {
            isRoot: false,
            align: "tl",
            whType: "norm",
            xyType: "norm",
            offset_x: 0,
            offset_y: 0,
            fillColor: undefined,
            children: [],
            mouseFocus: false, //only (1) box has true
            //Items that refer to parent (may need to be added to Root parentStandIn)
            whContext: parent,
            xyContext: parent,
            parent: parent,
            root: parent.root,
            ctx: parent.ctx,
            testing: parent.testing,
            strokeColor: parent.root.testing ? "red" : undefined,
        }
        options = updateOptions(options, defaults, args);
        //Copy the parameters to the class -- Happens in Box class only
        for (const key in options) {
            this[key] = options[key];
        }
        //Add to the tree by adding to parent children
        this.parent.children.push(this);
        //Render the object
        this.render()
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
    render() {
        //Re-calculate sizes and positions
        //console.log("rendering", this)
        let [w, h] = [this.input_w, this.input_h]
        //Calcualte the width and height
        let con = this.whContext
        this.w = con.w * w;
        this.h = con.h * h;
        //Get x, y of context
        con = this.xyContext
        //Calculate y position
        if (this.align.charAt(0) == "t") {
            this.y = con.y;
        } else if (this.align.charAt(0) == "b") {
            this.y = con.y + con.h - this.h;
        } else if (this.align.charAt(0) == "c") {
            this.y = con.y + con.h / 2 - this.h / 2;
        } else {
            throw ".align not valid: " + this.align;
        }
        //Calculate x position
        if (this.align.charAt(1) == "l") {
            this.x = con.x;
        } else if (this.align.charAt(1) == "r") {
            this.x = con.x + con.w - this.w;
        } else if (this.align.charAt(1) == "c") {
            this.x = con.x + con.w / 2 - this.w / 2;
        } else {
            throw ".align not valid: " + this.align;
        }
        //Add offsets if applicable
        this.y += this.offset_y * con.h;
        this.x += this.offset_x * con.w;
        //Iterate through children and render children
        this.children.forEach(b => b.render());
    }
    //Method to draw a box
    draw() {
        //Draw this box
        if (this.strokeColor != undefined || this.fillColor != undefined) {
            this.ctx.beginPath();
            this.ctx.lineWidth = 2.0;
            this.ctx.rect(this.x, this.y, this.w, this.h);
            if (this.fillColor != undefined) {
                this.ctx.fillStyle = this.fillColor;
                this.ctx.fill()
            }
            if (this.strokeColor != undefined) {
                this.ctx.strokeStyle = this.strokeColor;
                this.ctx.stroke();
            }
            this.ctx.closePath();
        }
        //Recurse through children and draw them
        this.children.forEach(b => b.draw())
    }
    //Remove everyhting in the call tree from the box (clears the objects)
    empty() {
        this.children = [];
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
export class Root extends Box {
    constructor(canvas, w, h, options) {
        //Provide a canvas HTML object
        let defaults = {
            isRoot: true,
            canvas: canvas,
            testing: false, //Set to turn on/off testing boxes
        }
        options = updateOptions(options, defaults)
        //Create standin parent object to allow box construction
        let parentStandin = {
            //Leave most items as undefined
            children: [],
            ctx: canvas.getContext("2d"),
            x: 0,
            y: 0,
            w: canvas.width,
            h: canvas.height,
        }
        parentStandin.root = parentStandin;
        super(parentStandin, w, h, options)
        //Overwrite Root parameters for which parentStandin
        for (let key in this) {
            if (this[key] === parentStandin) {
                this[key] = this;
            }
        }
        this.isRoot = true;
        //Setup event handlers - Each handler is called because it returns a function
        document.addEventListener("mousemove", this.mouseMoveHandler(), false);
        document.addEventListener("mousedown", this.mouseDownHandler(), false);
        document.addEventListener("mouseup", this.mouseUpHandler(), false);
        window.addEventListener("resize", this.resizeCanvas(), false);
    }
    render() {
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        super.render()
    }
    draw() {
        //Clear mouseFocus, and apply mouse focus
        this.clearMouseFocus();
        this.setMouseFocus();
        //Call draw for the superclass
        super.draw()
    }
    //Event handlers - Return functions!
    mouseMoveHandler() {
        return (e) => {
            this.mouse_x = e.pageX - this.canvas.offsetLeft;
            this.mouse_y = e.pageY - this.canvas.offsetTop;
        }
    }
    mouseDownHandler() {
        return () => {
            this.mouseDown = true;
        }
    }
    mouseUpHandler() {
        return () => {
            this.mouseDown = false;
            this.mouseUp(); //Handle the mouseup event
        }
    }
    resizeCanvas() {
        return () => {
            //re-size the canvas to correctly fit into the browser
            let a = Math.min(window.innerWidth, window.innerHeight)
            console.log("resizing")
            this.canvas.width = a * 0.9;
            this.canvas.height = a * 0.9;
            //Re-render to the new screen size
            this.render();
        }
    }
}

//ANCHOR TextBox Class
//Class for rendering text
export class TextBox extends Box {
    constructor(parent, w, h, options, text) {
        /*Class for rendering text in a Box class, inherits from Box
        -text - text to render
        */
        let defaults = {
            strokeColor: parent.testing ? "pink" : undefined,
            textColor: "black",
            font: "16px Arial",
            textAlign: "cc"
        }
        options = updateOptions(options, defaults);
        super(parent, w, h, options);
        //Setup parameters based on hard typed inputs
        this.text = text;
    }
    draw() {
        super.draw();
        this.ctx.font = this.font;
        this.ctx.fillStyle = this.textColor;
        let x, y
        if (this.textAlign.charAt(0) == "t") {
            this.ctx.textBaseline = "top";
            y = this.y;
        } else if (this.textAlign.charAt(0) == "b") {
            this.ctx.textBaseline = "bottom";
            y = this.bottom;
        } else if (this.textAlign.charAt(0) == "c") {
            this.ctx.textBaseline = "middle";
            y = this.mid_y;
        }
        if (this.textAlign.charAt(1) == "l") {
            this.ctx.textAlign = "left";
            x = this.x;
        } else if (this.textAlign.charAt(1) == "r") {
            this.ctx.textAlign = "right";
            x = this.right;
        } else if (this.textAlign.charAt(1) == "c") {
            this.ctx.textAlign = "center";
            x = this.mid_x;
        }
        this.ctx.fillText(this.text, x, y)
    }
}

//ANCHOR Button Class
//Clickable Button Class
export class Button extends TextBox {
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
                if (this.ctx.mouseDown) {
                    //Mouse Down
                    this.strokeColor = "red";
                    //this.textColor = "red";
                }
                else {
                    //Mouse Over
                    this.strokeColor = "purple";
                    //this.textColor = "purple";
                }
            } else {
                //Clickable
                this.strokeColor = "blue";
                //this.textColor = "blue";
            }
        } else {
            //Not Clickable
            this.strokeColor = "black";
            //this.textColor = "black";
        }
        super.draw()
    }
    checkMouse() {
        let [mx, my] = [this.root.mouse_x, this.root.mouse_y];
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
export class EmptyCard extends Button {
    constructor(parent, options, onClick) {
        /*Card to be used
        -name - [A,2,...,T,J,Q,K][c,d,h,s]
        Card sizing is absolute - defined in card size above
        */
        //Ensure that root has cardWidth and cardHeight defined

        if (parent.root.cardHeight === undefined || parent.root.cardWidth === undefined) {
            throw "Card width or height not defined in Root. Please pass cardWidth and cardHeight as options when constructing Root."
        }
        let defaults = {
            whContext: parent.root,
            fillColor: undefined,
            onClick: () => console.log("Clicked: EmptyCard"),
        }
        options = updateOptions(options, defaults, { onClick: onClick });
        super(parent, parent.root.cardWidth, parent.root.cardHeight, options, "")
    }
}


//ANCHOR Card Class
let suitLookup = { c: '\u2663', d: '\u2666', h: '\u2665', s: '\u2660' }
export class Card extends EmptyCard {
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
        new TextBox(this, 0.8, 0.2, { align: "tl", offset_x: 0.1, offset_y: 0.08, textColor: subTextColor, textAlign: "tl" }, `${this.rank}${this.suitString}`)
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
export class CardMatrix extends Box {
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
        let y_max = (1 - (this.root.cardHeight * this.root.h / this.h));
        for (let j = 0; j < matrix.length; j++) {
            let y;
            if (matrix.length === 1) { //Center when length is 1
                y = 0.5 - (this.root.cardHeight * this.root.h / this.h) / 2;
            } else { //Otherwise evenly space
                y = y_max / (matrix.length - 1) * j;
            }
            //Evenly space out columns within w based on columns in matrix
            let x_max = (1 - (this.root.cardWidth * this.root.w / this.w));
            for (let i = 0; i < matrix[j].length; i++) {
                let x;
                if (matrix[j].length === 1) { //Center when length 1
                    x = 0.5 - (this.root.cardWidth * this.root.w / this.w) / 2;
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
                } else if (cardName == "0B") {
                    cDefaults.clickable = false;
                    cDefaults.faceup = false;
                    cOptions = updateOptions(cOptions, cDefaults)
                    new Card(this, cOptions, cardName, cOnClick);
                } else {
                    cDefaults.clickable = true;
                    cOptions = updateOptions(cOptions, cDefaults)
                    new Card(this, cOptions, cardName, cOnClick);
                }
            }
        }
    }
}