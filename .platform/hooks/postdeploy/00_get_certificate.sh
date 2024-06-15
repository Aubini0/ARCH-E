#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d arch-e.us-east-1.elasticbeanstalk.com --nginx --agree-tos --email devroless@gmail.com