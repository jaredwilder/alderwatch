"""Assemble licensed modular human and bake retargeted skeletal clips in Blender."""
import bpy, bmesh, math, json
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion
R=Path(r'C:\Users\jared\Local Sites\alderwatch')
scene=bpy.data.scenes['Alderwatch Characters']; bpy.context.window.scene=scene
rig=next(o for o in scene.objects if o.type=='ARMATURE' and o.get('alderwatch_source')=='Ranger')
donor=next(o for o in scene.objects if o.type=='ARMATURE' and o.get('alderwatch_source')=='Animations')
base=next(o for o in scene.objects if o.type=='ARMATURE' and o.get('alderwatch_source')=='Base')
rig.name='SurvivorRig'
parts=[o for o in scene.objects if o.type=='MESH' and o.get('alderwatch_source')=='Ranger' and not o.name.startswith('Icosphere')]
# Keep the complete authored face and neck; ranger clothing supplies body and hands.
head=bpy.data.objects['SuperHero_Male']; head.name='Survivor Head'
bm=bmesh.new(); bm.from_mesh(head.data)
bmesh.ops.delete(bm,geom=[v for v in bm.verts if (head.matrix_world@v.co).z<1.50],context='VERTS')
bm.to_mesh(head.data); bm.free()
parts += [head,bpy.data.objects['Eyes'],bpy.data.objects['Eyebrows']]
hairfile=R/'assets/source/characters/Universal Base Characters[Standard]/Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/Hair_SimpleParted.gltf'
before=set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=str(hairfile))
hair=[o for o in bpy.data.objects if o not in before and o.type=='MESH' and not o.name.startswith('Icosphere')]
parts+=hair
for obj in parts:
    world=obj.matrix_world.copy(); obj.parent=rig; obj.matrix_world=world
    for mod in obj.modifiers:
        if mod.type=='ARMATURE': mod.object=rig
    obj['asset_family']='survivor'
    # Individual hood can be toggled by the customization UI.
    if 'Hood' in obj.name: obj['equipment_slot']='hood'
    if 'Hair' in obj.name: obj['equipment_slot']='hair'

scene.render.fps=30
rig.animation_data_create(); rig.animation_data.action=None
for pb in rig.pose.bones: pb.rotation_mode='QUATERNION'; pb.matrix_basis=Matrix.Identity(4)
target_world=rig.matrix_world.copy(); inv=target_world.inverted()
rest={b.name:target_world@b.matrix_local for b in rig.data.bones}
source_rest={b.name:donor.matrix_world@b.matrix_local for b in donor.data.bones}
names=[b.name for b in rig.data.bones if b.name in source_rest]
clips={'Idle_Loop':'idle','Walk_Loop':'walk','Jog_Fwd_Loop':'run','Sprint_Loop':'sprint','Roll':'dodge','Sword_Attack':'attack','Sword_Idle':'guard','Hit_Chest':'hit','Death01':'death','Interact':'interact','Fixing_Kneeling':'build'}
source_actions={a.name.split('|')[-1]:a for a in bpy.data.actions if a.name.startswith('Rig|')}
report=[]
for src_name,out_name in clips.items():
    src=source_actions[src_name]; donor.animation_data.action=src; donor.animation_data.action_slot=src.slots[0]
    dst=bpy.data.actions.new(out_name); rig.animation_data.action=dst
    first,last=map(int,src.frame_range)
    for frame in range(first,last+1,2):
        scene.frame_set(frame)
        # Rebuild pose in parent order from rest lengths and donor's world rotation delta.
        for name in names:
            pb=rig.pose.bones[name]; sr=source_rest[name]; tw=rest[name]
            sw=donor.matrix_world@donor.pose.bones[name].matrix
            q=sw.to_quaternion()@sr.to_quaternion().inverted()@tw.to_quaternion()
            if pb.parent:
                parent_world=target_world@pb.parent.matrix
                pos=parent_world @ rest[pb.parent.name].inverted() @ tw.translation
            else: pos=tw.translation.copy()
            if name=='pelvis':
                pos.z += (sw.translation.z-sr.translation.z)
            pb.matrix=inv@Matrix.LocRotScale(pos,q,Vector((1,1,1)))
            pb.keyframe_insert(data_path='rotation_quaternion',frame=frame)
            if name in ('root','pelvis'): pb.keyframe_insert(data_path='location',frame=frame)
    dst.use_fake_user=True
    track=rig.animation_data.nla_tracks.new(); track.name=out_name
    strip=track.strips.new(out_name,1,dst); strip.action_slot=dst.slots[0]; track.mute=True
    report.append({'name':out_name,'frames':[first,last]})
rig.animation_data.action=None
for pb in rig.pose.bones: pb.matrix_basis=Matrix.Identity(4)
scene.frame_set(1)
# Explicit sockets are children of verified anatomical hand bones; no fallback exists.
assert 'hand_r' in rig.data.bones and 'hand_l' in rig.data.bones
for name,bone in [('Grip_R','hand_r'),('Grip_L','hand_l')]:
    socket=bpy.data.objects.new(name,None); scene.collection.objects.link(socket)
    socket.parent=rig; socket.parent_type='BONE'; socket.parent_bone=bone
    socket.location=(0,0,0); socket['verified_hand_bone']=bone
    parts.append(socket)
for o in scene.objects: o.select_set(False)
rig.select_set(True)
for o in parts: o.select_set(True)
bpy.context.view_layer.objects.active=rig
out=R/'public/assets/survivor.glb'
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_force_sampling=True,export_extras=True)
for o in scene.objects: o.hide_set(o not in parts and o!=rig)
bpy.ops.wm.save_as_mainfile(filepath=str(R/'assets/source/alderwatch-assets.blend'))
print('CHARACTER',json.dumps({'path':str(out),'clips':report,'parts':[o.name for o in parts],'hand_r':list((target_world@rig.data.bones['hand_r'].matrix_local).translation),'hand_l':list((target_world@rig.data.bones['hand_l'].matrix_local).translation)}))
