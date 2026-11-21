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
# Exceptions contrôlées sur le texte des PDF originaux.
manual={"BARNA.pdf":["257110","I.-D. BARNA","RO"],"GALVEZ MUNOZ.pdf":["197702","L. GALVEZ MUÑOZ","ES"],"GONZALES CASARES.pdf":["197718","N. GONZALEZ","ES","CASARES"],"GONZALES PONS.pdf":["125027","E. GONZÁLEZ PONS","ES"],"HANSEN N F.pdf":["257033","N. F. HANSEN","DK"],"HERRANZ GARCIA.pdf":["22418","M. E. HERRANZ GARCÍA","ES"],"KEFALOGIANNIS.pdf":["125068","M. KEFALOGIANNIS","EL"],"KYUCHUK.pdf":["124866","I. KYUCHYUK","BG"],"LENEARS.pdf":["95074","J. LENAERS","NL"],"LUCANO.pdf":["257129","D. LUCANO","IT"],"MAESTRE MARTIN.pdf":["197719","C. MAESTRE","ES","MARTÍN DE ALMAGRO"],"MCALIISTER.pdf":["124806","D. MCALLISTER","DE"],"MONTERO GIL.pdf":["245770","I. MONTERO GIL","ES"],"PEREZ FERNANDEZ.pdf":["257019","A. PÉREZ FERNÁNDEZ","ES"],"TARCZYNSKU.pdf":["204346","D. TARCZYŃSKI","PL"],"TEODORESCU.pdf":["257116","M.-G. TEODORESCU","RO"]}
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
            if filename in manual:
                mid,printed_name,country,*extra=manual[filename]
                candidates=[m for m,_,_,c in records if str(m["id"])==mid and c==country and printed_name in lines and country in cc and all(x in lines for x in extra)]
                if len(candidates)==1:
                    proposals[mid].append((candidates[0],filename,raw))
                    continue
                unmatched.append({"file":filename,"reason":"Exception non confirmée"})
                continue
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
