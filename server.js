#!/usr/bin/env node

/**
 * Possible sources for fortune files:
 * 
 * https://github.com/bmc/fortunes
 * https://github.com/glebec/fortunes
 * http://fortunes.cat-v.org/plan_9/ (format not standardized)
 * https://www.splitbrain.org/projects/fortunes
 * http://fortunes.cat-v.org/
 * https://svnweb.freebsd.org/base?view=revision&revision=325828
 * https://sources.debian.org/src/fortune-mod/1:1.99.1-7/datfiles/
 * 
 * Commands to set with botfather:
 * 
 * about - display about info
 * help - display help
 * fortune - request a random fortune
 */


const fs = require('fs');
var endOfLine = require('os').EOL;

const FORTUNES_DIR = "fortunes/";

/**
 * Global variable holding the db of all the fortunes
 */
var fortunes = [];

/**
 * Loads the fortune strings into an in-memory db
 */
function loadFortuneDB() {

    var files = fs.readdirSync(FORTUNES_DIR);
    for(var i in files) {
        console.log(files[i]); 
        fortunes = fortunes.concat(fs.readFileSync(FORTUNES_DIR + files[i], 'utf8').split('%'+endOfLine).filter(x => x))
    }

}

function getFortune() {
    return fortunes[Math.floor(Math.random() * fortunes.length)];
}

loadFortuneDB();

console.log("Total fortunes in DB: " + fortunes.length)

const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

var util = require('util')


bot.use((ctx, next) => {
    const start = new Date()
    return next(ctx).then(() => {
      const ms = new Date() - start
      console.log("\n")
      console.log(util.inspect(ctx))
      console.log("\n")
      console.log(util.inspect(ctx.update.message.from))
      console.log("\n")
      console.log(util.inspect(ctx.update.message.chat))
      console.log("\n")
      console.log('Response time %sms', ms)
      console.log("\n")
    })
})

bot.start((ctx) => ctx.reply('Welcome! Send me any /fortune command and I will reply with a random epigram.'))
bot.help((ctx) => ctx.reply('Send me a /fortune command and I will reply with a random epigram.'))
bot.command('about', (ctx) => ctx.reply('https://github.com/alkhimey/fortunebot\n ' + fortunes.length + " fortunes in db"))
bot.command('fortune', (ctx) => ctx.reply(getFortune()))

bot.launch({
    webhook: {
      domain: 'https://fortunebot.azurewebsites.net',
      port: process.env.PORT || 3000
  }
})

