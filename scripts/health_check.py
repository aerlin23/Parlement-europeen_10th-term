#!/usr/bin/env python3
"""Public site health check; exits nonzero on real critical failures."""
import json
import sys
from urllib.request import urlopen,Request
BASE="https://aerlin23.github.io/Parlement-europeen_10th-term/"
def get(path,limit=1500000):
    req=Request(BASE+path,headers={"User-Agent":"Trombinoscope-PE-Healthcheck/1.0"})
    with urlopen(req,timeout=35) as res:
        if res.status!=200:raise RuntimeError(f"{path}: HTTP {res.status}")
        data=res.read(limit)
        if not data:raise RuntimeError(f"{path}: empty response")
        return data
def main():
    page=get("")
    assert b'id="quizMode"' in page, "Quiz mode selector disappeared"
    assert b'value="name-photo"' in page and b'value="photo-name"' in page, "Quiz mode unavailable"
    members=json.loads(get("members.json"))
    assert 680<=len(members)<=735, "Unexpected number of MEPs"
    assert len({str(m["id"]) for m in members})==len(members), "Duplicate MEP ids"
    json.loads(get("committees.json"))
    manifest=json.loads(get("manifest.webmanifest"))
    assert manifest["display"]=="standalone", "PWA manifest invalid"
    get("sw.js")
    get("icon-192.png")
    print("OK: site, PWA, JSON, roster and both quiz modes; members:",len(members))
if __name__=="__main__":
    try:main()
    except Exception as exc:
        print("FAIL:",repr(exc),file=sys.stderr)
        raise SystemExit(1)
