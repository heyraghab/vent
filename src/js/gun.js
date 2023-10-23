import gun from 'gun'
import 'gun/sea'
import { writable } from 'svelte/store'
export const db = new gun({
    peers: ['https://plankton-app-6qfp3.ondigitalocean.app/gun', 'https://gun-manhattan.herokuapp.com/gun', 'http://localhost:8765/gun'],
    radisk: true,
    localStorage: true
})

export var user = db.user().recall({ sessionStorage: true })

export var loggedin = writable(true)