#!/usr/bin/env node

const fs = require('fs');
var endOfLine = require('os').EOL;

/**
 * Loads the fortune strings into an in-memory db
 * @returns an array of all fortune strings
 */
function loadFortuneDB() {
    return fs.readFileSync('fortunes', 'utf8').split('%'+endOfLine).filter(x => x)
}

var fortunes = loadFortuneDB();

console.log(fortunes.length)

const Telegraf = require('telegraf')

//const bot = new Telegraf(process.env.BOT_TOKEN)
const bot = new Telegraf("880639911:AAF9e-hBEsTwdHhRrtRj93rshpix1bZ9WE0") // TODO: Hide token and revoke it
console.log("Created Bot")
bot.start((ctx) => ctx.reply('Welcome!'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('I have ' + fortunes.length + " fortunes to tell you."))

/*
bot.launch({
    webhook: {
      domain: 'https://fortunebot.azurewebsites.net',
      port: process.env.PORT || 3000
  }
})
*/
