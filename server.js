import {State} from './rules.js'

export class Server {
    constructor() {
        //Server for hosting the game of durak
        this.state = new State();
    }
}