#!/usr/bin/env bash
cd "$(dirname "$0")"
git add -A
git commit -m "fix: disable authentication middleware - all routes accessible"
git push origin main
echo "Changes pushed successfully!"

