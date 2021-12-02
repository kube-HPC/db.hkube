#!/usr/bin/env bash
echo "Creating mongo users..."
mongo admin --host localhost -u admin -p admin --eval "db.createUser({user: 'tester', pwd: 'password', roles: [{role: 'readWrite', db: 'tests'}]});"
echo "Mongo users created."