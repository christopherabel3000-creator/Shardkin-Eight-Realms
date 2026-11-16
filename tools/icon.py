# Redraws the Shardkin gem icon at any size (same design as icons/icon-512.png), and the app's launch image.
import math, sys
import numpy as np
from PIL import Image, ImageDraw
OUT=sys.argv[1]
OUTER=["b4b5c6","6fd27b","6eaaff","ff8a5c","d3a271","f2cd4a","f07bbf","a897ee"]
INNER=["dddee5","beebc4","bed9ff","ffcab6","ebd5bf","f9e8ae","f8c4e2","d8d0f7"]
hexc=lambda h: tuple(int(h[i:i+2],16) for i in (0,2,4))
def background(N, gem_apothem, cx, cy, flat=None):
    y,x=np.mgrid[0:N,0:N].astype(np.float32)
    if flat is not None:
        base=np.empty((N,N,3),np.float32); base[:]=flat
    else:
        t=(y/(N-1))[...,None]
        base=(1-t)*np.array([36,28,66],np.float32)+t*np.array([14,15,26],np.float32)
    r=np.hypot(x-cx,y-cy)/gem_apothem*137.0   # in the units of the 512 maskable icon
    a=np.clip((205-r)/55,0,1.6)**1.3
    return np.clip(base+a[...,None]*np.array([41,33,58],np.float32),0,255).astype(np.uint8)
def gem(img, cx, cy, ap, stroke):
    d=ImageDraw.Draw(img)
    R=ap/math.cos(math.pi/8); r=R*71/171
    V=[(cx+R*math.cos(math.radians(-112.5+45*k)), cy+R*math.sin(math.radians(-112.5+45*k))) for k in range(8)]
    W=[(cx+r*math.cos(math.radians(-112.5+45*k)), cy+r*math.sin(math.radians(-112.5+45*k))) for k in range(8)]
    for k in range(8):
        j=(k+1)%8
        d.polygon([V[k],V[j],W[j],W[k]], fill=hexc(OUTER[k]))
        d.polygon([W[k],W[j],(cx,cy)], fill=hexc(INNER[k]))
    white=(255,255,255)
    for k in range(8):
        j=(k+1)%8
        for a,b in ((V[k],V[j]),(W[k],W[j]),(V[k],W[k]),(W[k],(cx,cy))):
            d.line([a,b], fill=white, width=stroke)
    for p in V+W+[(cx,cy)]:
        d.ellipse([p[0]-stroke/2,p[1]-stroke/2,p[0]+stroke/2,p[1]+stroke/2], fill=white)
SS=3
# App icon: 1024, square, no transparency
N=1024*SS
im=Image.fromarray(background(N, 342*SS, N/2, N/2))
gem(im, N/2, N/2, 342*SS, 6*SS)
im.resize((1024,1024), Image.LANCZOS).save(OUT+'/AppIcon-1024.png')
# Launch image: the gem on the game's dark background
N=2732
im=Image.fromarray(background(N, 300, N/2, N/2, flat=[18,19,29]))
big=im.resize((N*2,N*2), Image.BILINEAR); gem(big, N, N, 600, 11); im=big.resize((N,N), Image.LANCZOS)
im.save(OUT+'/splash-2732.png', optimize=True)
