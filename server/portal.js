/*
Portal for reaching the NetServer module for netserver
If running in node.js environment need to use the portal-node.js file instead
*/

//let game_url = 'http://localhost:5000/game';
let game_url = 'https://thawing-ravine-11785.herokuapp.com/game';

export class Portal {
    constructor() {
        this.url = game_url
    }
    async getState(player) {
        //Function used as a portal to get the state of internet games
        const endpoint = `${this.url}?player=${player}`
        console.log('Get Endpoint',endpoint)
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
    async applyAction(player, action) {
        //Function used as a portal to get the state of internet games
        const endpoint = `${this.url}?player=${player}&action=${action}`
        console.log('Post Endpoint', endpoint)
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                /* REMOVED JSON BODY, would have had to send extra info with CORS
                body: JSON.stringify({ test: "test" }),
                headers: {
                    'Content-Type': 'application/json'
                },
                */
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