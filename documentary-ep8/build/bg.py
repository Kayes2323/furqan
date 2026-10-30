# Procedural, abstract backgrounds (no people, no depictions, no maps) — 1920x1080 PNGs.
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
W, H = 1920, 1080
EMERALD=(10,58,40); DEEP=(5,26,19); GOLD=(201,162,76); OFFW=(244,239,221); CHAR=(18,20,19); BLUE=(40,90,140); RED=(110,40,40)

def base(c1, c2):
    y = np.linspace(0,1,H)[:,None,None]; x=np.linspace(0,1,W)[None,:,None]
    t = np.clip(0.65*y+0.35*x,0,1)
    a = np.array(c1)[None,None,:]*(1-t)+np.array(c2)[None,None,:]*t
    img = Image.fromarray(a.astype('uint8').repeat(1,axis=0)[:H,:W]) if a.shape[:2]==(H,W) else Image.fromarray(np.broadcast_to(a,(H,W,3)).astype('uint8'))
    return img

def vignette(img, strength=0.55):
    y,x=np.ogrid[:H,:W]; d=np.sqrt(((x-W/2)/(W/2))**2+((y-H/2)/(H/2))**2)
    m=np.clip(1-strength*np.clip(d-0.35,0,1)**1.4,0,1)[:,:,None]
    return Image.fromarray((np.array(img)*m).astype('uint8'))

def star(d, cx, cy, r, col, w=2):
    pts=[]
    for i in range(16):
        ang=math.pi/8*i - math.pi/2; rr = r if i%2==0 else r*0.62
        pts.append((cx+rr*math.cos(ang), cy+rr*math.sin(ang)))
    d.polygon(pts, outline=col)
    d.regular_polygon((cx,cy,r*0.5), 8, rotation=22.5, outline=col)

def pattern(c1=EMERALD, c2=DEEP, alpha=70):
    img=base(c1,c2).convert('RGBA'); ov=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(ov)
    s=150
    for gy in range(-1,H//s+2):
        for gx in range(-1,W//s+2):
            cx=gx*s+(s//2 if gy%2 else 0); cy=gy*s*0.87
            star(d,cx,cy,s*0.46,GOLD+(alpha,))
    return vignette(Image.alpha_composite(img,ov).convert('RGB'))

def globe(c1=DEEP, c2=(8,30,48), lines=BLUE):
    img=base(c1,c2).convert('RGBA'); ov=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(ov)
    cx,cy,R=W//2,H//2+40,430
    d.ellipse((cx-R,cy-R,cx+R,cy+R),outline=GOLD+(160,),width=3)
    for k in range(-5,6):
        yy=cy+R*k/6; rx=R*math.sqrt(max(0,1-(k/6)**2)); d.ellipse((cx-rx,yy-rx*0.12,cx+rx,yy+rx*0.12),outline=lines+(150,))
    for k in range(0,8):
        rx=R*abs(math.cos(math.pi*k/8)); d.ellipse((cx-rx,cy-R,cx+rx,cy+R),outline=lines+(150,))
    glow=ov.filter(ImageFilter.GaussianBlur(6)); img=Image.alpha_composite(img,glow); img=Image.alpha_composite(img,ov)
    return vignette(img.convert('RGB'))

def network(seed=1, col=BLUE, n=14, c1=DEEP, c2=(8,26,44)):
    random.seed(seed); img=base(c1,c2).convert('RGBA'); ov=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(ov)
    pts=[(random.randint(160,W-160),random.randint(140,H-140)) for _ in range(n)]
    for i,p in enumerate(pts):
        for q in sorted(pts,key=lambda q:(q[0]-p[0])**2+(q[1]-p[1])**2)[1:3]:
            mx,my=(p[0]+q[0])/2,(p[1]+q[1])/2-60
            d.line([p,(mx,my),q],fill=col+(120,),width=2)
    for p in pts: d.ellipse((p[0]-7,p[1]-7,p[0]+7,p[1]+7),fill=GOLD+(230,))
    g=ov.filter(ImageFilter.GaussianBlur(5)); img=Image.alpha_composite(img,g); img=Image.alpha_composite(img,ov)
    return vignette(img.convert('RGB'))

def dunes(top=(18,22,40), mid=(120,70,40), bot=(201,162,76), seed=3):
    random.seed(seed); y=np.linspace(0,1,H)[:,None,None]
    sky=np.array(top)*(1-np.clip(y*1.6,0,1))+np.array(mid)*np.clip(y*1.6,0,1)
    img=Image.fromarray(np.broadcast_to(sky,(H,W,3)).astype('uint8')); d=ImageDraw.Draw(img)
    d.ellipse((W*0.62-90,H*0.50-90,W*0.62+90,H*0.50+90),fill=(255,214,140))
    for i,(base_y,amp,col) in enumerate([(0.66,40,(95,58,38)),(0.74,55,(130,82,48)),(0.84,70,bot)]):
        ph=random.random()*6; pts=[(0,H)]+[(x,H*base_y+amp*math.sin(x/260+ph)+amp*0.5*math.sin(x/110+ph*2)) for x in range(0,W+20,20)]+[(W,H)]
        d.polygon(pts,fill=col)
    return vignette(img.filter(ImageFilter.GaussianBlur(1.2)),0.5)

def bars(seed=2):
    random.seed(seed); img=base(DEEP,(20,26,22)).convert('RGBA'); ov=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(ov)
    x0=260
    for i in range(14):
        h=120+int(60*i+random.randint(-30,50)); col=GOLD if i<7 else (60,160,110)
        d.rectangle((x0+i*105,H-220-h,x0+i*105+70,H-220),fill=col+(190,))
    d.line([(x0,H-220),(x0+14*105,H-220)],fill=OFFW+(120,),width=2)
    return vignette(Image.alpha_composite(img,ov).convert('RGB'))

def tint(img, col, a=0.35):
    return Image.blend(img, Image.new('RGB',(W,H),col), a)

KINDS={
 'black': lambda: Image.new('RGB',(W,H),(4,6,6)),
 'pattern': lambda: pattern(),
 'pattern_dark': lambda: pattern((6,30,22),(3,14,11),55),
 'globe': lambda: globe(),
 'network': lambda: network(),
 'network_red': lambda: tint(network(5),RED,0.28),
 'dunes': lambda: dunes(),
 'bars': lambda: bars(),
 'light': lambda: pattern((16,70,50),(8,34,26),85),
}
if __name__=='__main__':
    import sys
    for k,f in KINDS.items():
        f().save(f'bg/{k}.png'); print(k)
