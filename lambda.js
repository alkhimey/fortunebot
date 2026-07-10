const { bot } = require('./server');

function getHeader(headers, name) {
    if (!headers) {
        return undefined;
    }

    const headerName = name.toLowerCase();
    const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === headerName);
    return key ? headers[key] : undefined;
}

function parseBody(event) {
    if (!event.body) {
        return undefined;
    }

    const body = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body;

    return JSON.parse(body);
}

exports.handler = async (event) => {
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (webhookSecret) {
        const requestSecret = getHeader(event.headers, 'x-telegram-bot-api-secret-token');

        if (requestSecret !== webhookSecret) {
            console.warn('Rejected request with invalid Telegram webhook secret');
            return {
                statusCode: 401,
                body: 'Unauthorized',
            };
        }
    }

    const update = parseBody(event);

    if (!update) {
        return {
            statusCode: 400,
            body: 'Missing Telegram update',
        };
    }

    await bot.handleUpdate(update);

    return {
        statusCode: 200,
        body: 'OK',
    };
};
