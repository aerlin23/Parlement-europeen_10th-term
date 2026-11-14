"""Importer les PDF d'origine sans modifier leur mise en page.
Ne publier que les correspondances uniques vérifiées par le texte du PDF.
"""
import collections
import json
import pathlib
import re
import unicodedata
import zipfile
import fitz

root=pathlib.Path(".")
countries=dict(zip("Austria Belgium Bulgaria Croatia Cyprus Czechia Denmark Estonia Finland France Germany Greece Hungary Ireland Italy Latvia Lithuania Luxembourg Malta Netherlands Poland Portugal Romania Slovakia Slovenia Spain Sweden".split(),"AT BE BG HR CY CZ DK EE FI FR DE EL HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split()))
countries["Czech Republic"]="CZ"
codes=set(countries.values())|{"GR"}
def key(s):
    s=str(s).upper().translate(str.maketrans({"Ł":"L","Ø":"O","Đ":"D","Ð":"D","Æ":"AE","Œ":"OE","ẞ":"SS","Þ":"TH"}))
    return re.sub(r"[^A-Z0-9]","",unicodedata.normalize("NFKD",s))
members=json.loads((root/"members.json").read_text(encoding="utf-8"))
assert len({str(m["id"]) for m in members})==len(members)
records=[]
for m in members:
    surname=key(m.get("lastName") or "")
    first=key(m["name"])[:1]
    if surname and first and countries.get(m["country"]):
        records.append((m,surname,first,countries[m["country"]]))
proposals=collections.defaultdict(list)
unmatched=[]
for archive in ("cavaliers-1.zip","cavaliers-2.zip"):
    with zipfile.ZipFile(root/archive) as z:
        for entry in z.infolist():
            filename=pathlib.PurePosixPath(entry.filename).name
            if not filename.lower().endswith(".pdf") or filename.startswith("NI Membres"):
                continue
            raw=z.read(entry)
            try:
                with fitz.open(stream=raw,filetype="pdf") as doc:
                    if len(doc)!=1:
                        raise ValueError("PDF multipage")
                    lines=[x.strip() for x in doc[0].get_text().splitlines() if x.strip()]
            except Exception as e:
                unmatched.append({"file":filename,"reason":str(e)})
                continue
            cc={x for x in lines if x in codes}
            if "GR" in cc:cc.add("EL")
            visible=[key(x) for x in dict.fromkeys(lines) if x not in codes]
            printed="".join(visible)
            printed_initial=printed[:1]
            stem=key(pathlib.PurePosixPath(filename).stem)
            candidates=[]
            for m,surname,first,country in records:
                if country not in cc or printed_initial!=first:
                    continue
                exact=stem in {surname,surname+first,first+surname}
                if surname not in printed:
                    continue
                if not exact and not (len(stem)>=4 and surname.startswith(stem)):
                    continue
                candidates.append(m)
            if len(candidates)!=1:
                unmatched.append({"file":filename,"reason":"Correspondance non unique ou non confirmée","candidates":[m["name"] for m in candidates]})
                continue
            m=candidates[0]
            proposals[str(m["id"])].append((m,filename,raw))
out=root/"cavaliers"
out.mkdir(exist_ok=True)
manifest={}
for mid, matches in proposals.items():
    if len(matches)!=1 or not mid.isdigit():
        unmatched.extend({"file":name,"reason":"Plusieurs PDF pour le même député"} for _,name,_ in matches)
        continue
    m,filename,raw=matches[0]
    (out/(mid+".pdf")).write_bytes(raw)
    manifest[mid]={"name":m["name"],"country":m["country"],"original":filename}
# Ne garder que les fichiers correspondant à l'inventaire actuel.
for p in out.glob("*.pdf"):
    if p.stem not in manifest:p.unlink()
(out/"index.json").write_text(json.dumps({"entries":manifest},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
missing=[{"id":str(m["id"]),"name":m["name"],"country":m["country"]} for m in members if str(m["id"]) not in manifest]
(out/"import-report.json").write_text(json.dumps({"matched":len(manifest),"unmatched_files":unmatched,"missing_members":missing},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"{len(manifest)}/{len(members)} correspondances vérifiées ; {len(unmatched)} fichiers à contrôler.")
if not manifest:raise SystemExit("Aucune association vérifiée")
