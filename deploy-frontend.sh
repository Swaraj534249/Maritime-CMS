#!/usr/bin/env bash
set -euo pipefail

cd ~/Maritime-CMS
git pull origin main
cd frontend
npm install
rm -rf build
npm run build
sudo systemctl reload nginx
