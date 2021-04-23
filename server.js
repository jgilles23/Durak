import { State } from './rules.js';
import { RandomAI, HeuristicAI } from './ai.js';
//const express = require('express');
import express from 'express';
//const querystring = require('querystring');
//const fetch = require("node-fetch");
import fetch from 'node-fetch';

export class Server {
    constructor(verbose) {
        //Server for hosting the game of durak
        console.log("NEW GAME")
        this.state = new State();
        this.ai = new HeuristicAI(undefined); //Place the time for server to take an action here 
        //If the AI starts, play AI action
        if (this.state.activePlayer == 0) {
            this.applyAIAction();
        }
    }
    getState(player) {
        //Get the state of the board for what a particular player can see, player=undefined to return all information
        if (player==="undefined") {player = undefined}
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
        //Save this
        let self = this;
        //Server applicaiton
        const PORT = process.env.PORT || 5000;
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
            console.log(`In /game GET: ${JSON.stringify(req.query)}`)
            let x = self.getState(req.query.player); //self is NetServer
            res.send(JSON.stringify(x))
        })
        //Post method
        app.post('/game', function(req,res) {
            //Requires player and action to be provided
            //TODO Ignoring body for now because it seems difficult
            console.log(`In /game POST: ${JSON.stringify(req.query)}`);
            console.log(`body: ${req.body}`);
            self.applyAction(req.query.action); //self is NetServer
            //Return state after application of action
            let x = self.getState(req.query.player);
            res.send(JSON.stringify(x));
        })
        //Test method
        app.get('/test', function(re,res) {
            //Method for testing if the connection works
            console.log('In /test GET: connection successful');
            res.send(JSON.stringify(true))
        })
        //Listen to port
        app.listen(PORT, () => {
            console.log(`NetServer is listening on port ${PORT}`)
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
                //console.log('jsonResponse',jsonResponse)
                return jsonResponse
            }
            throw new Error('Did not reach endpoint.');
        } catch (error) {
            console.log(error);
        }
    }
    async applyAction(player,action) {
        //Function used as a portal to get the state of internet games
        const endpoint = `${this.url}?player=${player}&action=${action}`
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
                //console.log('jsonResponse',jsonResponse)
                return jsonResponse
            }
            throw new Error('Did not reach endpoint.');
        } catch (error) {
            console.log(error);
        }
    }
}