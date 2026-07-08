#!/usr/bin/env bash
set -euo pipefail

PROJECT_REF="tdfpzuewwziofsbmjxdj"

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" || -z "${TELEGRAM_CHAT_ID:-}" ]]; then
  echo "Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID before running."
  exit 1
fi

npx supabase secrets set \
  --project-ref "$PROJECT_REF" \
  TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" \
  TELEGRAM_CHAT_ID="$TELEGRAM_CHAT_ID" \
  NOTIFY_CHANNEL=telegram

npx supabase functions deploy notify-new-idea --project-ref "$PROJECT_REF"

echo "Deployed notify-new-idea."
echo "Next: create Database Webhook on public.ideas INSERT -> notify-new-idea"
