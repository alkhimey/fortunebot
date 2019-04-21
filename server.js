#!/usr/bin/env node

const Telegraf = require('telegraf')

//const bot = new Telegraf(process.env.BOT_TOKEN)
const bot = new Telegraf("bot880639911:AAF9e-hBEsTwdHhRrtRj93rshpix1bZ9WE0")
console.log("Created Bot")
bot.start((ctx) => ctx.reply('Welcome!'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))

//bot.launch()

bot.launch({
    webhook: {
      domain: 'https://fortunebot.azurewebsites.net',
      port: 3000
  }
})
//bot.startPolling([timeout], [limit], [allowedUpdates], [stopCallback])

