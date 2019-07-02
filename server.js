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

function sendToLog(logType, logEntry) {

    //console.log('Azure Log Analysis Data Collector Function received a request');

    // required node.js libraries
    var https = require('https');
    var crypto = require('crypto');

    // Azure Log Analysis credentials
    var workspaceId =  process.env.WORKSPACE_ID; // 'xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
    var sharedKey = process.env.SHARED_KEY; // 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

    var apiVersion = '2016-04-01';
    var processingDate = new Date().toUTCString();

    var data = JSON.stringify(logEntry);

    var contentLength = Buffer.byteLength(data, 'utf8');

    var stringToSign = 'POST\n' + contentLength + '\napplication/json\nx-ms-date:' + processingDate + '\n/api/logs';
    var signature = crypto.createHmac('sha256', new Buffer(sharedKey, 'base64')).update(stringToSign, 'utf-8').digest('base64');
    var authorization = 'SharedKey ' + workspaceId + ':' + signature;

    var headers = {
        "content-type": "application/json",
        "Authorization": authorization,
        "Log-Type": logType,
        "x-ms-date": processingDate
    };

    var options = {
        hostname: workspaceId + '.ods.opinsights.azure.com',
        port: 443,
        path: '/api/logs?api-version=' + apiVersion,
        method: 'POST',
        headers: headers
    };

    var req = https.request(options, function (res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
        });
    });

    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });

    // write data to request body
    console.log(data);
    req.write(data);
    req.end();

    /*
    request.post({ url: url, headers: headers, body: data }, function (error, response, body) {

        console.log('error:', error);
        console.log('statusCode:', response && response.statusCode);
        console.log('body:', body);

    });*/
};


loadFortuneDB();

console.log("Total fortunes in DB: " + fortunes.length)

const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)

var util = require('util')


bot.use((ctx, next) => {
    const start = new Date()
    return next(ctx).then(() => {
      const ms = new Date() - start

      var my_json = {
          "update type" : ctx.updateType,
          "update sub type" : ctx.updateSubTypes,
          "message id" : ctx.update.message.message_id,
          "message text" : ctx.update.message.text,
          "message date" : ctx.update.message.date,
          "from id" : ctx.update.message.from.id,
          "from is bot" : ctx.update.message.from.is_bot,
          "from first name" : ctx.update.message.from.first_name,
          "from last name" : ctx.update.message.from.last_name,
          "from username" : ctx.update.message.from.username,
          "from language code" : ctx.update.message.from.language_code,
          "chat id" : ctx.update.message.chat.id,
          "chat type" : ctx.update.message.chat.type,
          "chat title" : ctx.update.message.chat.type == "group" ? ctx.update.message.chat.title : ""
      }

      sendToLog("fortunebot_request", my_json);
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

