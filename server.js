#!/usr/bin/env node

const fs = require('fs');
var endOfLine = require('os').EOL;

/**
 * Loads the fortune strings into an in-memory db
 * @returns an array of all fortune strings
 */
function loadFortuneDB() {
    return fs.readFileSync('fortunes', 'utf8').split('%'+endOfLine).filter(x => x) // TODO: Handle error?
}

function getFortune() {
    return fortunes[Math.floor(Math.random() * fortunes.length)];
}

var fortunes = loadFortuneDB();

console.log("Total fortunes in DB: " + fortunes.length)


const Telegraf = require('telegraf')
//const bot = new Telegraf(process.env.BOT_TOKEN)
const bot = new Telegraf("880639911:AAF9e-hBEsTwdHhRrtRj93rshpix1bZ9WE0") // TODO: Hide token and revoke it

bot.start((ctx) => ctx.reply('Welcome! Send me any message and I will reply with a random epigram.'))
bot.help((ctx) => ctx.reply('Send me any message and I will reply with a random epigram.'))

/*bot.on('message', (ctx) => {
    return ctx.reply(getFortune())
})*/

/*
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('I have ' + fortunes.length + " fortunes to tell you."))
*/

bot.launch({
    webhook: {
      domain: 'https://fortunebot.azurewebsites.net',
      port: process.env.PORT || 3000
  }
})

