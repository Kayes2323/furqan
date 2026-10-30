import json, os
from PIL import Image, ImageDraw, ImageFont
W,H=1920,1080
L=ImageFont.Layout.RAQM
F={}
def font(name,size):
    k=(name,size)
    if k not in F: F[k]=ImageFont.truetype(f'fonts/{name}',size,layout_engine=L)
    return F[k]
GOLD=(201,162,76); WHITE=(255,255,255); SOFT=(221,232,224); OFF=(244,248,250)
# style: font,size,fill,stroke,anchor,pos(x,y),wrap,box
ST={
 'Sub':('HindSiliguri-Regular.ttf',46,WHITE,3,'md',(960,H-64),1600,None),
 'SceneNo':('HindSiliguri-Regular.ttf',34,GOLD,0,'mm',(960,440),1400,None),
 'SceneTitle':('NotoSerifBengali.ttf',66,(244,239,221),2,'mm',(960,530),1600,None),
 'Corner':('HindSiliguri-Regular.ttf',26,(190,200,184),1,'ra',(W-40,26),900,None),
 'Draft':('HindSiliguri-Regular.ttf',24,(128,144,112),1,'rd',(W-40,H-24),1100,None),
 'LT':('HindSiliguri-Regular.ttf',34,(244,242,234),0,'ld',(120,H-190),1500,(16,32,24,190)),
 'AyRef':('HindSiliguri-Regular.ttf',34,GOLD,0,'mm',(960,250),1500,None),
 'Ar':('Amiri-Regular.ttf',84,OFF,2,'mm',(960,520),1600,None),
 'AyMean':('HindSiliguri-Regular.ttf',44,SOFT,2,'mm',(960,H-230),1500,None),
 'Title':('NotoSerifBengali.ttf',92,GOLD,3,'mm',(960,440),1700,None),
 'TitleSub':('HindSiliguri-Regular.ttf',44,(240,244,238),2,'mm',(960,660),1700,None),
 'Notice':('HindSiliguri-Regular.ttf',40,(240,244,238),2,'mm',(960,840),1700,None),
 'Final':('NotoSerifBengali.ttf',84,GOLD,3,'mm',(960,480),1700,None),
 'FinalSub':('HindSiliguri-Regular.ttf',46,(240,244,238),2,'mm',(960,650),1700,None),
}
def wrap(d,text,f,maxw,rtl=False):
    out=[]
    for para in text.split('\n'):
        words=para.split(' '); cur=''
        for w in words:
            t=(cur+' '+w).strip()
            if d.textlength(t,font=f,**({'direction':'rtl','language':'ar'} if rtl else {}))<=maxw: cur=t
            else:
                if cur: out.append(cur)
                cur=w
        out.append(cur)
    return out
def draw_event(img,e):
    name,size,fill,stroke,anchor,(x,y),maxw,box=ST[e['style']]
    if e['style']=='Ar' and e.get('size'): size=e['size']
    f=font(name,size); d=ImageDraw.Draw(img); rtl=e['style']=='Ar'
    lines=wrap(d,e['text'],f,maxw,rtl)
    lh=int(size*(1.22 if e['style'] in ('Title','Final','SceneTitle') else 1.5 if rtl else 1.45))
    n=len(lines); hh=n*lh
    ha=anchor[0]; va=anchor[1]
    if va=='d': top=y-hh
    elif va=='a': top=y
    else: top=y-hh//2
    if box:
        mw=max(d.textlength(t,font=f) for t in lines); pad=18
        bx0=x-pad; bx1=x+mw+pad; d.rounded_rectangle((bx0,top-pad//2,bx1,top+hh+pad//2),12,fill=box)
    for i,t in enumerate(lines):
        yy=top+i*lh+lh//2
        kw=dict(font=f,fill=fill,stroke_width=stroke,stroke_fill=(8,10,10))
        if rtl: kw.update(direction='rtl',language='ar')
        a={'m':'m','l':'l','r':'r'}[ha]+'m'
        d.text((x,yy),t,anchor=a,**kw)
ev=json.load(open('events.json'))
END=json.load(open('plan.json'))['END']
cuts=sorted({0.0,END}|{round(e['a'],3) for e in ev}|{round(min(e['b'],END),3) for e in ev})
cuts=[c for c in cuts if 0<=c<=END]
lines=[]; cache={}; blank='txt/blank.png'
Image.new('RGBA',(W,H),(0,0,0,0)).save(blank)
for a,b in zip(cuts,cuts[1:]):
    if b-a<0.02: continue
    mid=(a+b)/2
    act=tuple(i for i,e in enumerate(ev) if e['a']<=mid<e['b'])
    if act not in cache:
        if not act: cache[act]=blank
        else:
            img=Image.new('RGBA',(W,H),(0,0,0,0))
            for i in sorted(act,key=lambda i:ev[i]['layer']): draw_event(img,ev[i])
            p=f'txt/s{len(cache):04d}.png'; img.save(p); cache[act]=p
    lines.append((os.path.abspath(cache[act]),b-a))
with open('txt/list.txt','w') as fh:
    for p,d in lines: fh.write(f"file '{p}'\nduration {d:.3f}\n")
    fh.write(f"file '{lines[-1][0]}'\n")
print(len(cache),'distinct states',len(lines),'intervals')
