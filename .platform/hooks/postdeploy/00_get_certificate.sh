#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d domain.com --nginx --agree-tos --email example@example.com