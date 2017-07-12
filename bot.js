#!/usr/bin/env node
var SteamUser = require("steam-user");
var SteamTotp = require('steam-totp');
var config = require('./config.json');

function uniq(a) {
    return a.sort().filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    })
}

var playme = config.gamestoplay;
var templay = parseInt(playme.length);
playme = uniq(playme);
log('Initaliing bot...');
log('Removing duplicate ids from game array...');
log('Removed ' + parseInt(templay - playme.length) + ' games');
if (playme.length > 31) {
	log('You are only able to idle 31 games at once due to steam... Delete some ID numbers in config to start idling');
};
var client = new SteamUser();

//functions

function log(message) {
	var date = new Date();
	var time = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];
	for(var i = 1; i < 6; i++) {
		if(time[i] < 10) {
			time[i] = '0' + time[i];
		}
	}
	console.log(time[0] + '-' + time[1] + '-' + time[2] + ' ' + time[3] + ':' + time[4] + ':' + time[5] + ' - ' + message);
}

//endfunc


client.logOn({
	"accountName": config.username,
	"password": config.password,
  	"promptSteamGuardCode": false,
  	"twoFactorCode": SteamTotp.getAuthCode(config.twofactorcode),
  	"rememberPassword": true
});

client.on("loggedOn", function (details) {
	log("Logged on to steam!");
	client.requestFreeLicense(playme);
	log("Idling: " + playme.length + " games, getting " + (playme.length * 24) + " hours per day | " + (playme.length * 336) + " hours per 2 weeks");
	client.gamesPlayed(playme);
  	client.setPersona(1);
});

client.on('error', function(e) {
	log('Client error', e);
	shutdown(1);
});

client.once('sentry', () => {
	log('Recieved sentry file...');
})

process.on('SIGINT', function() {
	log("Logging off and shutting down");
	shutdown(0);
});

function shutdown(code) {
	process.exit(code);
	setTimeout(function() {
		process.exit(code);
	}, 500);
}
