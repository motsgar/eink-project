#!/usr/bin/env bash

# For some mystery reason nvm fails to source if there exists a .nvmrc file in cwd when sourcing..
# As a workaround we just cd to / before sourcing
pushd /
source /nvm/nvm.sh
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
    echo "Error: Failed to source /nvm/nvm.sh"
    echo "Exit code: $EXIT_CODE"
    exit $EXIT_CODE
else
    echo "Successfully sourced /nvm/nvm.sh"
fi
popd

# Kind of cursed source instead of exec, but it retains the custom bash functions
source "$@"
