const mysql = require('mysql');
const fs = require('fs');
const { Client, Collection, Intents } = require('discord.js');
const { prefix, token} = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] });

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'geheim12',
    database : 'watcher'
});

const excluded = ['656476952462622761', '643492322645901324', '874325240631672833', '646546471889666048', '406950566191693834', '922617394348838993'];
var gotdEnd;

client.once('ready', () => {
    connection.connect();
	console.log("I am the Watcher");
    // fetchGotd();
    // setInterval(updateGotd, 60000);
});

client.on('messageCreate', message => {
    if(excluded.includes(message.author.id)) return;
    if(message.content == "!gotd"){
        fetchGotd();
        return
    }
    if(message.content == "!ugotd"){
        updateGotd();
        return
    }
    try {
        connection.query(`INSERT INTO messages VALUES (${message.id}, ${message.author.id}, ${connection.escape(message.content)}, ${message.channelId}, ${message.createdTimestamp})`, function (error, results, fields) {
            if (error) throw error;
        });
    } catch (error) {
        console.log(error);
    }
    
});

client.on('voiceStateUpdate', (oldState, newState) => {
    let oid = oldState.channelId
        nid = newState.channelId
        ns = newState;
    if(oid === nid) return; //Irrelevant voicestate update

    try {
        if(oid === null && nid !== null){ //New session, add new record
            connection.query(`INSERT INTO voicesessions (uid, cid, startstamp) VALUES (${ns.id}, ${nid}, ${Date.now()})`, function (error, results, fields) {
                if (error) throw error;
            });
        }
        if(oid !== null && nid === null){ //End of a session, update record (only when completely quitting VCs)
            connection.query(`UPDATE voicesessions SET endstamp = ${Date.now()} WHERE cid = ${oid}`, function (error, results, fields) {
                if (error) throw error;
            });
        }
        if(oid !== null && nid !== null){ //Switching voicechannels
            connection.query(`UPDATE voicesessions SET endstamp = ${Date.now()} WHERE cid = ${oid}`, function (error, results, fields) {
                if (error) throw error;
                connection.query(`INSERT INTO voicesessions (uid, cid, startstamp) VALUES (${ns.id}, ${nid}, ${Date.now()})`, function (error, results, fields) {
                    if (error) throw error;
                });
            });
        }
    } catch (error) {
        console.log(error);
    }
    

});

function fetchGotd(){
    connection.query(`SELECT * FROM gotd ORDER BY id DESC LIMIT 1;`, function (error, results, fields) {
        if (error) throw error;
        gotdEnd = results[0].end
        return results[0];
    });
}

Date.prototype.subtractDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() - days);
    return date;
}

function updateGotd(){
    // if(Date.now() < gotdEnd) return //Not time yet
    let data = fetchGotd(); //Time to update
    // let oldGotd = client.guilds.fetch('121335756156436480').members.fetch(data.uid);
    
        console.log('?');
        // oldGotd.roles.remove('788926963242500126') //Remove role
        let query = `SELECT * FROM messages WHERE timestamp BETWEEN ${Date.now()-86400} and ${Date.now()}`
        console.log(query);
        connection.query(query, function (error, results, fields) {//Get all messages between timestamps
            // connection.query(`INSERT INTO gotd (uid, start, end) VALUES (${})`, function (error, results, fields) {
            
            // });
            console.log(results.length);
        });
    
    
}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}



client.login(token);
