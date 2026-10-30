import json, re, subprocess, os, sys
sys.path.insert(0,'/tmp/claude-0/-home-user-furqan/cbffd8e0-3cf6-59ff-9cd1-e3c3c6b124a3/scratchpad')
from narr import N
D='/home/user/furqan/documentary-ep8'
rows={r[0]:r for r in json.load(open('/tmp/claude-0/-home-user-furqan/cbffd8e0-3cf6-59ff-9cd1-e3c3c6b124a3/scratchpad/rows.json'))}
ay=json.load(open('/tmp/claude-0/-home-user-furqan/cbffd8e0-3cf6-59ff-9cd1-e3c3c6b124a3/scratchpad/ayat.json'))
TITLES={1:"সূচনা",2:"চরিত্র ও নেতৃত্ব",3:"প্রথম অগ্রাধিকার: অভ্যন্তরীণ সংস্কার",4:"ফিলিস্তিন: সবচেয়ে বড় পরীক্ষা",5:"যুক্তরাষ্ট্রের সঙ্গে সম্পর্ক",6:"ইরান ও মুসলিম বিশ্ব",7:"তেল ও অর্থনৈতিক শক্তি",8:"প্রযুক্তি ও কৃত্রিম বুদ্ধিমত্তা",9:"ওআইসি-কে কার্যকর করা",10:"গণমাধ্যম ও বৈশ্বিক যোগাযোগ",11:"মানবিক দায়িত্ব",12:"রাষ্ট্র ও সমাজ সংস্কার",13:"শেষ ভাবনা"}
BG={1:['black','globe','network'],2:['pattern','dunes'],3:['pattern','network'],4:['network_red','network','globe'],5:['globe','network'],6:['network','pattern_dark'],7:['bars','dunes','light'],8:['network','pattern_dark'],9:['globe','network'],10:['network','pattern'],11:['dunes','pattern_dark'],12:['light','pattern'],13:['globe','light','black']}
# ---- scene windows
LEAD=3.0
scenes={}
for k in range(1,14):
    r=rows[k]; scenes[k]=(r[2]-LEAD, r[3])   # includes lead-in and tail
END=scenes[13][1]+14.0   # extra time for final cards
scenes[13]=(scenes[13][0], END)
# ---- cues from SRT
def pt(s):
    h,m,x=s.split(':'); sec,ms=x.split(','); return int(h)*3600+int(m)*60+int(sec)+int(ms)/1000
cues=[]
for blk in open(f'{D}/subtitles-ESTIMATED.srt',encoding='utf-8').read().strip().split('\n\n'):
    L=blk.split('\n'); a,b=L[1].split(' --> '); cues.append((pt(a),pt(b),' '.join(L[2:])))
def cue(sub,nth=0):
    m=[c for c in cues if sub in c[2]]
    if not m: raise SystemExit('cue not found: '+sub)
    return m[nth]
def T(x):
    h=int(x//3600); m=int(x%3600//60); s=x%60; return f"{h}:{m:02d}:{s:05.2f}"
ev=[]
evj=[]
def add(style,a,b,text,layer=1):
    ev.append((layer,f"Dialogue: {layer},{T(a)},{T(b)},{style},,0,0,0,,{text}"))
    m=re.search(r'\\fs(\d+)',text); clean=re.sub(r'\{[^}]*\}','',text).replace('\\N','\n')
    evj.append(dict(style=style,a=a,b=b,text=clean,size=int(m.group(1)) if m else None,layer=layer))
# subtitles (burned)
for a,b,t in cues: add('Sub',a,b,t,5)
# scene title cards in lead-in
for k in range(1,14):
    a=scenes[k][0]
    if k==1: continue
    add('SceneNo',a+0.2,a+LEAD+1.2,r"{\fad(500,600)}দৃশ্য "+f"{k:02d}")
    add('SceneTitle',a+0.2,a+LEAD+1.2,r"{\fad(500,600)}"+TITLES[k])
# persistent disclaimer + draft mark
add('Corner',0,END,"কাল্পনিক বিশ্লেষণ — ঐতিহাসিক দাবি নয়",9)
add('Draft',0,END,"খসড়া কাট · ভয়েসওভার ও সিনেমাটিক ক্লিপ এখনও যুক্ত হয়নি",9)
def LT(a,b,text): add('LT',a,b,r"{\fad(300,400)}"+text,3)
def AY(a,b,ref,arabic,meaning=None,size=84):
    add('AyRef',a,b,r"{\fad(500,600)}"+ref,3)
    add('Ar',a,b,r"{\fad(500,600)\fs"+str(size)+"}"+arabic,3)
    if meaning: add('AyMean',a,b,r"{\fad(500,600)}"+meaning,3)
# --- scene 1
c=cue('আজকের এই গবেষণায়'); add('Title',c[0]-0.5,c[0]+13,r"{\fad(900,900)}রাসূলুল্লাহ (সা.)"+r"\Nযদি ২০২৬ সালে থাকতেন",4); add('TitleSub',c[0]+1.2,c[0]+13,r"{\fad(900,900)}আধুনিক বিশ্বে নবীজির আদর্শ ও সম্ভাব্য নেতৃত্ব",4)
c=cue('এটি কোনো ঐতিহাসিক ঘটনা নয়'); add('Notice',c[0],c[0]+9,r"{\fad(400,500)}কাল্পনিক বিশ্লেষণ, ঐতিহাসিক দাবি নয়",4)
# --- scene 2
c=cue('পবিত্র কুরআনে আল্লাহ'); AY(c[0],c[1]+6,'সূরা আল-কলম — ৬৮:৪',ay['68:4'],'"নিশ্চয়ই আপনি মহান চরিত্রের অধিকারী।"',92)
c=cue('হযরত আয়েশা'); LT(c[0],c[1]+4,'সহীহ মুসলিম ৭৪৬ — আয়েশা (রা.): "নিশ্চয়ই আল্লাহর নবীর চরিত্র ছিল কুরআন" (যাচাইকৃত)')
# --- scene 3
c=cue('প্রথমত, দুর্নীতি'); LT(c[0],c[1]+5,'সুনান আবু দাউদ ৩৫৮০ (সহীহ) — ঘুষদাতা ও ঘুষগ্রহীতা অভিশপ্ত')
c=cue('দ্বিতীয়ত, শ্রমিকের'); LT(c[0],c[1]+6,'সুনান ইবনে মাজাহ ২৪৪৩ (সহীহ) — "ঘাম শুকানোর আগে শ্রমিকের মজুরি দাও"')
# --- scene 4
c=cue('মদিনায় মুহাজির'); LT(c[0],c[1]+3,'মুহাজির–আনসার ভ্রাতৃত্ব — সীরাহ সূত্র (ইবনে হিশাম)')
c=cue('১৯৭৩ সালের'); LT(c[0],c[1]+6,'১৯৭৩–৭৪ আরব তেল নিষেধাজ্ঞা — সূত্র: US Office of the Historian')
# --- scene 5,6
c=cue('হুদায়বিয়ার'); LT(c[0],c[1]+3,'হুদায়বিয়ার সন্ধি — সীরাহ সূত্র (ইবনে হিশাম)')
c=cue('মদিনায় বিভিন্ন'); LT(c[0],c[1]+3,'মদিনা সনদ — সূত্র: ইবনে হিশাম; মুহাম্মদ হামীদুল্লাহ')
# --- scene 7
c=cue('পবিত্র কুরআনের সূরা আর-রহমান'); AY(c[0],c[1]+9,'সূরা আর-রহমান — ৫৫:৭–৯',ay['55:7']+"\\N"+ay['55:8']+"\\N"+ay['55:9'],None,70)
# --- scene 8
c=cue('সিরাহগ্রন্থের'); LT(c[0],c[1]+3,'খন্দকের যুদ্ধ — সীরাহ সূত্র (ইবনে হিশাম)')
c=cue('একটি আধুনিক বায়তুল'); LT(c[0],c[1]+3,'বায়তুল হিকমাহ — আব্বাসীয় যুগের জ্ঞানকেন্দ্র')
# --- scene 9
c=cue('বিশ্বের ৫৭টি'); LT(c[0],c[1]+3,'ইসলামি সহযোগিতা সংস্থা (OIC) — ৫৭ সদস্যরাষ্ট্র (সূত্র: oic-oci.org)')
# --- scene 10
c=cue('হাসান ইবনে সাবিত'); LT(c[0],c[1]+4,'সহীহ বুখারী ৩২১২ — "আমার পক্ষ থেকে জবাব দাও" (যাচাইকৃত)')
# --- scene 11
c=cue('সূরা আন-নিসার'); AY(c[0],c[1]+12,'সূরা আন-নিসা — ৪:৭৫',ay['4:75'],None,50)
# --- scene 13
c=cue('দুর্বল হয়ো না'); AY(c[0]-1,c[1]+6,'সূরা আলে ইমরান — ৩:১৩৯',ay['3:139'],'"দুর্বল হয়ো না, দুঃখ করো না। তোমরাই বিজয়ী হবে, যদি তোমরা মুমিন হও।"',88)
last=cues[-1][1]
add('Final',last+1.5,END-5.5,r"{\fad(900,900)}রাসূলুল্লাহ (সা.)-এর আদর্শ",4)
add('FinalSub',last+2.5,END-5.5,r"{\fad(900,900)}ন্যায়বিচার  •  মানবিকতা  •  প্রজ্ঞা  •  দায়িত্বশীল নেতৃত্ব",4)
add('Final',END-5.2,END-0.5,r"{\fad(600,900)}গবেষণা বিভাগ | পর্ব ৮",4)
hdr=f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Sub,Hind Siliguri,46,&H00FFFFFF,&H000000FF,&H00101010,&H80000000,0,0,0,0,100,100,0,0,1,3,1,2,160,160,64,1
Style: SceneNo,Hind Siliguri,34,&H004CA2C9,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,6,0,1,0,0,5,0,0,600,1
Style: SceneTitle,Noto Serif Bengali,66,&H00DDEFF4,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,5,0,0,480,1
Style: Corner,Hind Siliguri,26,&H00B8C8BE,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,9,0,40,30,1
Style: Draft,Hind Siliguri,24,&H00708090,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,3,0,40,30,1
Style: LT,Hind Siliguri,34,&H00EAF2F4,&H000000FF,&H00000000,&HB0102018,0,0,0,0,100,100,0,0,3,10,0,1,120,0,190,1
Style: AyRef,Hind Siliguri,34,&H004CA2C9,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,8,0,0,210,1
Style: Ar,Amiri,84,&H00F4F8FA,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,5,200,200,0,1
Style: AyMean,Hind Siliguri,44,&H00DDE8E0,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,200,200,230,1
Style: Title,Noto Serif Bengali,92,&H004CA2C9,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,3,0,5,100,100,100,1
Style: TitleSub,Hind Siliguri,44,&H00F0F4EE,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,2,0,5,0,0,-170,1
Style: Notice,Hind Siliguri,40,&H00F0F4EE,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,8,0,0,300,1
Style: Final,Noto Serif Bengali,84,&H004CA2C9,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,3,0,5,100,100,80,1
Style: FinalSub,Hind Siliguri,46,&H00F0F4EE,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,2,0,5,0,0,-120,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
ev.sort(key=lambda e:(e[1].split(',')[1],e[0]))
open('overlay.ass','w',encoding='utf-8').write(hdr+"\n".join(e[1] for e in ev)+"\n")
json.dump(evj,open('events.json','w'),ensure_ascii=False)
json.dump({'scenes':scenes,'BG':BG,'END':END},open('plan.json','w'))
print('overlay events',len(ev),'END',round(END,1))
