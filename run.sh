#!/bin/sh

set -e

echo "DO00XH3ZUJ9233XJHE93:wsCGcu6KKAJ1TXPlWffoFIOvGTTll0CdyTEDIDEU2aw" > ${HOME}/.passwd-s3fs && chmod 600 ${HOME}/.passwd-s3fs
s3fs "ambicamretail" "$MNT_POINT" \
     -o passwd_file=${HOME}/.passwd-s3fs \
     -o url="https://blr1.digitaloceanspaces.com/" \
     -o use_path_request_style 

      