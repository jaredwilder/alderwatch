"""Authored modular meshes. Run through Blender MCP, never runtime stand-in primitives."""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
R=Path(r'C:\Users\jared\Local Sites\alderwatch')
rng=random.Random(81723)
scene=bpy.data.scenes.get('Alderwatch Kit') or bpy.data.scenes.new('Alderwatch Kit')
bpy.context.window.scene=scene
# Only regenerate our explicitly named asset collection. Preserve Object identities:
# the MCP context guard may retain the previously active object across execution.
old=bpy.data.collections.get('ALDERWATCH_KIT')
collection=old or bpy.data.collections.new('ALDERWATCH_KIT')
if old is None: scene.collection.children.link(collection)
palette={'bark':(.26,.225,.16),'leaf':(.80,.87,.66),'foliage':(.18,.32,.058),'wood':(.34,.225,.12),'endgrain':(.56,.40,.22),'iron':(.13,.16,.18),'edge':(.46,.53,.56),'leather':(.135,.066,.034),'stone':(.39,.41,.37),'thatch':(.47,.36,.17),'linen':(.53,.48,.36),'moss':(.15,.24,.08),'ember':(.9,.14,.008)}
mats={}
for name,color in palette.items():
    m=bpy.data.materials.get('AW_'+name) or bpy.data.materials.new('AW_'+name)
    m.diffuse_color=(*color,1); m.roughness=.85; m.metallic=.8 if name in ('iron','edge') else 0
    mats[name]=m

class Model:
    def __init__(self,name): self.name=name; self.v=[]; self.f=[]; self.c=[]; self.mi=[]; self.keys=[]; self.uv={}; self.face_uv={}
    def add(self,v,f,mat='wood',colors=None):
        if mat not in self.keys: self.keys.append(mat)
        idx=len(self.v); self.v.extend(v); self.f.extend([tuple(idx+i for i in face) for face in f]); self.mi.extend([self.keys.index(mat)]*len(f))
        base=palette[mat]; self.c.extend(colors or [(*[a*rng.uniform(.85,1.13) for a in base],1) for _ in v])
    def tube(self,points,radii,mat='bark',sides=12,ridges=.08,caps=None):
        vv=[]; ff=[]; lengths=[0.0]; frames=[]; previous=None
        for k in range(1,len(points)): lengths.append(lengths[-1]+(Vector(points[k])-Vector(points[k-1])).length)
        for k,p in enumerate(points):
            p=Vector(p); tangent=Vector(points[min(k+1,len(points)-1)])-Vector(points[max(0,k-1)])
            tangent.normalize()
            # Transport the radial frame along a branch; world-axis projection twisted the bark.
            radial=previous-tangent*previous.dot(tangent) if previous is not None else tangent.cross(Vector((0,1,0)))
            if radial.length<.001: radial=tangent.cross(Vector((1,0,0)))
            radial.normalize(); binormal=tangent.cross(radial).normalized(); previous=radial; frames.append((radial,binormal))
            for j in range(sides):
                a=j*math.tau/sides; r=radii[k]*(1+ridges*math.sin(j*7.7+k*.31))
                vv.append(tuple(p+(radial*math.cos(a)+binormal*math.sin(a))*r))
        face_start=len(self.f); repeat=math.tau*max(radii)/1.6
        for k in range(len(points)-1):
            for j in range(sides):
                a=k*sides+j; b=k*sides+(j+1)%sides; ff.append((a,b,b+sides,a+sides))
                self.face_uv[face_start+len(ff)-1]=[(j/sides*repeat,lengths[k]/2.2),((j+1)/sides*repeat,lengths[k]/2.2),((j+1)/sides*repeat,lengths[k+1]/2.2),(j/sides*repeat,lengths[k+1]/2.2)]
        ff.extend([tuple(range(sides-1,-1,-1)),tuple(range((len(points)-1)*sides,len(points)*sides))])
        for fi in (-2,-1): self.face_uv[face_start+len(ff)+fi]=[(.5+math.cos(j%sides*math.tau/sides)*.48,.5+math.sin(j%sides*math.tau/sides)*.48) for j in ff[fi]]
        self.add(vv,ff,mat)
        if caps:
            if caps not in self.keys: self.keys.append(caps)
            self.mi[-1]=self.mi[-2]=self.keys.index(caps)
    def beam(self,a,b,width,depth=None,mat='wood'):
        # Eight-sided chamfered hewn timber with gently irregular arrises.
        depth=depth or width; av=Vector(a); bv=Vector(b); q=(bv-av).to_track_quat('Z','Y')
        cut=.16; shape=[(-1,-1+cut),(-1+cut,-1),(1-cut,-1),(1,-1+cut),(1,1-cut),(1-cut,1),(-1+cut,1),(-1,1-cut)]
        v=[]
        for p in [av,bv]:
            for x,y in shape: v.append(tuple(p+q@Vector((x*width/2,y*depth/2,0))))
        face_start=len(self.f); faces=[tuple(range(7,-1,-1)),tuple(range(8,16))]+[(i,(i+1)%8,(i+1)%8+8,i+8) for i in range(8)]
        for i,face in enumerate(faces):
            if i<2: uvs=[((shape[j%8][0]+1)/2,(shape[j%8][1]+1)/2) for j in face]
            else:
                j=i-2; edge=Vector(((shape[(j+1)%8][0]-shape[j][0])*width/2,(shape[(j+1)%8][1]-shape[j][1])*depth/2)).length
                uvs=[(0,0),(edge/.8,0),(edge/.8,(bv-av).length/2.4),(0,(bv-av).length/2.4)]
            self.face_uv[face_start+i]=uvs
        self.add(v,faces,mat)
    def rock(self,center,scale,seed,mat='stone'):
        rr=random.Random(seed); n=12; levels=5; vv=[]; ff=[]
        outline=[rr.uniform(.86,1.08) for _ in range(n)]
        for k in range(levels):
            z=k/(levels-1); radius=[.78,1.0,.94,.83,.57][k]
            for i in range(n):
                a=i*math.tau/n; r=radius*outline[i]
                px=math.copysign(abs(math.cos(a))**.65,math.cos(a));py=math.copysign(abs(math.sin(a))**.65,math.sin(a))
                vv.append((center[0]+(px*r+.2*z)*scale[0],center[1]+(py*r-.12*z)*scale[1],center[2]+(z-.35)*scale[2]+(.07*math.sin(a*3+seed)+.06*px)*scale[2]))
        for k in range(levels-1):
            for i in range(n): a=k*n+i; b=k*n+(i+1)%n; ff.extend([(a,b,a+n),(b,b+n,a+n)])
        ff.extend([tuple(range(n-1,-1,-1)),tuple(range(n*(levels-1),n*levels))]); self.add(vv,ff,mat)
    def leaf(self,p,size,angle,tilt,mat='leaf'):
        q=Vector((math.cos(angle)*.7,math.sin(angle)*.7,tilt)).to_track_quat('Z','Y'); p=Vector(p)
        if mat=='leaf':
            start=len(self.v); quad=rng.randrange(4); u=(quad%2)*.5; v=(quad//2)*.5
            shape=[(-.5,-.5,0),(.5,-.5,.04),(.5,.5,0),(-.5,.5,-.03)]
            for i,uv in enumerate([(u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)]): self.uv[start+i]=uv
            self.add([tuple(p+q@Vector((x*size,y*size,z*size))) for x,y,z in shape],[(0,1,2,3)],mat)
            return
        shape=[(-.25,0,0),(-.10,.37,.04),(.2,.55,0),(.53,.4,.02),(.76,0,0),(.3,-.25,.03)]
        v=[tuple(p+q@Vector((x*size,y*size,z*size))) for x,y,z in shape]
        self.add(v,[(0,1,2),(0,2,3),(0,3,4),(0,4,5)],mat)
    def finish(self):
        mesh=bpy.data.meshes.new(self.name+'_Mesh'); mesh.from_pydata(self.v,[],self.f); mesh.update()
        for key in self.keys: mesh.materials.append(mats[key])
        for p,i in zip(mesh.polygons,self.mi): p.material_index=i; p.use_smooth=self.keys[i] in ('bark','foliage','stone','highland','plaster')
        uv=mesh.uv_layers.new(name='UVMap')
        for p in mesh.polygons:
            for corner,li in enumerate(p.loop_indices):
                vi=mesh.loops[li].vertex_index; co=mesh.vertices[vi].co
                if p.index in self.face_uv: uv.data[li].uv=self.face_uv[p.index][corner]
                elif vi in self.uv: uv.data[li].uv=self.uv[vi]
                elif self.keys[p.material_index]=='bark': uv.data[li].uv=(math.atan2(co.y,co.x)/math.tau*3,co.z*.35)
                elif abs(p.normal.z)>.6: uv.data[li].uv=(co.x*.5,co.y*.5)
                elif abs(p.normal.x)>abs(p.normal.y): uv.data[li].uv=(co.y*.5,co.z*.5)
                else: uv.data[li].uv=(co.x*.5,co.z*.5)
        col=mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
        for i,c in enumerate(self.c): col.data[i].color=c
        obj=collection.objects.get(self.name)
        if obj: obj.data=mesh
        else: obj=bpy.data.objects.new(self.name,mesh); collection.objects.link(obj)
        obj['asset_family']=self.name
        return obj

assets=[]
# Worn paving is a shallow slab with a planar top, not a scaled round boulder.
rng.seed(98);paving=Model('paving_0');outline=[(-.88,-.78),(-.48,-1.0),(.57,-.94),(.98,-.50),(.91,.70),(.52,1.0),(-.71,.92),(-1.0,.33)]
pv=[]
for scale,z in [(1.0,-.04),(1.0,.06),(.88,.15)]:
    pv.extend([(x*scale,y*scale,z+.016*x-.012*y) for x,y in outline])
pf=[tuple(range(7,-1,-1)),tuple(range(16,24))]
for ring in range(2):
    for i in range(8):pf.append((ring*8+i,ring*8+(i+1)%8,(ring+1)*8+(i+1)%8,(ring+1)*8+i))
paving.add(pv,pf,'stone');paved=paving.finish()
for p in paved.data.polygons:p.use_smooth=False
assets.append(paved)
for species in range(3):
    rng.seed(71+species); tree=Model('oak_'+str(species)); height=13.5+species*1.8
    trunk=[(math.sin(k*.65)*.52,math.sin(k*.9)*.28,k*height/10) for k in range(8)]
    tree.tube(trunk,[1.05,.80,.72,.66,.58,.49,.35,.13],sides=28,ridges=.13)
    for i in range(8):
        a=i*math.tau/8; reach=2.3+rng.random()*1.3
        tree.tube([(math.cos(a+.12)*reach,math.sin(a+.12)*reach,-.08),(math.cos(a)*reach*.65,math.sin(a)*reach*.65,.10),(math.cos(a)*.9,math.sin(a)*.9,.35),(0,0,1.9)],[.035,.13,.29,.48],sides=10)
    for i in range(10):
        a=i*2.399+species; z=3.7+i*.70; extent=rng.uniform(5.0,7.0)*(1-abs(i-5)/23)
        start=Vector((.1,0,z)); end=Vector((math.cos(a)*extent,math.sin(a)*extent,z+3.6))
        mid=start.lerp(end,.52); mid.z-=.75
        bend=Vector((-math.sin(a)*.48,math.cos(a)*.48,-.3))
        tree.tube([start,start.lerp(mid,.48)+bend,mid,mid.lerp(end,.52)-bend*.4,end],[.48,.37,.26,.16,.065],sides=14,ridges=.11)
        for j in range(6):
            a2=a+(j-2.5)*.6; p=mid.lerp(end,j/6); tip=p+Vector((math.cos(a2)*1.7,math.sin(a2)*1.7,1.6))
            tree.tube([p,p.lerp(tip,.5),tip],[.10,.05,.012],sides=6)
            for leaf in range(87):
                th=rng.uniform(0,math.tau); u=rng.uniform(-1,1); r=rng.random()**.4
                pos=tip+Vector((math.cos(th)*1.8*r,math.sin(th)*1.8*r,u*1.05))
                tree.leaf(pos,rng.uniform(.44,.83),th,rng.uniform(.25,1))
    assets.append(tree.finish())

# A deliberately lighter silhouette asset for the non-interactive distant woodland.
# It uses the same bark/leaf atlas and natural branch structure as the harvestable family.
rng.seed(395)
far=Model('oak_distant')
far.tube([(0,0,0),(.15,0,3.8),(-.1,.2,8)],[.55,.35,.09],sides=8)
for i in range(7):
    a=i*2.399; end=Vector((math.cos(a)*2.8,math.sin(a)*2.8,6+i*.65))
    far.tube([(0,0,3+i*.45),end],[.16,.025],sides=5)
    for j in range(85):
        th=rng.random()*math.tau; r=rng.random()**.5
        p=end+Vector((math.cos(th)*2.2*r,math.sin(th)*2.2*r,rng.uniform(-1.1,1.1)))
        far.leaf(p,rng.uniform(.9,1.35),th,rng.uniform(.25,1))
assets.append(far.finish())

# Authored highland mesh: a connected apron, overlapping shoulders and one asymmetric
# landmark peak. Coordinates match the runtime world (Blender +Y = runtime north/-Z).
palette['highland']=(1,1,1)
m=bpy.data.materials.get('AW_highland') or bpy.data.materials.new('AW_highland')
m.diffuse_color=(1,1,1,1); mats['highland']=m
def noise2(x,y):
    def h(a,b): return (math.sin(a*127.1+b*311.7)*43758.5453)%1
    ix=math.floor(x); iy=math.floor(y); fx=x-ix; fy=y-iy
    fx=fx*fx*(3-2*fx); fy=fy*fy*(3-2*fy)
    return (h(ix,iy)*(1-fx)+h(ix+1,iy)*fx)*(1-fy)+(h(ix,iy+1)*(1-fx)+h(ix+1,iy+1)*fx)*fy
def highland_height(x,y):
    apron=max(0,min(1,(y-115)/85)); apron=apron*apron*(3-2*apron)
    peaks=[(-85,470,178,130,140),(73,490,132,95,125),(-230,390,93,135,125),(235,455,114,150,175),(-390,535,150,150,190),(415,575,154,190,175),(-20,690,195,165,150)]
    def peak(cx,cy,amp,wx,wy):
        dx=(x-cx)/wx; dy=(y-cy)/wy; r=math.sqrt(dx*dx+dy*dy); a=math.atan2(dy,dx)
        shoulder=.3*math.exp(-r*r*.6)
        spur=max(0,1-r*(1+.09*math.cos(a*7+cx)))
        return amp*(shoulder+.7*spur**1.18)
    h=max(peak(*p) for p in peaks)
    # Folded secondary ridges follow the main mass instead of independent sine-wave strips.
    ridge=1-abs(noise2(x*.029,y*.029)*2-1)
    detail=(ridge-.55)*h*.19+(noise2(x*.095,y*.095)-.5)*h*.035
    hills=18*noise2(x*.009+8,y*.012)+10*noise2(x*.025,y*.024)
    return -6+apron*(h+detail+hills)
highland=Model('highland'); nx=180; ny=144; verts=[]; cols=[]; faces=[]
for j in range(ny+1):
    y=115+j/ny*760
    for i in range(nx+1):
        x=-650+i/nx*1300; h=highland_height(x,y)
        dx=(highland_height(x+2,y)-highland_height(x-2,y))/4; dy=(highland_height(x,y+2)-highland_height(x,y-2))/4
        slope=math.sqrt(dx*dx+dy*dy); stone=max(0,min(1,(slope-.32)*1.25+(h-70)/120))
        n=noise2(x*.11,y*.1); green=(.115,.17,.13); grey=(.31,.37,.42)
        c=[(a*(1-stone)+b*stone)*(.84+n*.24) for a,b in zip(green,grey)]
        snow=max(0,min(.75,(h-165)/35))*(1-min(1,slope*.55))
        c=[v*(1-snow)+s*snow for v,s in zip(c,(.75,.79,.78))]
        # Bake the same western daylight into the distant mass. Strong opposing
        # ridge planes survive aerial perspective instead of a uniformly lit cone.
        normal=Vector((-dx,-dy,1)).normalized();light=.30+.95*max(0,normal.dot(Vector((-.55,-.15,.8)).normalized()))
        strata=.82+.18*noise2(x*.047+h*.16,y*.052+h*.08)
        c=[v*light*strata for v in c]
        haze=max(0,min(.16,(y-180)/3200));c=[v*(1-haze)+s*haze for v,s in zip(c,(.27,.40,.55))]
        verts.append((x,y,h)); cols.append((*c,1))
for j in range(ny):
    for i in range(nx):
        a=j*(nx+1)+i; b=a+1; c=a+nx+1; d=c+1
        faces.extend([(a,b,c),(b,d,c)])
highland.add(verts,faces,'highland',cols); assets.append(highland.finish())

for seed,scale in [(0,(1.4,1.1,1.8)),(1,(.9,1.2,1.2)),(2,(1.8,.9,1.2))]:
    m=Model('rock_'+str(seed)); m.rock((0,0,.3),scale,seed)
    if seed==0:
        for i in range(9): m.rock((rng.uniform(-.8,.8),rng.uniform(-.7,.7),rng.uniform(.2,1.2)),(.16,.09,.15),i,'iron')
    assets.append(m.finish())
for name,length,rad in [('log',2.2,.35),('stump',.65,.85)]:
    m=Model(name); m.tube([(0,0,0),(.025,.015,length*.4),(0,0,length)],[rad,rad*.96,rad*.89],sides=22,ridges=.06,caps='endgrain')
    for z in (.003,length+.003):
        for r in (.2,.4,.6,.8):
            pts=[(math.cos(a*math.tau/32)*rad*r,math.sin(a*math.tau/32)*rad*r,z) for a in range(33)]
            m.tube(pts,[.007]*33,'endgrain',sides=3)
    assets.append(m.finish())

for name in ('axe','pickaxe','sword','hammer'):
    m=Model(name)
    if name=='sword':
        m.tube([(0,0,-.15),(0,0,.15)],[.027,.027],'leather',sides=12)
        m.beam((-.14,0,.17),(.14,0,.17),.05,.045,'iron')
        v=[(-.055,0,.19),(.055,0,.19),(-.043,0,.72),(.043,0,.72),(0,0,.88),(0,-.023,.25),(0,-.018,.69),(0,.023,.25),(0,.018,.69)]
        f=[(0,5,6,2),(2,6,4),(6,3,4),(5,1,3,6),(0,2,8,7),(2,4,8),(8,4,3),(7,8,3,1),(0,7,1,5)]
        m.add(v,f,'edge'); m.rock((0,0,-.18),(.05,.04,.06),2,'iron')
    else:
        m.tube([(0,0,-.24),(.018,0,.06),(.006,0,.50)],[.032,.028,.034],'wood',sides=14)
        for i in range(9): m.tube([(0,0,-.22+i*.017),(0,0,-.212+i*.017)],[.033,.033],'leather',sides=12)
        if name=='axe':
            outline=[(-.07,.55),(.11,.55),(.33,.64),(.39,.55),(.40,.39),(.34,.28),(.24,.27),(.12,.40),(-.07,.40)]
            n=len(outline); v=[(x,y,z) for y in [-.035,.035] for x,z in outline]
            m.add(v,[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)],'iron')
            m.add([(.35,-.031,.61),(.40,0,.62),(.43,0,.39),(.37,-.031,.33),(.35,.031,.61),(.37,.031,.33)],[(0,1,2,3),(4,5,2,1)],'edge')
        elif name=='pickaxe': m.tube([(-.36,0,.31),(-.20,0,.48),(0,0,.51),(.22,0,.44),(.40,0,.27)],[.006,.032,.055,.027,.004],'iron',sides=8)
        else: m.beam((-.13,0,.49),(.13,0,.49),.12,.10,'iron')
    assets.append(m.finish())

# 3m foundation and facade system: beveled structural timbers with separate inset boards.
for kind in ('foundation','wall','window','doorway','door','roof','workbench','palisade','chest','campfire','satchel','flax'):
    m=Model(kind)
    if kind=='foundation':
        for x in range(7):
            for y in (-1.35,1.35): m.rock((x*.43-1.3,y,.14),(.25,.26,.39),x+int(y*11))
        for y in range(13): m.beam((-1.5,y*.235-1.42,.4),(1.5,y*.235-1.42,.4),.22,.12,'wood')
        for x in (-1.4,1.4): m.beam((x,-1.5,.22),(x,1.5,.22),.22,.2)
    elif kind in ('wall','window','doorway'):
        for x in (-1.42,1.42): m.beam((x,0,0),(x,0,2.7),.18)
        for z in (.12,2.6): m.beam((-1.5,0,z),(1.5,0,z),.16)
        for i in range(16):
            x=-1.35+i*.18
            if kind=='doorway' and abs(x)<.54: continue
            if kind=='window' and abs(x)<.56:
                m.beam((x,.02,.15),(x,.02,.95),.173,.09)
                m.beam((x,.02,1.86),(x,.02,2.53),.173,.09)
            else: m.beam((x,.02,.15),(x,.02,2.53),.173,.09)
        if kind=='wall':
            m.beam((-1.3,-.07,.22),(1.3,-.07,2.5),.13,.10)
        elif kind=='window':
            for z in (.92,1.89): m.beam((-.67,-.09,z),(.67,-.09,z),.13,.15)
            for x in (-.64,0,.64): m.beam((x,-.04,.92),(x,-.04,1.89),.07,.07)
        else:
            for x in (-.57,.57): m.beam((x,-.02,.1),(x,-.02,2.12),.13)
            m.beam((-.65,0,2.12),(.65,0,2.12),.14)
    elif kind=='door':
        for i in range(6): m.beam((.09+i*.18,0,.1),(.09+i*.18,0,2.04),.174,.08)
        for z in (.4,1.7): m.beam((.04,-.055,z),(1.04,-.055,z),.065,.04,'iron')
        m.beam((.9,-.07,.9),(.9,-.07,1.12),.04,.045,'iron')
        m.beam((.05,.055,.3),(1.03,.055,1.85),.1,.055,'wood')
    elif kind=='satchel':
        m.rock((0,0,.22),(.28,.18,.45),57,'leather')
        for x in (-.15,.15): m.beam((x,-.16,.08),(x,-.16,.42),.035,.03,'linen')
        m.tube([(-.2,0,.4),(-.18,0,.62),(.18,0,.62),(.2,0,.4)],[.023]*4,'leather',sides=6)
    elif kind=='flax':
        palette['flaxflower']=(.30,.41,.64)
        flower=bpy.data.materials.get('AW_flaxflower') or bpy.data.materials.new('AW_flaxflower');flower.diffuse_color=(*palette['flaxflower'],1);mats['flaxflower']=flower
        for i in range(13):
            x=rng.uniform(-.22,.22); y=rng.uniform(-.22,.22); h=rng.uniform(.52,.82)
            m.tube([(x,y,0),(x+.03,y,h*.6),(x+.09,y+.05,h)],[.004,.003,.0015],'foliage',sides=5)
            for j in range(7):
                a=j*2.4;z=h*(.16+j*.095);p=Vector((x+.03,y,z));direction=Vector((math.cos(a),math.sin(a),.55));across=Vector((-math.sin(a),math.cos(a),0))*.012
                m.add([tuple(p),tuple(p+direction*.07+across),tuple(p+direction*.15),tuple(p+direction*.07-across)],[(0,1,2),(0,2,3)],'foliage')
            for j in range(5):
                a=j*math.tau/5;p=Vector((x+.09,y+.05,h));d=Vector((math.cos(a),math.sin(a),.1));w=Vector((-math.sin(a),math.cos(a),0))*.014
                m.add([tuple(p),tuple(p+d*.024+w),tuple(p+d*.039),tuple(p+d*.024-w)],[(0,1,2,3)],'flaxflower')
    elif kind=='roof':
        # One complete gabled bay, 3m long and 3m wide. Overlapping thatch bundles.
        for y in (-1.58,0,1.58):
            for side in (-1,1): m.beam((0,y,1.45),(side*1.8,y,-.10),.13)
        m.beam((0,-1.75,1.45),(0,1.75,1.45),.18)
        for side in (-1,1):
            for row in range(7):
                x=side*(.04+row*.255); z=1.48-row*.22
                for col in range(34):
                    y=-1.76+col*.106; m.beam((x,y,z),(x+side*.41,y,z-.40),.105,.13,'thatch')
    elif kind=='workbench':
        for x in (-.65,.65):
            for y in (-.28,.28): m.beam((x,y,0),(x,y,.82),.12)
        for y in (-.3,0,.3): m.beam((-.90,y,.86),(.90,y,.86),.29,.10)
        m.beam((-.64,0,.23),(.64,0,.23),.12)
        m.beam((.35,-.05,.91),(.55,-.05,.91),.16,.15,'iron')
        m.tube([(-.4,.1,.93),(-.11,.1,.93)],[.025,.025],'wood',sides=8)
    elif kind=='palisade':
        for i in range(9):
            x=-1.2+i*.3; z=1.8+rng.uniform(-.1,.2)
            m.tube([(x,0,0),(x,0,z),(x+.015,0,z+.28)],[.16,.13,.004],'wood',sides=9)
        for z in (.4,1.25): m.beam((-1.45,.14,z),(1.45,.14,z),.13)
    elif kind=='chest':
        for i in range(6):
            y=-.3+i*.12; m.beam((-.55,y,.25),(.55,y,.25),.115,.45)
            m.beam((-.56,y,.5+math.sin(i/5*math.pi)*.16),(.56,y,.5+math.sin(i/5*math.pi)*.16),.115,.1)
        for x in (-.37,.37):
            m.beam((x,-.34,.05),(x,-.34,.5),.045,.025,'iron'); m.beam((x,-.34,.54),(x,.34,.54),.04,.035,'iron')
    elif kind=='campfire':
        for i in range(12):
            a=i*math.tau/12; m.rock((math.cos(a)*.65,math.sin(a)*.65,.05),(.18,.15,.22),i)
        for a in (0,math.pi/3,math.pi*2/3):
            m.tube([(-math.cos(a)*.43,-math.sin(a)*.43,.13),(math.cos(a)*.43,math.sin(a)*.43,.13)],[.095,.075],'bark',sides=9)
        m.rock((0,0,.1),(.26,.23,.2),0,'ember')
    assets.append(m.finish())

fern=Model('fern')
for i in range(8):
    a=i*2.399; reach=.52+rng.random()*.20; rise=.34+rng.random()*.17
    forward=Vector((math.cos(a),math.sin(a),0)); lateral=Vector((-math.sin(a),math.cos(a),0))
    points=[forward*(t*reach)+Vector((0,0,math.sin(t*2.6)*rise)) for t in [j/12 for j in range(13)]]
    fern.tube(points,[.008*(1-j/14) for j in range(13)],'foliage',sides=3,ridges=0)
    for j in range(1,12):
        t=j/12; p=points[j]; length=.18*math.sin(t*math.pi)**.7*(1-t*.55)
        for side in (-1,1):
            end=p+lateral*side*length+forward*.055; axis=end-p; width=.021*(1-t*.65)
            # Paired narrow pinnae, folded along a midrib. Not broad tree-leaf wedges.
            up=Vector((0,0,.008)); v=[p,p+axis*.42-forward*width,p+axis*.55+up,end,p+axis*.40+forward*width]
            tone=.8+rng.random()*.3; c=[(.20*tone,.28*tone,.075*tone,1)]*5
            fern.add([tuple(q) for q in v],[(0,1,2),(1,3,2),(2,3,4),(0,2,4)],'foliage',c)
palette['fernleaf']=(.83,.9,.78)
m=bpy.data.materials.get('AW_fernleaf') or bpy.data.materials.new('AW_fernleaf');m.diffuse_color=(.83,.9,.78,1);mats['fernleaf']=m
fern=Model('fern')
for i in range(7):
    a=i*2.399;out=Vector((math.cos(a),math.sin(a),0));side=Vector((-math.sin(a),math.cos(a),0));h=.5+rng.random()*.28;w=.52+rng.random()*.15
    vv=[];start=len(fern.v);quad=i%4;u=(quad%2)*.5;v=(quad//2)*.5
    for j in range(3):
        t=j/2;center=out*(t*t*.3)+Vector((0,0,t*h))
        for sign in (-1,1):
            vv.append(tuple(center+side*sign*w*.5));fern.uv[start+len(vv)-1]=(u+(sign+1)*.25,v+t*.5)
    fern.add(vv,[(0,1,3,2),(2,3,5,4)],'fernleaf')
assets.append(fern.finish())
palette['grass']=(.95,.95,.91)
m=bpy.data.materials.get('AW_grass') or bpy.data.materials.new('AW_grass'); m.diffuse_color=(.95,.95,.91,1); mats['grass']=m
grass=Model('grass')
for i in range(3):
    a=i*math.pi/3; h=.85; w=.95; start=len(grass.v); u=(i%2)*.5; v=(i//2)*.5
    for j,uv in enumerate([(u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)]): grass.uv[start+j]=uv
    grass.add([(-math.cos(a)*w/2,-math.sin(a)*w/2,0),(math.cos(a)*w/2,math.sin(a)*w/2,0),(math.cos(a)*w/2,math.sin(a)*w/2,h),(-math.cos(a)*w/2,-math.sin(a)*w/2,h)],[(0,1,2,3)],'grass')
assets.append(grass.finish())
# Refine the reusable home family after base-kit construction; identities are retained.
house_script=R/'scripts/author_house_meshes.py'
exec(compile(house_script.read_text(),str(house_script),'exec'))
for obj in author_house_meshes(Model,rng,palette,mats):
    if obj.name not in {o.name for o in assets}: assets.append(obj)
for o in scene.objects: o.select_set(False)
for o in assets: o.select_set(True)
bpy.context.view_layer.objects.active=assets[0]
bpy.ops.export_scene.gltf(filepath=str(R/'assets/source/frontier-kit.raw.glb'),export_format='GLB',use_active_scene=True,use_selection=True,export_animations=False,export_extras=True,export_all_vertex_colors=True)
print('KIT',json.dumps([{'name':o.name,'vertices':len(o.data.vertices),'faces':len(o.data.polygons),'dimensions':list(o.dimensions)} for o in assets]))
bpy.ops.wm.save_as_mainfile(filepath=str(R/'assets/source/alderwatch-assets.blend'))
