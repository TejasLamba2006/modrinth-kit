#!/usr/bin/env bash
# End-to-end run against staging-api.modrinth.com. Needs MODRINTH_STAGING_TOKEN with project,
# version, collection, org, thread, user-write scopes and a verified email on the staging account.
# Creates throwaway resources and deletes them again. Usage: npm run build && bash test/staging.sh
set -euo pipefail
: "${MODRINTH_STAGING_TOKEN:?set MODRINTH_STAGING_TOKEN}"
ROOT=$(cd "$(dirname "$0")/.." && pwd)
W=$(mktemp -d)
cd "$W"
M() { node "$ROOT/dist/cli/index.js" --staging "$@"; }
S="mk-ci-$(date +%s)"
fail=0
step() {
  local name=$1 want=$2; shift 2
  set +e; out=$(M "$@" 2>&1); code=$?; set -e
  if [ "$code" = "$want" ]; then echo "ok   $name"; else echo "FAIL $name (exit $code, want $want): ${out:0:300}"; fail=1; fi
}
json() { node -e "process.stdout.write(String((${1})(JSON.parse(require('fs').readFileSync(0,'utf8')))))"; }

# fixtures: two PNGs and a minimal Paper plugin jar
node -e '
const z=require("zlib"),fs=require("fs");
function png(r,g,b,w=200){const raw=Buffer.alloc((w*3+1)*w);for(let y=0;y<w;y++)for(let x=0;x<w;x++){const o=y*(w*3+1)+1+x*3;raw[o]=r;raw[o+1]=g;raw[o+2]=b}
const c=(t,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t),d]);const cr=Buffer.alloc(4);cr.writeUInt32BE(z.crc32(td)>>>0);return Buffer.concat([l,td,cr])};
const h=Buffer.alloc(13);h.writeUInt32BE(w,0);h.writeUInt32BE(w,4);h[8]=8;h[9]=2;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),c("IHDR",h),c("IDAT",z.deflateSync(raw)),c("IEND",Buffer.alloc(0))])}
fs.writeFileSync("icon.png",png(200,50,50));fs.mkdirSync("gallery");fs.writeFileSync("gallery/shot.png",png(10,120,200));
// stored (uncompressed) zip with plugin.yml
const name=Buffer.from("plugin.yml"),data=Buffer.from("name: MkCi\nversion: 0.0.1\nmain: mk.Main\napi-version: \"1.21\"\n");
const crc=z.crc32(data)>>>0,lh=Buffer.alloc(30);lh.writeUInt32LE(0x04034b50,0);lh.writeUInt16LE(20,4);lh.writeUInt32LE(crc,14);lh.writeUInt32LE(data.length,18);lh.writeUInt32LE(data.length,22);lh.writeUInt16LE(name.length,26);
const cd=Buffer.alloc(46);cd.writeUInt32LE(0x02014b50,0);cd.writeUInt16LE(20,4);cd.writeUInt16LE(20,6);cd.writeUInt32LE(crc,16);cd.writeUInt32LE(data.length,20);cd.writeUInt32LE(data.length,24);cd.writeUInt16LE(name.length,28);
const off=30+name.length+data.length,eo=Buffer.alloc(22);eo.writeUInt32LE(0x06054b50,0);eo.writeUInt16LE(1,8);eo.writeUInt16LE(1,10);eo.writeUInt32LE(46+name.length,12);eo.writeUInt32LE(off,16);
fs.writeFileSync("plugin.jar",Buffer.concat([lh,name,data,cd,name,eo]));'

step whoami 0 auth whoami
step create 0 project create --slug "$S" --title "MK CI $S" --summary "modrinth-kit nightly test" --license-id MIT --client-side unsupported --server-side required
PID=$(M project check-slug "$S" | json 'x=>x.id')
step update 0 project update "$S" --title "MK CI renamed" --source-url https://github.com/TejasLamba2006/modrinth-kit
step status-needs-confirm 4 project update "$S" --status archived
step icon 0 project icon set "$S" icon.png
step gallery-add 0 gallery add "$S" gallery/shot.png --title Shot --featured
step version-create 0 version create "$S" --version-number 0.0.1 --files plugin.jar --loaders paper --game-versions 1.21.1 --changelog first
VID=$(M version get 0.0.1 --project "$S" | json 'x=>x.id')
step version-update 0 version update "$VID" --changelog edited --featured
step from-hash 0 version from-hash "$(sha1sum plugin.jar | cut -d' ' -f1)"
step disclosures 0 project disclosures set "$S" --input '{"set":[{"type":"telemetry","consent":"opt_in","data_collected":["errors"]}]}'
step thread-send 0 thread send --project "$S" --body "nightly test"
step collection-create 0 collection create --name "MK CI $S" --projects "$PID"
CID=$(M collection list | json "l=>l.find(c=>c.name==='MK CI $S').id")
step collection-delete 0 collection delete "$CID" --yes

cat > modrinth.toml <<EOF
project = "$S"
[metadata]
summary = "synced by nightly"
[[gallery]]
file = "gallery/shot.png"
title = "Shot"
description = "synced"
featured = true
[version]
files = ["plugin.jar"]
loaders = ["paper"]
game_versions = ["1.21.1"]
changelog = "from manifest"
EOF
step sync 0 sync
step sync-idempotent 0 sync --dry-run
M sync --dry-run | grep -q '"upToDate":true' || { echo "FAIL sync not idempotent"; fail=1; }
step publish-skip 0 publish 0.0.1
step version-delete-preview 4 version delete "$VID"
step version-delete 0 version delete "$VID" --yes
step project-delete 0 project delete "$S" --yes
step gone 2 project get "$S"

rm -rf "$W"
exit $fail
