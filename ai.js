//Module for holding various AI modes for durak
import { State, allCards, valOf, suitOf } from './rules.js';

function randInt(min, max) {
    //Generate a random integer from min to max (exclusive)
    return min + Math.floor(Math.random() * (max - min));
}

function sleep(ms) {
    //Sleep for a period of time, must be called with await
    return new Promise(resolve => setTimeout(resolve, ms))
}

//console.log function that indents 
function prependLog(state, str) {
    if (state.actionCount < 3) {
        let str2 = `${'| '.repeat(state.actionCount)}<${state.actionCount}> ${str}`;
        console.log(str2);
    }
}

class AI {
    constructor(minTime) {
        //Main constructor the the AI class
        //minTime - miliseconds minimum time that the response from the AI should take, if undefined, no delay is used
        this.arguments = arguments;
        this.minTime = minTime || 0;
        this.opponentHand = new Set();
        this.previousState = undefined;
    }
    async selectAction(state) {
        //Calls the subclass mySelectAction, a required function for subcalsses
        if (state.specialActions.includes("Rematch")) {
            throw "AI cannot take the rematch action." //TODO
        }
        //Convert state to a full state object
        state = new State(state)
        //Track the previous action
        this.track(state);
        //investgate if appropriate
        if (state.deck.length === 0) {
            this.investigate(state); //modifies state in place
        }
        //finally perform actions - use promises to set minimum time
        let [action, _] = await Promise.all([this.mySelectAction(state)], await sleep(this.minTime))
        //apply the action to my copy of the state and save the previous state
        state.applyAction(action);
        this.previousState = state;
        return action
    }
    mySelectAction(state) {
        //mySelectAction myst be implemented by sub classes
        throw "mySelectAction not implemented by AI subclass."
    }
    track(state) {
        //Track opponents hand to the best of the ai's ability, using the most recent actions
        if (state.lastAction && state.lastAction.length == 2) {
            if (this.opponentHand.has(state.lastAction)) {
                //Remove played cards from tracked opponent hand
                this.opponentHand.delete(state.lastAction);
            }
        } else if (state.lastAction == "Pickup") {
            //Add picked up cards to opponent hand
            this.previousState.fields.forEach(field => {
                field.forEach(card => {
                    this.opponentHand.add(card)
                })
            })
        }
    }
    investigate(state) {
        //Used to determine the totality of the opponents hand when possible to know, aka when the deck has been exhausted
        //Start investigation
        let C = new Set();
        allCards.forEach(card => C.add(card))
        //Funcation for removing cards from C
        function remove(cards) {
            cards.forEach(x => {
                C.delete(x)
            })
        }
        //Remove known cards
        remove(state.discard);
        remove(state.hands[0]);
        remove(state.hands[1]);
        remove(state.fields[0]);
        remove(state.fields[1]);
        C.delete(state.tsar);
        //Set opponent hand to remaining cards
        state.hands[state.inactivePlayer] = Array.from(C);
        this.opponentHand = C; //save as set
        //Sort hand to ensure state is expected
        state.sortHands();
    }
    //Method for copying the AI with the same arguments
    copy() {
        return new this.constructor(...this.arguments)
    }
}

export class RandomAI extends AI {
    //Function for this AI to select an action. Returns the action in text.
    async mySelectAction(state) {
        //Method for AI to select the action to use
        let options = state.cardActions.concat(state.specialActions);
        let i = randInt(0, options.length);
        let aiAction = options[i]
        //Wait to perform AI action, so human understands something is happening
        return aiAction;
    }

}

export class HeuristicAI extends AI {
    /*AI that uses heuristics to be better than random chance
    States:
    - with deck: defend with lowest non-tsar card; attack with lowest non-tsar card
    - empty deck: prefer above, then use tsar-cards
    */
    constructor(minTime, deckCutoff) {
        /*Inputs:
            - minTime - miliseconds
            - deckCutoff - cards in the deck before switching to mode where tsar suit may be played
        */
        super(...arguments);
        this.deckCutoff = deckCutoff || 0;
    }
    async mySelectAction(state) {
        //Chosse AI actions
        //Function to score cards, non-tsar scores (106-114), tsar scores (306-314)
        function score(card) {
            if (suitOf(state.tsar) == suitOf(card)) {
                return 300 + valOf(card);
            } else {
                return 100 + valOf(card);
            }
        }
        //Choose the lowest scored card action
        let lowScore = 10000;
        let lowAction = undefined
        //Iterate through cardActions
        state.cardActions.forEach(card => {
            if (score(card) < lowScore) {
                //Replace low score if a new low score is found
                lowScore = score(card);
                lowAction = card;
            }
        })
        //If early game, prefer special actions, late-game prefer tsar cards
        if (state.deck.length > this.deckCutoff && state.specialActions.length > 0) {
            //Early game
            if (lowScore > 200) {
                lowAction = state.specialActions[0];
            }
        } else {
            //Late game
            if (lowScore > 400) {
                lowAction = state.specialActions[0];
            }
        }
        //Apply the selected action
        return lowAction;
    }
}

export class EndgameAI extends AI {
    /*AI that focuses on playing a perfect endgame
    States:
    - deck > 0: defend with lowest non-tsar card; attack with lowest non-tsar card
    - deck = 0 & in-play > #: same as above
    - deck = 0 & in-play <= #: deeply calculate the correct action
    */
    async mySelectAction(state) {
        //Method for the AI to select the action ot use. Needs to return a viable action.
        let previous = new Set()
        //Function to score cards, non-tsar scores (106-114), tsar scores (306-314)
        function score(card) {
            if (suitOf(state.tsar) == suitOf(card)) {
                return 300 + valOf(card);
            } else {
                return 100 + valOf(card);
            }
        }
        //Perform an ok action until the endgame can be calculated
        if (true) {//(state.deck.length > 0 || state.discard.length <= 36 - 8) {
            //Function for scoring 
            let lowScore = 10000;
            let lowAction = undefined
            //Iterate through cardActions
            state.cardActions.forEach(card => {
                if (score(card) < lowScore) {
                    //Replace low score if a new low score is found
                    lowScore = score(card);
                    lowAction = card;
                }
            })
            //Use the special action sometimes
            if (lowScore > 200 && state.specialActions.length > 0) {
                lowAction = state.specialActions[0];
            }
            //Return the selected action
            return lowAction
        }
        //Recursively select an action
        let [result, action] = this.recSelectAction(state, previous)
        return action
    }
    recSelectAction(state, previous) {
        //Print the input
        prependLog(state, state.print(false, false));
        //Return if the state has been reached before
        let hashed = state.hash();
        if (previous.has(hashed)) {
            prependLog(state, 'return Repeat')
            return ["Repeat", undefined]
        } else {
            previous.add(hashed);
        }
        //Return Case
        if (state.winner !== undefined) {
            prependLog(state, `return ${state.winner}`)
            return [state.winner, undefined]
        }
        //Othewise select an action and go deeper into the matrix
        let actions = state.cardActions.concat(state.specialActions);
        let results = [];
        for (let i = 0; i < actions.length; i++) {
            let action = actions[i];
            prependLog(state, `action ${action}`)
            //Copy the state
            let newState = state.copy();
            //Apply the selected action
            newState.applyAction(action);
            //Recurse
            let [result, resAction] = this.recSelectAction(newState, previous);
            //Return the result of the selected action
            results.push(result);
            //Stop searching if found win
            if (result === state.activePlayer) {
                prependLog(state, 'Found win, stopping search')
                break;
            }
        }
        // let results = actions.map((action) => {
        //     prependLog(state, `action ${action}`)
        //     //Copy the state
        //     let newState = state.copy();
        //     //Apply the selected action
        //     newState.applyAction(action);
        //     //Recurse
        //     let [result, resAction] = this.recSelectAction(newState, previous);
        //     //Return the result of the selected action
        //     return result
        // })
        //Select the best result (for the active player)
        prependLog(state, `actions ${actions}, results ${results}`)
        let result;
        if (results.includes(state.activePlayer)) {
            prependLog(state, `return ${state.activePlayer} WIN player ${state.activePlayer}`)
            return [state.activePlayer, actions[results.indexOf(state.activePlayer)]];
        } else if (results.includes("Repeat")) {
            prependLog(state, `return Repeat player ${state.activePlayer}`)
            return ["Repeat", actions[results.indexOf("Repeat")]];
        } else {
            prependLog(state, `return ${state.inactivePlayer} LOSS player ${state.activePlayer}`)
            return [state.inactivePlayer, actions[results.indexOf(state.inactivePlayer)]];
        }
    }
}