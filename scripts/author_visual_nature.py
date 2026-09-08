"""Visual-only replacement family. Run through Blender MCP; never saves the open .blend."""
import bpy, math, random, ast
from pathlib import Path
from mathutils import Vector
R=Path('C:/Users/jared/Local Sites/alderwatch')
scene=bpy.data.scenes.get('Alderwatch Sculpted Woodland') or bpy.data.scenes.new('Alderwatch Sculpted Woodland')
bpy.context.window.scene=scene
collection=bpy.data.collections.get('AW_VISUAL_WOODLAND')
if collection and len(collection.objects):raise RuntimeError('Woodland authoring collection already exists; inspect it instead of duplicating meshes.')
if collection is None:
    collection=bpy.data.collections.new('AW_VISUAL_WOODLAND');scene.collection.children.link(collection)
palette={'bark':(.5,.5,.5),'leaf':(.78,.86,.69),'stone':(.65,.66,.62)}
mats={}
for name,col in palette.items():
    m=bpy.data.materials.get('AW_'+name) or bpy.data.materials.new('AW_'+name)
    m.diffuse_color=(*col,1);m.roughness=.9;mats[name]=m
rng=random.Random(9108)
# Reuse the existing tested UV/tube/leaf mesh authoring implementation, not its full scene script.
tree=ast.parse((R/'scripts/build_environment.py').read_text())
klass=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='Model')
exec(compile(ast.Module(body=[klass],type_ignores=[]),'Model','exec'))
def curve(model,points,radii,sides):
    pts=[Vector(p) for p in points];path=[];rad=[]
    for i in range(len(pts)-1):
        p0=pts[max(0,i-1)];p1=pts[i];p2=pts[i+1];p3=pts[min(len(pts)-1,i+2)]
        for k in range(5):
            t=k/5;path.append(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t));rad.append(radii[i]*(1-t)+radii[i+1]*t)
    path.append(pts[-1]);rad.append(radii[-1]);model.tube(path,rad,sides=sides,ridges=.075)
for variant in range(3):
    rng.seed(933+variant);oak=Model('oak_'+str(variant));h=13.4+variant*1.3
    curve(oak,[(0,0,0),(.12,-.08,1.8),(-.26,.18,4.8),(.1,.35,7.8),(.65,.45,h-1)],[1.0,.72,.61,.38,.06],20)
    for k in range(7):
        a=k*2.4;v=Vector((math.cos(a),math.sin(a),0));curve(oak,[v*2.3+Vector((0,0,-.06)),v*1.25+Vector((0,0,.14)),v*.58+Vector((0,0,.7)),Vector((0,0,1.5))],[.025,.12,.25,.42],8)
    for k in range(9):
        a=k*2.399+variant*.7;start=Vector((-.1,.12,4.1+k*.62));rad=5.6-rng.random()*1.4
        direction=Vector((math.cos(a),math.sin(a),0));side=Vector((-math.sin(a),math.cos(a),0))
        end=start+direction*rad+Vector((0,0,2.2+rng.random()*2))
        curve(oak,[start,start+direction*1.6+Vector((0,0,.5)),start+direction*3.3+side*.5+Vector((0,0,.65)),end],[.43,.32,.20,.035],12)
        for j in range(4):
            p=start.lerp(end,.50+j*.14);tip=p+side*((j%2*2-1)*(1.1+rng.random()))+direction*.8+Vector((0,0,1.5+rng.random()))
            curve(oak,[p,p.lerp(tip,.5)-Vector((0,0,.22)),tip],[.13,.065,.008],7)
            for leaf in range(105):
                theta=rng.random()*math.tau;r=math.sqrt(rng.random());z=rng.uniform(-1,1)
                pos=tip+Vector((math.cos(theta)*1.9*r,math.sin(theta)*1.9*r,z*.9))
                oak.leaf(pos,rng.uniform(.48,.84),theta,rng.uniform(.2,1))
    oak.finish()
# Layered crags: asymmetric fractured strata, not smooth spherical pebbles.
for k in range(4):
    rng.seed(710+k);m=Model('rock_'+str(k));v=[];f=[];n=14
    outline=[rng.uniform(.75,1.2) for _ in range(n)]
    for level in range(5):
        z=level/4;radius=[.72,1,.88,.74,.48][level]
        for j in range(n):
            a=j*math.tau/n;r=outline[j]*radius;v.append((math.cos(a)*r*(1.35+k*.1)+z*.28,math.sin(a)*r*.95-z*.16,z*(1.5+k*.13)-.13+math.sin(a*3+k)*.10))
    for l in range(4):
        for j in range(n):a=l*n+j;b=l*n+(j+1)%n;f.append((a,b,b+n,a+n))
    f.extend([tuple(range(n-1,-1,-1)),tuple(range(4*n,5*n))]);m.add(v,f,'stone');o=m.finish()
    bevel=o.modifiers.new('Weathered fracture edges','BEVEL');bevel.width=.045;bevel.segments=2
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.modifier_apply(modifier=bevel.name);o.select_set(False)
    for face in o.data.polygons:face.use_smooth=False
bpy.ops.object.select_all(action='DESELECT')
for o in collection.objects:o.select_set(True)
out=R/'assets/source/visual-pass/woodland.glb'
bpy.ops.export_scene.gltf(filepath=str(out),use_selection=True,use_active_scene=True,export_format='GLB',export_animations=False)
print({'export':str(out),'objects':[o.name for o in collection.objects],'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in collection.objects)})
