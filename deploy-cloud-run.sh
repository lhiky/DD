#!/usr/bin/env bash
# @license
# SPDX-License-Identifier: Apache-2.0
#
# Deploys the SPR server to Cloud Run. Expects the secrets below to already
# exist in Secret Manager under the given names, and a dedicated service
# account (not the default compute SA) with the Secret Manager Secret Accessor
# and Firebase Authentication Admin roles.
#
# NOTE: secret names below match what src/db/index.ts and server.ts actually
# read (SQL_HOST / SQL_USER / SQL_PASSWORD / SQL_DB_NAME) — a prior version of
# this script referenced DATABASE_URL, which the app never reads. Keep these
# in sync with .env.example if either changes.

set -euo pipefail

SERVICE_NAME="${SERVICE_NAME:-spr-server}"
REGION="${REGION:-us-central1}"
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID to your GCP project id}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:?Set SERVICE_ACCOUNT to the dedicated Cloud Run service account email}"

echo "Building and deploying ${SERVICE_NAME} to ${PROJECT_ID}/${REGION}..."

gcloud run deploy "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --source . \
  --service-account "${SERVICE_ACCOUNT}" \
  --min-instances 1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,ENFORCE_HTTPS=true,TRUST_PROXY=true,ALLOW_IFRAME=false" \
  --set-secrets "\
GEMINI_API_KEY=GEMINI_API_KEY:latest,\
API_SECRET_KEY=API_SECRET_KEY:latest,\
VITE_API_SECRET_KEY=VITE_API_SECRET_KEY:latest,\
SQL_HOST=SQL_HOST:latest,\
SQL_USER=SQL_USER:latest,\
SQL_PASSWORD=SQL_PASSWORD:latest,\
SQL_DB_NAME=SQL_DB_NAME:latest,\
STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,\
VITE_STRIPE_PUBLISHABLE_KEY=VITE_STRIPE_PUBLISHABLE_KEY:latest,\
STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest,\
SENTRY_DSN=SENTRY_DSN:latest"

echo "Deployed. Run 'gcloud run services describe ${SERVICE_NAME} --region ${REGION}' for the URL."
