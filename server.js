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

const { Telegraf } = require('telegraf')
const fs = require('fs');
const express = require('express')
const { TableClient } = require('@azure/data-tables');

const FORTUNES_DIR = "fortunes/";

/**
 * Global vars
 */
var fortunes = [];

/**
 * Functions
 */
function loadFortuneDB() {

    var files = fs.readdirSync(FORTUNES_DIR);
    for(var i in files) {
        var contents = fs.readFileSync(FORTUNES_DIR + files[i], 'utf8')
            .split(/%\r?\n/)
            // .filter(x => x)
        console.log(`Loading ${contents.length} from ${files[i]}`);


        fortunes = fortunes.concat(contents)
    }

}

function getFortune() {
    console.log("getFortune")
    return fortunes[Math.floor(Math.random() * fortunes.length)];
}

function sendToLog(logEntry) {
    console.log("Entered logEntry")
    const client = TableClient.fromConnectionString(
        process.env.ANALYTICS_CONNECTION_STRING,
        'fortunebot-analytics'
    );

    console.log(">1")
    console.log(logEntry)
    for (let key in logEntry) {
        if (logEntry.hasOwnProperty(key)) {
            logEntry[key] = String(logEntry[key]);
        }
    }
    console.log(">2")
    console.log(logEntry)
    console.log(">3")


    client.upsertEntity(logEntry)
        .then(() => {
            console.log('Log entry sent successfully');
        })
        .catch((error) => {
            console.error('Error sending log entry:', error);
        });
}


/**
 * Load the fortunes to memory
 */
loadFortuneDB()
console.log(`${fortunes.length} fortunes are loaded`)

/**
 * Create simple web service for debugging
 */
// const app = express()
// const port = process.env.PORT

// app.get('/', (req, res) => {
//   res.send(`${fortunes.length} fortunes are loaded`)
// })

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })


/**
 * Create the telegram bot
 */
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use((ctx, next) => {
    return next(ctx).then(() => {
        if (ctx.message) {
            var logEntry = {
                "updateType": ctx.updateType,
                "updateSubType": ctx.updateSubTypes,
                "messageId": ctx.message.message_id,
                "messageText": ctx.message.text,
                "messageDate": ctx.message.date,
                "fromId": ctx.message.from.id,
                "fromIsBot": ctx.message.from.is_bot,
                "fromFirstName": ctx.message.from.first_name,
                "fromLastName": ctx.message.from.last_name,
                "fromUsername": ctx.message.from.username,
                "fromLanguageCode": ctx.message.from.language_code,
                "chatId": ctx.message.chat.id,
                "chatType": ctx.message.chat.type,
                "chatTitle": ctx.message.chat.type === "group" ? ctx.update.message.chat.title : ""
            }
        } else if (ctx.updateType == 'inline_query') {
            var logEntry = {
                "updateType": ctx.updateType,
                "updateSubType": ctx.updateSubTypes,
                "updateId": ctx.update.update_id,
                "inlineQueryId": ctx.update.inline_query.id,
                "queryText": ctx.update.inline_query.query,
                "fromId": ctx.update.inline_query.from.id,
                "fromIsBot": ctx.update.inline_query.from.is_bot,
                "fromFirstName": ctx.update.inline_query.from.first_name,
                "fromLastName": ctx.update.inline_query.from.last_name,
                "fromUsername": ctx.update.inline_query.from.username,
                "fromLanguageCode": ctx.update.inline_query.from.language_code
            }
        } else if (ctx.updateType == "'chosen_inline_result'") {
            var logEntry = {
                "updateType": ctx.updateType,
                "updateSubType": ctx.updateSubTypes,
                "updateId": ctx.update.update_id,
                "queryText": ctx.update.chosen_inline_result.query,
                "resultId": ctx.update.chosen_inline_result.result_id,
                "fromId": ctx.update.chosen_inline_result.from.id,
                "fromIsBot": ctx.update.chosen_inline_result.from.is_bot,
                "fromFirstName": ctx.update.chosen_inline_result.from.first_name,
                "fromLastName": ctx.update.chosen_inline_result.from.last_name,
                "fromUsername": ctx.update.chosen_inline_result.from.username,
                "fromLanguageCode": ctx.update.chosen_inline_result.from.language_code
            }
        } else {
            var logEntry = {
                "updateType": ctx.updateType,
                "updateSubType": ctx.updateSubTypes,
            }
        }

        logEntry["partitionKey"] = ctx.updateType
        logEntry["rowKey"] = "id" + Math.random().toString(16).slice(2)

        sendToLog(logEntry);
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

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
