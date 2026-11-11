#!/usr/bin/env python3
"""Import verified MEP seat assignments from official EP hemicycle plans."""
import collections, io, json, os, re, subprocess, tempfile, unicodedata, urllib.request
from pathlib import Path
import fitz
from PIL import Image, ImageEnhance

ROOT=Path(__file__).resolve().parents[1]
URLS={'str':'https://www.europarl.europa.eu/sedcms/pubfile/HEMICYCLE/PLAN_STR.pdf','bru':'https://www.europarl.europa.eu/sedcms/pubfile/HEMICYCLE/PLAN_BRU.pdf'}
SHA256={'str':'66e4785f96b1d9f8772d8cf1e9ea67fc926741ebffa58669afb692688dc063ae','bru':'82cf4073bba7c3d70d6f4b274770bdef844c5f3b420a66345b730c0384bfcaf3'}
def norm(s):
 s=unicodedata.normalize('NFKD',str(s).upper()).encode('ascii','ignore').decode()
 return re.sub(r'[^A-Z0-9]+',' ',s).strip()
def pdf_bytes(kind):
 import hashlib
 local=ROOT/('PLAN_'+kind.upper()+'.pdf')
 if local.exists(): data=local.read_bytes()
 else:
  req=urllib.request.Request(URLS[kind],headers={'User-Agent':'Mozilla/5.0'})
  with urllib.request.urlopen(req,timeout=45) as f:data=f.read()
 digest=hashlib.sha256(data).hexdigest()
 if digest!=SHA256[kind]:raise ValueError(f'{kind} PDF changed: {digest}; manual verification required')
 return data
def str_index(data):
 p=fitz.open(stream=data,filetype='pdf')[0]
 matches=[]
 for b in p.get_text('blocks'):
  if len(b[4])<1000:continue
  for line in b[4].splitlines():
   m=re.match(r'^(.*?)\s*\.\s*(?:\.\s*)*(\d{1,3})\s*$',line)
   if m:matches.append((norm(m.group(1)),int(m.group(2))))
 return matches
def bru_index(data):
 p=fitz.open(stream=data,filetype='pdf')[1]
 pix=p.get_pixmap(matrix=fitz.Matrix(400/72,400/72),alpha=False)
 im=Image.open(io.BytesIO(pix.tobytes('png'))).convert('L')
 if abs(im.width-6615)>100:raise ValueError('Unexpected Brussels plan layout')
 matches=[]
 with tempfile.TemporaryDirectory() as tmp:
  for k in range(12):
   x=125+529*k
   crop=ImageEnhance.Contrast(im.crop((x,0,min(im.width,x+500),3500))).enhance(1.6)
   path=Path(tmp)/f'{k}.png';crop.save(path)
   env=dict(os.environ,OMP_THREAD_LIMIT='1')
   result=subprocess.run(['tesseract',str(path),'stdout','--psm','6','-l','eng'],capture_output=True,text=True,env=env,check=True).stdout
   for line in result.splitlines():
    m=re.match(r'^\s*(\d{1,3})[\s\._—–-]+([A-Za-zÀ-ÿ].*?)\s*$',line)
    if not m:continue
    seat=int(m.group(1));label=norm(m.group(2))
    if 1<=seat<=900 and label and not re.search(r'\b\d{2,3}\b',label):matches.append((label,seat))
 return matches
def unique_pairs(pairs):
 d=collections.defaultdict(set)
 for key,val in pairs:d[key].add(val)
 return {key:next(iter(v)) for key,v in d.items() if len(v)==1}
def main():
 members=json.loads((ROOT/'members.json').read_text(encoding='utf-8'))
 file=ROOT/'hemicycle-seats.json'
 state=json.loads(file.read_text(encoding='utf-8'))
 pairs={'str':unique_pairs(str_index(pdf_bytes('str'))),'bru':unique_pairs(bru_index(pdf_bytes('bru')))}
 indexed=collections.defaultdict(list)
 for m in members:indexed[norm(m.get('lastName',''))].append(m)
 updates=collections.defaultdict(dict);counts=collections.Counter()
 for chamber,mapping in pairs.items():
  reverse=collections.Counter(mapping.values())
  for label,num in mapping.items():
   matches=indexed.get(label,[])
   if len(matches)!=1 or reverse[num]!=1:continue
   updates[str(matches[0]['id'])][chamber]=num
   counts[chamber]+=1
 print('Coverage:',dict(counts),'PDF names:',{k:len(v) for k,v in pairs.items()})
 if counts['str']<600 or counts['bru']<350:raise ValueError('Insufficient coverage; no output written')
 seats={k:dict(v) for k,v in state.get('seats',{}).items()}
 for ident,vals in updates.items():seats.setdefault(ident,{}).update(vals)
 state['seats']=dict(sorted(seats.items(),key=lambda x:int(x[0])))
 state['source']='https://www.europarl.europa.eu/plenary/fr/hemicycle.html'
 state['plans']={'str':{'date':'2026-10-19','url':URLS['str']},'bru':{'date':'2026-11-11','url':URLS['bru']}}
 state['notes']='PDF officiels vérifiés par empreinte SHA-256. Attribution uniquement lorsque le nom de famille identifie un député de façon unique. Absences laissées inchangées.'
 file.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('Total MEPs with seats:',len(seats))
if __name__=='__main__':main()
