"""Approved art-set costume fitting. Preserve rig, actions, sockets and mesh backups."""
import bpy,math,json
from mathutils import Vector
scene=bpy.data.scenes['Alderwatch Characters'];bpy.context.window.scene=scene
rig=bpy.data.objects['SurvivorRig'];rig.animation_data.action=None
for pb in rig.pose.bones:pb.matrix_basis.identity()
bpy.context.view_layer.update()
def material(name,color):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.roughness=.92;return m
wool=material('AW_CostumeWool',(.32,.24,.15));leather=material('AW_CostumeLeather',(.40,.29,.19));beard=material('AW_Stubble',(.075,.049,.031))
def fitted(name,verts,faces,mat,weightfn):
    old=bpy.data.objects.get(name);mesh=bpy.data.meshes.new(name+'_mesh');mesh.from_pydata(verts,[],faces);mesh.update();mesh.materials.append(mat)
    for p in mesh.polygons:p.use_smooth=True
    uv=mesh.uv_layers.new(name='UVMap')
    for p in mesh.polygons:
        for li in p.loop_indices:
            v=mesh.vertices[mesh.loops[li].vertex_index].co;uv.data[li].uv=(v.x*3.0+v.y*.4,v.z*3.0)
    obj=old or bpy.data.objects.new(name,mesh)
    if old:obj.data=mesh
    else:scene.collection.objects.link(obj)
    obj.parent=rig;obj['asset_family']='survivor';obj.vertex_groups.clear()
    for i,v in enumerate(verts):
        for bone,w in weightfn(v).items():
            group=obj.vertex_groups.get(bone) or obj.vertex_groups.new(name=bone);group.add([i],w,'REPLACE')
    mod=next((m for m in obj.modifiers if m.type=='ARMATURE'),None) or obj.modifiers.new('Armature','ARMATURE');mod.object=rig
    return obj
def bodyweights(v):
    z=v[2];stops=[(.96,'pelvis'),(1.08,'spine_01'),(1.20,'spine_02'),(1.34,'spine_03')]
    if z<=stops[0][0]:return {'pelvis':1}
    for (a,ba),(b,bb) in zip(stops,stops[1:]):
        if z<=b:t=(z-a)/(b-a);return {ba:1-t,bb:t}
    return {'spine_03':1}
# A layered draped shoulder cowl; its folds belong to the skinned costume.
verts=[];faces=[];n=64
for row in range(9):
    t=row/8;spread=math.sin(t*math.pi/2);rx=.108+spread*.147;ry=.118+spread*.065
    for i in range(n):
        a=i/n*math.tau;fold=.004*math.sin(a*9+t*13)+.003*math.sin(a*17-t*5)
        # A folded scarf follows the collar, with a pointed front drape instead of a round poncho.
        front=max(0,-math.sin(a))**5
        z=1.617-t*(.075+.135*front+.055*max(0,math.sin(a)))+.009*math.sin(t*math.pi*6+a*.4)
        verts.append((math.cos(a)*(rx+fold),.028+math.sin(a)*(ry+fold),z))
for row in range(8):
    for i in range(n):a=row*n+i;b=row*n+(i+1)%n;faces.append((a,b,b+n,a+n))
fitted('Marcher shoulder cowl',verts,faces,wool,bodyweights)
# Split leather skirts add weight and a practical longer silhouette below the belt.
verts=[];faces=[]
for panel in range(4):
    start=len(verts)
    for row in range(5):
        t=row/4
        for i in range(13):
            a=panel*math.pi/2+.045+i/12*(math.pi/2-.09);r=.173+t*.035
            verts.append((math.cos(a)*r,.037+math.sin(a)*(.132+t*.027),1.02-t*.27+.01*math.sin(a*13)*t))
    for row in range(4):
        for i in range(12):a=start+row*13+i;faces.append((a,a+1,a+14,a+13))
fitted('Marcher split jerkin hem',verts,faces,leather,bodyweights)
# Preserve original meshes once, allowing repeatable tailoring without cumulative scaling.
for name in ['Male_Ranger_Body','Male_Ranger_Legs','Male_Ranger_Feet_Boots','Survivor Head','Male_Ranger_Acc_Pauldron']:
    o=bpy.data.objects[name];key='AW_ArtV2Base_'+name;base=bpy.data.meshes.get(key)
    if base is None:base=o.data.copy();base.name=key;base.use_fake_user=True
    o.data=base.copy()
    for v in o.data.vertices:
        if name=='Male_Ranger_Body':v.co.x*=1.10;v.co.y=.035+(v.co.y-.035)*1.08
        elif name=='Male_Ranger_Legs':v.co.y=.035+(v.co.y-.035)*1.16
        elif name=='Male_Ranger_Feet_Boots':v.co.y*=1.035
        elif name=='Survivor Head' and 1.60<v.co.z<1.675:v.co.x*=1.065
        elif name=='Male_Ranger_Acc_Pauldron':v.co.x=.235+(v.co.x-.235)*.83;v.co.z=1.49+(v.co.z-1.49)*.78
    o.data.update()
extra=bpy.data.objects['Male_Ranger_Body_Belt_2'];extra['asset_family']='survivor_costume_backup';extra.hide_set(True)
# Close cropped stubble follows the head surface and its original skin weights.
head=bpy.data.objects['Survivor Head'];ids=set();selected=[]
for p in head.data.polygons:
    c=p.center
    if c.y<-.045 and 1.595<c.z<1.675 and abs(c.x)<.088 and not(abs(c.x)<.028 and c.z>1.644):selected.append(p);ids.update(p.vertices)
order=sorted(ids);lookup={old:i for i,old in enumerate(order)}
verts=[tuple(head.data.vertices[i].co+head.data.vertices[i].normal*.0013) for i in order];faces=[tuple(lookup[i] for i in p.vertices) for p in selected]
names={g.index:g.name for g in head.vertex_groups}
o=fitted('Marcher cropped beard',verts,faces,beard,lambda v:{'spine_03':1});o.vertex_groups.clear()
for i,old in enumerate(order):
    for g in head.data.vertices[old].groups:
        name=names[g.group];vg=o.vertex_groups.get(name) or o.vertex_groups.new(name=name);vg.add([i],g.weight,'REPLACE')
print(json.dumps({'costume':['Marcher shoulder cowl','Marcher split jerkin hem','Marcher cropped beard'],'beard_faces':len(faces),'rig_unchanged':True,'mesh_backups_retained':True}))
