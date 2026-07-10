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

const FORTUNES_DIR = "fortunes/";
const botToken = process.env.BOT_TOKEN;

if (!botToken) {
    throw new Error("BOT_TOKEN environment variable is required");
}

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

/**
 * Load the fortunes to memory
 */
loadFortuneDB()
console.log(`${fortunes.length} fortunes are loaded`)

/**
 * Create the telegram bot
 */
const bot = new Telegraf(botToken)

bot.use((ctx, next) => {
    return next(ctx).then(() => {
        let logEntry;

        if (ctx.message) {
            logEntry = {
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
            logEntry = {
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
        } else if (ctx.updateType == "chosen_inline_result") {
            logEntry = {
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
            logEntry = {
                "updateType": ctx.updateType,
                "updateSubType": ctx.updateSubTypes,
            }
        }

        console.log(JSON.stringify(logEntry));
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

if (require.main === module) {
    bot.launch()

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
}

module.exports = {
    bot,
    getFortune,
}
