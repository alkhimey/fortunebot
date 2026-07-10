#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
ZIP_PATH="$DIST_DIR/fortunebot-lambda.zip"
LAMBDA_FUNCTION_NAME="${LAMBDA_FUNCTION_NAME:-arn:aws:lambda:eu-north-1:849578550483:function:fortunebot}"
AWS_REGION="${AWS_REGION:-eu-north-1}"

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI is required to upload the Lambda package" >&2
  exit 1
fi

mkdir -p "$DIST_DIR"
rm -f "$ZIP_PATH"

cd "$ROOT_DIR"
zip -qr "$ZIP_PATH" \
  lambda.js \
  server.js \
  package.json \
  package-lock.json \
  node_modules \
  fortunes \
  images/cowsay.png

echo "Built $ZIP_PATH"
echo "Uploading to $LAMBDA_FUNCTION_NAME in $AWS_REGION"

aws lambda update-function-code \
  --function-name "$LAMBDA_FUNCTION_NAME" \
  --zip-file "fileb://$ZIP_PATH" \
  --region "$AWS_REGION"
