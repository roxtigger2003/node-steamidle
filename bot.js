#!/usr/bin/env node
const SteamUser = require('steam-user')
const SteamTotp = require('steam-totp')
const fs = require('fs')

if (fs.existsSync('./config.json')) {
  var config = require('./config.json')
} else {
  log('Config file not present, please create one')
  process.exit(0)
}

if (config.username === '' || config.password === '') {
  log('Edit config.json! Add you username and password and start the bot')
  process.exit(1)
}

var responded = [];

var playme = config.gamestoplay
var templay = parseInt(playme.length)
if (config.donotsort === false) {
  playme = uniq(playme)
};

log('Initaliing bot...')
log('Removing duplicate ids from game array...')
log('Removed ' + parseInt(templay - playme.length) + ' games')
if (playme.length > 33 && config.bypasslimit === false) {
  log('You are only able to idle 33 games at once due to steam limitation... Delete some ID numbers in config to start idling')
  process.exit(1)
};

if (config.bypasslimit === true) {
  log('WARNING: Bypassing the game limit may affect you steam account')
};

var client = new SteamUser()

// functions

function uniq (a) {
  return a.sort().filter(function (item, pos, ary) {
    return !pos || item !== ary[pos - 1]
  })
}

function log (message) {
  var date = new Date()
  var time = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()]
  for (var i = 1; i < 6; i++) {
    if (time[i] < 10) {
      time[i] = '0' + time[i]
    }
  }
  console.log(time[0] + '-' + time[1] + '-' + time[2] + ' ' + time[3] + ':' + time[4] + ':' + time[5] + ' - ' + message)
}

function compareKeys(a, b) {
  var aKeys = Object.keys(a).sort();
  var bKeys = Object.keys(b).sort();
  return JSON.stringify(aKeys) === JSON.stringify(bKeys);
}

// endfunc

function shutdown (code) {
  process.exit(code)
  setTimeout(function () {
    process.exit(code)
  }, 500)
}

// methods

client.logOn({
  'accountName': config.username,
  'password': config.password,
  'promptSteamGuardCode': false,
  'twoFactorCode': SteamTotp.getAuthCode(config.twofactorcode),
  'rememberPassword': true
})

client.on('loggedOn', function (details) {
  log('Logged on to steam!')
  client.requestFreeLicense(playme)
  log('Idling: ' + playme.length + ' games, getting ' + (playme.length * 24) + ' hours per day | ' + (playme.length * 336) + ' hours per 2 weeks')
  client.gamesPlayed(playme)
  if (config.silent === false) {
    client.setPersona(1)
  };
})

client.on('error', function (e) {
  log('Client error' + e)
  shutdown(1)
})

client.on('friendMessage', function (steamid, message) {
  if (config.sendautomessage === true && responded.indexOf(steamid.getSteamID64()) == -1) {
    responded.push(steamid.getSteamID64())
    client.chatMessage(steamid, config.automessage)
  };
})

client.on('lobbyInvite', function(inviterID, lobbyID){
  if (config.sendautomessage === true && responded.indexOf(steamid.getSteamID64()) == -1) {
    responded.push(inviterID.getSteamID64())
    client.chatMessage(steamid, config.automessage)
  };
})

process.on('SIGINT', function () {
  log('Logging off and shutting down')
  shutdown(0)
})
