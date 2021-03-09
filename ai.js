//Module for holding various AI modes for durak

function randInt(min, max) {
    //Generate a random integer from min to max (exclusive)
    return min + Math.floor(Math.random() * (max - min));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve,ms))
}

export class RandomAI {
    //Function for this AI to select an action. Returns the action in text.
    constructor() {
    }
    async selectAction(state) {
        //Method for AI to select the action to use
        if (state.specialActions.includes("Rematch")) {
            throw "AI cannot take the rematch action." //TODO
        }
        let options = state.cardActions.concat(state.specialActions);
        let i = randInt(0, options.length);
        let aiAction = options[i]
        //Wait to perform AI action, so human understands something is happening
        await sleep(500);
        return aiAction;
    }

}