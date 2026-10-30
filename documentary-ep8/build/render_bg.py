import json, subprocess, os
from concurrent.futures import ThreadPoolExecutor
P=json.load(open('plan.json')); scenes=P['scenes']; BG=P['BG']
jobs=[]; order=[]
for k in range(1,14):
    a,b=scenes[str(k)]; kinds=BG[str(k)]; n=len(kinds); seg=(b-a)/n
    for i,kind in enumerate(kinds):
        d=round(seg,3); out=f'seg/s{k:02d}_{i}.mp4'; order.append(out)
        frames=int(d*25)
        # alternate zoom in / out for life
        zexpr = "min(zoom+0.00025,1.10)" if i%2==0 else "if(eq(on,1),1.10,max(zoom-0.00025,1.0))"
        vf=f"zoompan=z='{zexpr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s=1920x1080:fps=25,fade=t=in:st=0:d=0.8,fade=t=out:st={d-0.8}:d=0.8,format=yuv420p"
        jobs.append(['ffmpeg','-loglevel','error','-y','-loop','1','-framerate','25','-i',f'bg/{kind}.png','-vf',vf,'-t',str(d),'-c:v','libx264','-preset','veryfast','-crf','20',out])
def run(c): subprocess.run(c,check=True)
with ThreadPoolExecutor(4) as ex: list(ex.map(run,jobs))
open('seg/list.txt','w').write("".join(f"file '{os.path.abspath(o)}'\n" for o in order))
print(len(order),'segments')
