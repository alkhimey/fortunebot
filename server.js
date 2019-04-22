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
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => ctx.reply('Welcome! Send me any /fortune command and I will reply with a random epigram.'))
bot.help((ctx) => ctx.reply('Send me a /fortune command and I will reply with a random epigram.'))
bot.command('about', (ctx) => ctx.reply('fortune@nihamkin.com\n ' + fortunes.length + " fortunes in db"))
bot.command('fortune', (ctx) => ctx.reply(getFortune()))

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

