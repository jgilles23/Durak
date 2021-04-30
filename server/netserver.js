import {Server} from './server.js'
import express from 'express';
import cors from 'cors';

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
        //Methods to USE as middleware
        app.use(middleware_logger);
        app.use(cors());
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
            //console.log(`body: ${req.body}`);
            self.applyAction(req.query.player, req.query.action); //self is NetServer
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

//Start the netserver
console.log("CREATING NEW SERVER")
new NetServer