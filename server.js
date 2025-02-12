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

console.log("Started script")

//const { TableClient } = require('@azure/data-tables');

console.log("Imported package")

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

function sendToLog(logEntry) {
    // console.log("Entered logEntry")
    // const client = TableClient.fromConnectionString(
    //     process.env.ANALYTICS_CONNECTION_STRING,
    //     'fortunebot-analytics'
    // );

    // console.log(logEntry)
    // client.upsertEntity(logEntry)
    //     .then(() => {
    //         console.log('Log entry sent successfully');
    //     })
    //     .catch((error) => {
    //         console.error('Error sending log entry:', error);
    //     });
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

        if (ctx.message) {

            var my_json = {
                "update type": ctx.updateType,
                "update sub type": ctx.updateSubTypes,
                "message id": ctx.message.message_id,
                "message text": ctx.message.text,
                "message date": ctx.message.date,
                "from id": ctx.message.from.id,
                "from is bot": ctx.message.from.is_bot,
                "from first name": ctx.message.from.first_name,
                "from last name": ctx.message.from.last_name,
                "from username": ctx.message.from.username,
                "from language code": ctx.message.from.language_code,
                "chat id": ctx.message.chat.id,
                "chat type": ctx.message.chat.type,
                "chat title": ctx.message.chat.type == "group" ? ctx.update.message.chat.title : ""
            }
        } else if (ctx.updateType == 'inline_query') {
            var my_json = {
                "update type": ctx.updateType,
                "update sub type": ctx.updateSubTypes,
                "update id" : ctx.update.update_id,
                "inline query id": ctx.update.inline_query.id,
                "query text": ctx.update.inline_query.query,
                "from id": ctx.update.inline_query.from.id,
                "from is bot": ctx.update.inline_query.from.is_bot,
                "from first name": ctx.update.inline_query.from.first_name,
                "from last name": ctx.update.inline_query.from.last_name,
                "from username": ctx.update.inline_query.from.username,
                "from language code": ctx.update.inline_query.from.language_code
            }
        } else if (ctx.updateType == "'chosen_inline_result'") {
            var my_json = {
                "update type":        ctx.updateType,
                "update sub type":    ctx.updateSubTypes,
                "update id":          ctx.update.update_id,
                "query text":         ctx.update.chosen_inline_result.query,
                "result id":          ctx.update.chosen_inline_result.result_id,
                "from id":            ctx.update.chosen_inline_result.from.id,
                "from is bot":        ctx.update.chosen_inline_result.from.is_bot,
                "from first name":    ctx.update.chosen_inline_result.from.first_name,
                "from last name":     ctx.update.chosen_inline_result.from.last_name,
                "from username":      ctx.update.chosen_inline_result.from.username,
                "from language code": ctx.update.chosen_inline_result.from.language_code
            }
        } else {
            var my_json = {
                "update type": ctx.updateType,
                "update sub type": ctx.updateSubTypes,
            }
        }

        // my_json["partitionKey"] = ctx.updateType
        // my_json["rowKey"] = "id" + Math.random().toString(16).slice(2)

        // sendToLog("fortunebot_request", my_json);
        sendToLog(my_json);
    })
})

bot.start((ctx) => ctx.reply('Welcome! Send me any /fortune command and I will reply with a random epigram.'))
bot.help((ctx) => ctx.reply('Send me a /fortune command and I will reply with a random epigram.'))
bot.command('about', (ctx) => ctx.reply('https://github.com/alkhimey/fortunebot\n ' + fortunes.length + " fortunes in db"))
bot.command('fortune', (ctx) => ctx.reply(getFortune()))

bot.on('inline_query', (ctx) => {
    const result = [{
        type: 'article',   
        id : '1',     
        title: "Select this to send a fortune",
        thumb_url: "https://github.com/alkhimey/fortunebot/raw/master/images/cowsay.png",
        input_message_content :{message_text : getFortune() }
        //description: "description"
      }]

    // Using shortcut
    ctx.answerInlineQuery(result, {cache_time: 0})
})

bot.launch({
    webhook: {
      domain: 'https://fortunebot.azurewebsites.net',
      port: process.env.PORT || 3000
  }
})

