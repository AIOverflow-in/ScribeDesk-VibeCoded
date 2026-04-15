#!/usr/bin/env bash
set -e

echo "Installing system dependencies for weasyprint..."
apt-get update -qq && apt-get install -y -qq \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-xlib-2.0-0 \
    libffi-dev \
    shared-mime-info

echo "Installing Python dependencies..."
pip install -r requirements.txt
