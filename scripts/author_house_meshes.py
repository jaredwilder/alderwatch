"""Reusable house-family authoring, called by build_environment.py. Meshes only.

Preserves the 3m grid, .44m floor surface, 2.7m walls, and existing hand/tool assets.
Gables are separate so the runtime can remove internal ends of joined roof bays.
"""
def author_house_meshes(Model, rng, palette, mats):
    import bpy, math, random
    from mathutils import Vector
    palette['frame']=(.245,.19,.125)
    material=bpy.data.materials.get('AW_frame') or bpy.data.materials.new('AW_frame')
    material.diffuse_color=(*palette['frame'],1); mats['frame']=material
    palette['plaster']=(.72,.65,.49)
    material=bpy.data.materials.get('AW_plaster') or bpy.data.materials.new('AW_plaster')
    material.diffuse_color=(*palette['plaster'],1); mats['plaster']=material
    results=[]; rng.seed(7729)

    def timber(m,a,b,w,d=None,mat='wood'):
        start=len(m.f); first=len(m.v); m.beam(a,b,w,d,mat); u=rng.random()*2; v=rng.random()*2
        # Subtle hand-hewn arrises, not perfectly extruded stock lumber.
        if mat in ('wood','frame'):
            for vi in range(first,len(m.v)):
                x,y,z=m.v[vi]; m.v[vi]=(x+rng.uniform(-.004,.004),y+rng.uniform(-.005,.005),z+rng.uniform(-.003,.003))
        for fi in range(start,len(m.f)):
            m.face_uv[fi]=[(x+u,y+v) for x,y in m.face_uv[fi]]

    def stone(m,c,w,d,h,seed):
        rr=random.Random(seed); cx,cy,cz=c
        profile=[(-1,-.75),(-.78,-1),(.78,-1),(1,-.72),(1,.78),(.75,1),(-.78,1),(-1,.76)]
        outline=[(x*rr.uniform(.94,1),y*rr.uniform(.94,1)) for x,y in profile]
        verts=[]
        for z,scale in [(-h/2,.87),(-h*.34,1),(h*.34,1),(h/2,.9)]:
            verts.extend([(cx+x*w*.5*scale,cy+y*d*.5*scale,cz+z) for x,y in outline])
        faces=[tuple(range(7,-1,-1)),tuple(range(24,32))]
        for ring in range(3):
            for i in range(8): a=ring*8+i; b=ring*8+(i+1)%8; faces.append((a,b,b+8,a+8))
        tone=rr.uniform(.9,1.1); col=(*[v*tone for v in palette['stone']],1)
        m.add(verts,faces,'stone',[col]*len(verts))

    def peg(m,x,y,z):
        m.tube([(x,y,z),(x,y-.022,z)],[.018,.018],'iron',sides=6,ridges=0)

    m=Model('foundation')
    # Masonry apron extends below uneven terrain; only its exposed courses are seen.
    for row,z in enumerate([-.62,-.4,-.18,.04,.25]):
        for side in (-1,1):
            for i in range(6):
                x=-1.25+i*.5
                stone(m,(x,side*1.32,z),.48,.37,.19+rng.random()*.023,row*51+i+int(side*17))
                stone(m,(side*1.32,x,z),.37,.48,.19+rng.random()*.023,row*61+i+int(side*19))
    for y in range(15): timber(m,(-1.5,y*.2-1.4,.39),(1.5,y*.2-1.4,.39),.194,.10)
    for x in (-1.4,1.4): timber(m,(x,-1.5,.30),(x,1.5,.30),.16,.18,'frame')
    results.append(m.finish())

    for kind in ('wall','window','doorway'):
        m=Model(kind)
        for x in (-1.39,1.39): timber(m,(x,0,0),(x,0,2.7),.22,.20,'frame')
        for z in (.12,2.58): timber(m,(-1.5,0,z),(1.5,0,z),.22,.20,'frame')
        def infill(x0,x1,z0,z1):
            # Two hand-trowelled surfaces with physical thickness and uneven limewash.
            nx=max(3,math.ceil((x1-x0)*9));nz=max(3,math.ceil((z1-z0)*9));vv=[];ff=[];cc=[]
            for side in (-1,1):
                start=len(vv)
                for iz in range(nz+1):
                    for ix in range(nx+1):
                        u=ix/nx;v=iz/nz;x=x0+(x1-x0)*u;z=z0+(z1-z0)*v
                        ripple=.009*math.sin(x*13+z*4)*math.sin(z*17+x*3)
                        vv.append((x,.045+side*(.065+ripple),z))
                        edge=min(u,1-u,v,1-v);shade=.77+.23*min(1,edge*12)
                        stain=1-.12*math.exp(-z*2);tone=shade*stain*(.97+.03*math.sin(x*5+z*8))
                        cc.append((*[c*tone for c in palette['plaster']],1))
                for iz in range(nz):
                    for ix in range(nx):
                        a=start+iz*(nx+1)+ix;face=(a,a+1,a+nx+2,a+nx+1);ff.append(face if side<0 else tuple(reversed(face)))
            m.add(vv,ff,'plaster',cc)
        if kind=='wall': infill(-1.3,1.3,.21,2.48)
        else:
            infill(-1.3,-.60,.21,2.48); infill(.60,1.3,.21,2.48)
            infill(-.60,.60,2.28 if kind=='doorway' else 1.95,2.48)
            if kind=='window': infill(-.60,.60,.21,.98)
        # Real diagonal bracing, shoulder joints and visible wrought pegs.
        if kind=='wall':
            timber(m,(-1.26,-.085,.26),(0,-.085,1.24),.12,.09,'frame')
            timber(m,(0,-.085,1.24),(1.26,-.085,2.47),.12,.09,'frame')
            timber(m,(-1.3,-.04,1.25),(1.3,-.04,1.25),.10,.10,'frame')
        elif kind=='window':
            for x in (-.63,.63): timber(m,(x,-.075,.94),(x,-.075,2.0),.12,.15,'frame')
            timber(m,(-.76,-.13,.97),(.76,-.13,.97),.15,.28,'frame')
            timber(m,(-.73,-.10,1.98),(.73,-.10,1.98),.12,.17,'frame')
            timber(m,(0,-.06,1.03),(0,-.06,1.91),.055,.065)
            timber(m,(-.57,-.06,1.45),(.57,-.06,1.45),.05,.06)
            # Folded-back plank shutters leave the opening genuinely open.
            for side in (-1,1):
                for i in range(3): timber(m,(side*(.73+i*.15),-.095,1.06),(side*(.73+i*.15),-.095,1.87),.14,.05)
                for z in (1.19,1.72): timber(m,(side*.68,-.14,z),(side*1.12,-.14,z),.045,.025,'iron')
        else:
            for x in (-.62,.62): timber(m,(x,-.05,.10),(x,-.05,2.18),.16,.18,'frame')
            timber(m,(-.74,-.05,2.18),(.74,-.05,2.18),.18,.21,'frame')
            timber(m,(-.54,0,.05),(.54,0,.05),.1,.25,'frame')
            for x in (-1.15,1.15): timber(m,(x,-.08,2.02),(x*.63,-.08,2.48),.10,.09,'frame')
        for x in (-1.39,1.39):
            for z in (.2,2.5): peg(m,x,-.11,z)
        # A projecting weatherboard, carved knee braces and dressed stone sill give the wall depth.
        timber(m,(-1.48,-.07,.29),(1.48,-.07,.29),.085,.24,'frame') if kind!='doorway' else None
        for side in (-1,1):
            timber(m,(side*1.31,-.12,2.10),(side*.91,-.12,2.48),.13,.12,'frame')
            peg(m,side*1.24,-.19,2.20)
        if kind=='window':
            stone(m,(0,-.11,.93),1.49,.34,.13,413)
        results.append(m.finish())

    m=Model('gable')
    m.add([(-1.48,-.02,.03),(1.48,-.02,.03),(0,-.02,1.39),(-1.48,.08,.03),(1.48,.08,.03),(0,.08,1.39)],[(0,1,2),(5,4,3),(0,3,4,1),(1,4,5,2),(2,5,3,0)],'plaster')
    timber(m,(-1.5,-.035,.025),(1.5,-.035,.025),.16,.18,'frame')
    for side in (-1,1): timber(m,(0,-.04,1.47),(side*1.6,-.04,.01),.14,.15,'frame')
    timber(m,(0,-.04,.04),(0,-.04,1.42),.13,.12,'frame')
    for side in (-1,1): timber(m,(0,-.075,.17),(side*.7,-.075,.73),.09,.08,'frame')
    results.append(m.finish())

    m=Model('roof')
    # Continuous thick thatch under the overlapping courses. UV V follows the slope.
    for side in (-1,1):
        for row in range(8):
            x0=side*row*.232; x1=side*(row*.232+.30)
            z0=1.57-row*.202; z1=1.57-(row*.232+.30)*.87
            for col in range(12):
                y0=-1.57+col*.262; y1=y0+.266; jitter=rng.uniform(-.018,.018)
                verts=[(x0,y0,z0+jitter),(x0,y1,z0+jitter),(x1,y1,z1+jitter),(x1,y0,z1+jitter),
                       (x0,y0,z0-.16),(x0,y1,z0-.16),(x1,y1,z1-.16),(x1,y0,z1-.16)]
                faces=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(0,4,7,3),(1,2,6,5)]
                if side<0: faces=[tuple(reversed(f)) for f in faces]
                start=len(m.f); m.add(verts,faces,'thatch')
                for fi,face in enumerate(faces): m.face_uv[start+fi]=[(verts[v][1]/1.3,abs(verts[v][0])/1.15) for v in face]
        # Dark timber fascia, exposed underslung rafters, ridge cap and retaining laths.
        for y in (-1.55,0,1.55): timber(m,(0,y,1.35),(side*1.86,y,-.23),.14,.14,'frame')
        for x in (.42,1.04,1.65):
            z=1.65-x*.87; timber(m,(side*x,-1.61,z),(side*x,1.61,z),.045,.045,'frame')
        timber(m,(side*1.85,-1.58,-.12),(side*1.85,1.58,-.12),.15,.18,'frame')
        # Ragged straw ends soften the rigid silhouette of the underlying roof bays.
        for i in range(70):
            y=-1.59+i*.046;drop=rng.uniform(.06,.16)
            m.tube([(side*1.73,y,-.01),(side*1.89,y+.006,-.14-drop)],[.018,.007],'thatch',sides=5,ridges=0)
    timber(m,(0,-1.67,1.65),(0,1.67,1.65),.15,.17,'frame')
    for y in (-1.25,-.6,0,.6,1.25):
        for side in (-1,1): timber(m,(side*.3,y,1.38),(side*.19,y,1.79),.035,.035,'frame')
    results.append(m.finish())
    from pathlib import Path
    village_script=Path(r'C:\Users\jared\Local Sites\alderwatch\scripts\author_village_meshes.py')
    village_namespace={};exec(compile(village_script.read_text(),str(village_script),'exec'),village_namespace)
    results.extend(village_namespace['author_village_meshes'](Model,rng,palette,timber,stone))
    return results
