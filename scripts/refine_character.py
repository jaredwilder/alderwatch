"""Restore anatomically exposed skin under the modular Ranger outfit; export only the survivor."""
import bpy,bmesh,json
from pathlib import Path
R=Path(r'C:\Users\jared\Local Sites\alderwatch')
scene=bpy.data.scenes['Alderwatch Characters']; bpy.context.window.scene=scene
rig=bpy.data.objects['SurvivorRig']
skin=bpy.data.objects.get('Survivor Upper Arms')
if skin is None:
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(R/'assets/source/characters/Universal Base Characters[Standard]/Base Characters/Godot - UE/Superhero_Male_FullBody.gltf'))
    imported=[o for o in bpy.data.objects if o not in before]
    skin=next(o for o in imported if o.type=='MESH' and 'SuperHero_Male' in o.name)
    skin.name='Survivor Upper Arms'
    bm=bmesh.new();bm.from_mesh(skin.data)
    remove=[]
    for v in bm.verts:
        p=skin.matrix_world@v.co
        if not(1.18<p.z<1.56 and .21<abs(p.x)<.53):remove.append(v)
    bmesh.ops.delete(bm,geom=remove,context='VERTS');bm.to_mesh(skin.data);bm.free()
    world=skin.matrix_world.copy();skin.parent=rig;skin.matrix_world=world
    for mod in skin.modifiers:
        if mod.type=='ARMATURE':mod.object=rig
    skin['asset_family']='survivor'
    for obj in imported:
        if obj!=skin:obj.hide_set(True)
# Keep non-destructive mesh backups before fitting the modular skin under clothing.
head=bpy.data.objects['Survivor Head']
if not head.get('neck_crop_v2'):
    backup=head.data.copy();backup.name='AW_Backup_HeadBeforeNeckFit';backup.use_fake_user=True
    bm=bmesh.new();bm.from_mesh(head.data)
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if abs(v.co.x)>.16 and v.co.z<1.64],context='VERTS')
    bm.to_mesh(head.data);bm.free();head['neck_crop_v2']=True
if not skin.get('fit_under_sleeves_v2'):
    backup=skin.data.copy();backup.name='AW_Backup_UpperArmsBeforeFit';backup.use_fake_user=True
    for v in skin.data.vertices:
        v.co.y=.0654+(v.co.y-.0654)*.84
        v.co.z=1.4555+(v.co.z-1.4555)*.84
    skin.data.update();skin['fit_under_sleeves_v2']=True
# The licensed Ranger arm mesh includes complete cloth sleeves. The extra skin
# was crossing that surface; retain it as a source backup, never export both.
skin['asset_family']='survivor_skin_backup';skin.hide_set(True)
parts=[o for o in scene.objects if o.get('asset_family')=='survivor']
parts += [bpy.data.objects['Grip_R'],bpy.data.objects['Grip_L'],rig]
for o in scene.objects:o.select_set(False)
for o in parts:o.hide_set(False);o.select_set(True)
bpy.context.view_layer.objects.active=rig
rig.animation_data.action=None
for pb in rig.pose.bones:pb.matrix_basis.identity()
scene.frame_set(1)
bpy.ops.export_scene.gltf(filepath=str(R/'assets/source/survivor.raw.glb'),export_format='GLB',use_active_scene=True,use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_force_sampling=True,export_extras=True)
print(json.dumps({'parts':[o.name for o in parts],'upper_arm_vertices':len(skin.data.vertices)}))
bpy.ops.wm.save_as_mainfile(filepath=str(R/'assets/source/alderwatch-assets.blend'))
