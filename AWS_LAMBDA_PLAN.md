# AWS Lambda migration plan

## Target shape

Use one AWS Lambda function behind a Lambda Function URL. Telegram sends webhook updates to that URL, the handler passes each update to Telegraf, and Telegraf sends replies through the Telegram Bot API.

This avoids API Gateway, containers, databases, queues, and always-on servers.

## Recommended AWS resources

- Lambda runtime: `nodejs24.x`.
- Lambda architecture: `arm64`, unless a dependency blocks it.
- Public endpoint: Lambda Function URL with auth type `NONE`.
- Secret storage:
  - Simplest: encrypted Lambda environment variable named `BOT_TOKEN`.
  - More secure AWS-native option: AWS Secrets Manager or SSM Parameter Store, read once during cold start and cached in memory.
- Logging: CloudWatch Logs from `console.log`.

## Code changes needed

1. Keep `server.js` as local long-polling entrypoint for `npm start`.
2. Add a Lambda entrypoint, for example `lambda.js`, that:
   - reads and parses the Lambda Function URL request body,
   - optionally verifies Telegram's `x-telegram-bot-api-secret-token` header,
   - calls `bot.handleUpdate(update)`,
   - returns a `200` response quickly.
3. Do not call `bot.launch()` in Lambda.
4. Keep the fortunes loaded at module initialization so warm Lambda invocations reuse the in-memory list.

## Deployment steps

1. Create the Lambda function with Node.js 24.
2. Upload a zip containing `server.js`, the Lambda handler, `package.json`, `package-lock.json`, `node_modules`, and `fortunes/`.
3. Configure `BOT_TOKEN` as an environment variable, or configure Secrets Manager access and store only a secret name in the environment.
4. Create a Lambda Function URL with auth type `NONE`.
5. Generate a random webhook secret token and store it as `TELEGRAM_WEBHOOK_SECRET`.
6. Call Telegram `setWebhook` with:

   ```text
   https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<FUNCTION_URL>&secret_token=<TELEGRAM_WEBHOOK_SECRET>
   ```

7. Send `/fortune` to the bot and inspect CloudWatch Logs if it does not respond.

## Notes

- Telegram cannot call an AWS_IAM-protected Function URL, so use `NONE` and validate Telegram's webhook secret token in the handler.
- A plain encrypted Lambda environment variable is enough for a small personal bot. Use Secrets Manager if you want rotation, stricter auditability, or a cleaner production security posture.
- If persistent analytics are needed later, use DynamoDB instead of recreating the old Azure Table dependency.
