#!/usr/bin/env bash
set -euo pipefail

cd ~/Maritime-CMS
git pull origin main
cd backend
npm install
pm2 restart backend
