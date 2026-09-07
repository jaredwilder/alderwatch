"""Bounded original nature kit; run through Blender MCP. No scene-wide cleanup."""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector
R=Path(r'C:\Users\jared\Local Sites\alderwatch')
scene=bpy.data.scenes.get('Alderwatch Kit')
collection=bpy.data.collections.get('AW_NATURE')
if not collection:
    collection=bpy.data.collections.new('AW_NATURE');scene.collection.children.link(collection)
# Only replace this script's own authored kit.
# Retain object identities because the MCP context guard can hold the active object.
colors={'fur':(.28,.20,.12),'cream':(.59,.51,.38),'dark':(.025,.018,.012),'leaf':(.12,.23,.047),'berry':(.25,.025,.035),'cap':(.39,.22,.09),'stem':(.63,.54,.37),'herb':(.20,.31,.10),'bark':(.19,.115,.065),'feather':(.021,.033,.045),'beak':(.065,.060,.045)}
mats={}
for name,color in colors.items():
    mat=bpy.data.materials.get('AWN_'+name) or bpy.data.materials.new('AWN_'+name)
    mat.diffuse_color=(*color,1);mat.roughness=.92;mats[name]=mat
rng=random.Random(9631)
class Mesh:
    def __init__(self,name):self.name=name;self.v=[];self.f=[];self.mi=[];self.keys=[]
    def add(self,vertices,faces,material):
        if material not in self.keys:self.keys.append(material)
        offset=len(self.v);self.v.extend(vertices);self.f.extend([tuple(offset+i for i in f) for f in faces]);self.mi.extend([self.keys.index(material)]*len(faces))
    def loft(self,rings,material,sides=16):
        # Cross-sections along Y: elliptical anatomical/branch forms, not runtime spheres.
        v=[];f=[]
        for x,y,z,rx,rz in rings:
            for j in range(sides):
                a=j*math.tau/sides;v.append((x+rx*math.cos(a),y,z+rz*math.sin(a)))
        for k in range(len(rings)-1):
            for j in range(sides):f.append((k*sides+j,k*sides+(j+1)%sides,(k+1)*sides+(j+1)%sides,(k+1)*sides+j))
        f.extend([tuple(range(sides-1,-1,-1)),tuple(range((len(rings)-1)*sides,len(rings)*sides))]);self.add(v,f,material)
    def ellipsoid(self,center,scale,material):
        x,y,z=center;rx,ry,rz=scale
        self.loft([(x,y+math.cos(a)*ry,z,max(.001,math.sin(a)*rx),max(.001,math.sin(a)*rz)) for a in [i*math.pi/10 for i in range(11)]],material)
    def tube(self,a,b,r1,r2,material):
        a,b=Vector(a),Vector(b);axis=(b-a).normalized();u=axis.cross(Vector((0,0,1)))
        if u.length<.01:u=axis.cross(Vector((0,1,0)))
        u.normalize();v=axis.cross(u);verts=[]
        for p,r in [(a,r1),(b,r2)]:
            for j in range(8):verts.append(tuple(p+(u*math.cos(j*math.tau/8)+v*math.sin(j*math.tau/8))*r))
        self.add(verts,[(j,(j+1)%8,(j+1)%8+8,j+8) for j in range(8)]+[tuple(range(8)),tuple(range(8,16))],material)
    def finish(self,parent=None,pivot=(0,0,0)):
        mesh=bpy.data.meshes.new(self.name+'_mesh');mesh.from_pydata(self.v,[],self.f);mesh.update()
        obj=bpy.data.objects.get(self.name)
        if obj:obj.data=mesh
        else:obj=bpy.data.objects.new(self.name,mesh);collection.objects.link(obj)
        obj.parent=parent;obj.location=pivot
        for key in self.keys:mesh.materials.append(mats[key])
        col=mesh.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
        for p,mi in zip(mesh.polygons,self.mi):
            p.material_index=mi;p.use_smooth=True
            for vi in p.vertices:
                v=mesh.vertices[vi].co;shade=.84+.12*math.sin(v.x*42+v.y*27)+.09*math.sin(v.z*65)
                col.data[vi].color=(*[min(1,c*shade) for c in colors[self.keys[mi]]],1)
        return obj
def group(name):
    o=bpy.data.objects.get(name)
    if not o:o=bpy.data.objects.new(name,None);collection.objects.link(o)
    return o

hare=group('hare')
m=Mesh('Hare_body');m.loft([(0,-.34,.25,.035,.045),(0,-.24,.27,.19,.22),(0,-.02,.30,.20,.24),(0,.17,.32,.15,.19),(0,.28,.36,.09,.12)],'fur');m.ellipsoid((0,.02,.18),(.135,.23,.09),'cream');m.ellipsoid((0,-.34,.32),(.07,.09,.07),'cream');m.finish(hare)
head=group('Hare_head');head.parent=hare;head.location=(0,.25,.43)
m=Mesh('Hare_face');m.loft([(0,-.06,0,.09,.105),(0,.04,.01,.10,.10),(0,.15,-.03,.061,.05),(0,.19,-.04,.025,.024)],'fur');m.ellipsoid((0,.18,-.041),(.025,.015,.017),'dark')
for side in [-1,1]:m.ellipsoid((side*.087,.03,.045),(.013,.020,.019),'dark')
m.finish(head)
for side in [-1,1]:
    ear=Mesh('Hare_ear_'+str(side));ear.loft([(0,0,0,.03,.015),(side*.015,.0,.13,.037,.02),(side*.04,.0,.25,.017,.008),(side*.045,.0,.28,.001,.001)],'fur');ear.loft([(0,.011,.035,.016,.01),(side*.017,.012,.15,.018,.009),(side*.038,.010,.235,.002,.002)],'cream');ear.finish(head,(side*.053,-.02,.07))
    for front in [True,False]:
        limb=Mesh('Hare_'+('front_' if front else 'hind_')+str(side))
        limb.loft([(0,-.055,0,.075 if not front else .035,.11 if not front else .05),(0,.025,-.10,.045,.07),(0,.12,-.18,.035,.025),(0,.18,-.18,.026,.02)],'fur');limb.finish(hare,(side*(.12 if front else .16),.15 if front else -.19,.23))

crow=group('crow');m=Mesh('Crow_body');m.loft([(0,-.33,.19,.03,.025),(0,-.18,.20,.10,.07),(0,.04,.23,.12,.13),(0,.18,.28,.075,.08),(0,.23,.28,.045,.045)],'feather');m.ellipsoid((0,.18,.34),(.075,.08,.085),'feather');m.loft([(0,.23,.33,.04,.022),(0,.36,.315,.001,.002)],'beak');
for side in [-1,1]:m.ellipsoid((side*.066,.202,.355),(.008,.01,.009),'dark');m.tube((side*.055,0,.17),(side*.055,.025,.03),.009,.007,'beak');m.tube((side*.055,.025,.03),(side*.055,.10,.015),.007,.003,'beak')
m.finish(crow)
for side in [-1,1]:
    m=Mesh('Crow_wing_'+str(side))
    for i in range(7):
        x=side*(.1+i*.022);y=.07-i*.045
        m.add([(0,.05,.0),(x,y,.018),(side*(.25+i*.028),y-.10,.0),(side*(.30+i*.024),y-.17,-.009),(side*.06,y-.08,-.01)],[(0,1,2),(0,2,3),(0,3,4)],'feather')
    m.finish(crow,(side*.08,0,.28))

for name in ['mushrooms','berry_bush','herbs','fallen_branch']:
    m=Mesh(name)
    if name=='mushrooms':
        for x,y,size in [(-.12,.04,1),(.1,.1,.65),(.06,-.10,.8)]:
            m.tube((x,y,0),(x+.025,y,.23*size),.032*size,.025*size,'stem')
            # Closed cap with gently domed chestnut top and distinct underside.
            v=[];f=[]
            for ring in range(7):
                a=ring/6*math.pi/2
                for j in range(20):v.append((x+.025+math.sin(a)*.15*size*math.cos(j*math.tau/20),y+math.sin(a)*.15*size*math.sin(j*math.tau/20),(.20+math.cos(a)*.085)*size))
            for r in range(6):
                for j in range(20):f.append((r*20+j,r*20+(j+1)%20,(r+1)*20+(j+1)%20,(r+1)*20+j))
            m.add(v,f,'cap');m.add(v[-20:],[tuple(range(19,-1,-1))],'stem')
    elif name=='fallen_branch':
        m.tube((-.48,-.1,.05),(.45,.1,.08),.037,.02,'bark');m.tube((.05,.01,.06),(.28,.34,.09),.022,.006,'bark')
    else:
        for i in range(10 if name=='berry_bush' else 6):
            a=i*2.399;h=.5+rng.random()*.25 if name=='berry_bush' else .25+rng.random()*.2
            x,y=math.cos(a)*.28,math.sin(a)*.28;m.tube((0,0,0),(x,y,h),.015,.004,'bark' if name=='berry_bush' else 'herb')
            for j in range(4):
                z=h*(.35+j*.15);xx=x*z/h;yy=y*z/h;side=(-1)**j
                m.add([(xx,yy,z),(xx+side*.07,yy-.025,z+.04),(xx+side*.15,yy,z+.05),(xx+side*.07,yy+.035,z+.03)],[(0,1,2,3)],'leaf' if name=='berry_bush' else 'herb')
            if name=='berry_bush':
                for j in range(3):m.ellipsoid((x+(j-1)*.035,y,h-.08-j*.023),(.035,.034,.035),'berry')
    m.finish()
bpy.context.window.scene=scene
bpy.ops.object.select_all(action='DESELECT')
for obj in collection.objects:obj.select_set(True)
bpy.context.view_layer.objects.active=bpy.data.objects['Hare_body']
bpy.ops.export_scene.gltf(filepath=str(R/'assets/source/wildlife.raw.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_animations=False)
print(json.dumps({'objects':len(collection.objects),'vertices':sum(len(o.data.vertices) for o in collection.objects if o.type=='MESH'),'export':'wildlife.raw.glb'}))
