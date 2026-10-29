#!/bin/sh
# The e-Cidadania cache lives in tmpfs. The official nginx entrypoint runs
# this as root before nginx starts; the worker user must own the directory.
set -e
mkdir -p /dev/shm/ecidadania
chown nginx:nginx /dev/shm/ecidadania
chmod 700 /dev/shm/ecidadania
