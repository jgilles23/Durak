import { State } from './rules.js';
import { RandomAI, HeuristicAI } from './ai.js';
//const express = require('express');
import express from 'express';
//const querystring = require('querystring');
//const fetch = require("node-fetch");
import fetch from 'node-fetch';

export class Server {
    constructor() {
        //Server for hosting the game of durak
        console.log("NEW GAME")
        this.state = new State();
        this.ai = new HeuristicAI(500);
        //If the AI starts, play AI action
        if (this.state.activePlayer == 0) {
            this.applyAIAction();
        }
    }
    getState(player) {
        //Get the state of the board for what a particular player can see, player=undefined to return all information
        return this.state.strip(player);
    }
    applyAction(text) {
        //Apply an action that is given to the server
        //Play the human action
        console.log("Human Action:", text);
        this.state.applyAction(text);
        //Play the AI action
        this.applyAIAction();
    }
    async applyAIAction() {
        //Apply an AI action
        const aiAction = await this.ai.selectAction(this.getState(0));
        //const aiAction = await this.ai.resolveAfter2Seconds("Test 2")
        console.log('Computer Action:', aiAction); //STUB
        this.state.applyAction(aiAction);
    }
}

export class NetServer extends Server {
    constructor() {
        super();
        //Server applicaiton
        let app = express();
        //Middleware function for logging server requests
        let middleware_logger = function(req, res, next) {
            //Log the incomming requests
            //TODO Add some checking that the correct queries were given 
            console.log(`REQUEST method ${req.method}, url ${req.url}`)
            next()
        }
        app.use(middleware_logger);
        //Get method
        app.get('/game', function(req,res) {
            //Requires a player query to be provided
            console.log(`In /game GET: ${req.query}`)
            let x = this.getState(req.query.player);
            res.send(JSON.stringify(x))
        })
        //Post method
        app.post('/game', function(req,res) {
            //Requires player and action to be provided
            //TODO Ignoring body for now because it seems difficult
            console.log(`In /game POST: ${req.query}`);
            console.log(`body: ${req.body}`);
            this.applyAction(req.query.action);
            //Return state after application of action
            let x = this.getState(req.query.player);
            res.send(JSON.stringify(x));
        })
        //Listen to port
        app.listen(3000, () => {
            console.log("NetServer is listening on port 3000")
        })
    }
}

export class NetPortal {
    constructor() {
        this.url = 'http://localhost:3000/game'
    }
    async getState(player) {
        //Function used as a portal to get the state of internet games
        const endpoint = `${this.url}?player=${player}`
        try {
            const response = await fetch(endpoint);
            if (response.ok) {
                const jsonResponse = await response.json();
                console.log(jsonResponse)
                return jsonResponse
            }
            throw new Error('Did not reach endpoint.');
        } catch (error) {
            console.log(error);
        }
    }
    async applyAction(player,action) {
        //Function used as a portal to get the state of internet games
        const endpoint = `${url}?player=${player}&action=${action}`
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({test:"test"}),
                headers: {
                    'Content-Type': 'application/json'
                },
            });
            if (response.ok) {
                const jsonResponse = await response.json();
                console.log(jsonResponse)
                return jsonResponse
            }
            throw new Error('Did not reach endpoint.');
        } catch (error) {
            console.log(error);
        }
    }
}