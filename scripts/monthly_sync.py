#!/usr/bin/env python3
"""Monthly sync of current MEPs from the European Parliament's official XML list.
Preserves curated committee roles and other metadata for existing members.
Fails closed when the source format is unexpected; never empties the directory.
"""
import json
import os
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

SOURCE = "https://www.europarl.europa.eu/meps/en/full-list/xml"
MEMBERS = Path("members.json")
COUNTRIES = {
 "BE":"Belgium","BG":"Bulgaria","CZ":"Czechia","DK":"Denmark","DE":"Germany",
 "EE":"Estonia","IE":"Ireland","EL":"Greece","GR":"Greece","ES":"Spain",
 "FR":"France","HR":"Croatia","IT":"Italy","CY":"Cyprus","LV":"Latvia",
 "LT":"Lithuania","LU":"Luxembourg","HU":"Hungary","MT":"Malta","NL":"Netherlands",
 "AT":"Austria","PL":"Poland","PT":"Portugal","RO":"Romania","SI":"Slovenia",
 "SK":"Slovakia","FI":"Finland","SE":"Sweden"
}
GROUPS = {
 "Group of the European People's Party (Christian Democrats)":"PPE",
 "Group of the Progressive Alliance of Socialists and Democrats in the European Parliament":"S&D",
 "Patriots for Europe Group":"PfE",
 "European Conservatives and Reformists Group":"ECR",
 "Renew Europe Group":"Renew",
 "Group of the Greens/European Free Alliance":"Verts/ALE",
 "The Left group in the European Parliament - GUE/NGL":"The Left",
 "Europe of Sovereign Nations Group":"ESN",
 "Non-attached Members":"NI",
}
def text(node, *names):
    for name in names:
        for child in node.iter():
            key=child.tag.rsplit("}",1)[-1].lower()
            if key==name.lower() and child.text and child.text.strip():
                return child.text.strip()
    return ""

def fetch_xml():
    request=Request(SOURCE,headers={"User-Agent":"Mozilla/5.0 (compatible; EuropeanParliamentDirectory/1.0)","Accept":"application/xml,text/xml;q=0.9,*/*;q=0.5"})
    with urlopen(request,timeout=65) as response:
        data=response.read(8_000_000)
    return ET.fromstring(data)

def read_official(root):
    rows=[]
    for elem in root.iter():
        if elem.tag.rsplit("}",1)[-1].lower()!="mep":
            continue
        mid=text(elem,"id","mepId","persId")
        name=text(elem,"fullName","name")
        country=text(elem,"country","countryCode")
        group=text(elem,"politicalGroup","politicalGroupName","group")
        if not mid.isdigit() or not name or not country or not group:
            continue
        country=COUNTRIES.get(country.upper(),country)
        group=GROUPS.get(group)
        if group is None:
            raise ValueError("Unknown political group for "+mid+": "+str(text(elem,"politicalGroup","politicalGroupName","group")))
        if country not in COUNTRIES.values():
            raise ValueError("Unknown country for "+mid+": "+country)
        rows.append({"id":mid,"name":name,"country":country,"group":group})
    if not 680<=len(rows)<=735:
        raise ValueError("Unexpected MEP count: "+str(len(rows))+"; source may have changed")
    if len({x["id"] for x in rows})!=len(rows):
        raise ValueError("Duplicate IDs in official data")
    return rows

def main():
    current=json.loads(MEMBERS.read_text(encoding="utf-8"))
    official=read_official(fetch_xml())
    old={str(m["id"]):m for m in current}
    before=set(old)
    after={m["id"] for m in official}
    additions=sorted(after-before)
    departures=sorted(before-after)
    # A large change is almost certainly a parsing error, not a parliamentary reshuffle.
    if len(additions)>20 or len(departures)>20:
        raise ValueError("Suspicious membership change: +"+str(len(additions))+" / -"+str(len(departures)))
    now=datetime.now(timezone.utc).strftime("%Y-%m-%d")
    updated=[]
    changed_groups=[]
    for entry in official:
        mid=entry["id"]
        if mid in old:
            item=old[mid].copy()
            if item.get("group")!=entry["group"]:
                changed_groups.append({"name":item.get("name"),"from":item.get("group"),"to":entry["group"]})
            item.update({"name":entry["name"],"country":entry["country"],"group":entry["group"]})
        else:
            item={
                **entry,"lastName":entry["name"].split()[-1].title(),
                "groupLabel":"","gender":"UNKNOWN","genderSource":"",
                "role":"","coordinators":[],"committees":[],
                "parliamentaryFunctions":[]
            }
        item["membershipSource"]=SOURCE
        item["membershipCheckedAt"]=now
        updated.append(item)
    updated.sort(key=lambda m:(m.get("lastName") or m["name"]).casefold())
    result={
      "checkedAt":now,"total":len(updated),
      "newMembers":[{"id":m["id"],"name":m["name"]} for m in official if m["id"] in additions],
      "departedMembers":[{"id":mid,"name":old[mid]["name"]} for mid in departures],
      "changedGroups":changed_groups,
      "scope":"Current roster, names, countries and political groups. Committee positions and functions unchanged pending official cross-check."
    }
    Path("monthly-sync-report.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    serialized=json.dumps(updated,ensure_ascii=False,separators=(",",":"))
    if serialized!=MEMBERS.read_text(encoding="utf-8").strip():
        MEMBERS.write_text(serialized+"\n",encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=="__main__":
    main()
