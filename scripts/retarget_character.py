"""Bake parent-relative rotations explicitly. Never read half-updated target pose matrices."""
import bpy,json
from mathutils import Matrix,Vector
scene=bpy.data.scenes['Alderwatch Characters'];bpy.context.window.scene=scene
rig=bpy.data.objects['SurvivorRig'];donor=bpy.data.objects['Rig']
clips={'Idle_Loop':'idle','Walk_Loop':'walk','Jog_Fwd_Loop':'run','Sprint_Loop':'sprint','Roll':'dodge','Sword_Attack':'attack','Sword_Idle':'guard','Hit_Chest':'hit','Death01':'death','Interact':'interact','Fixing_Kneeling':'build'}
source={a.name.split('|')[-1]:a for a in bpy.data.actions if a.name.startswith('Rig|')}
rest={b.name:rig.matrix_world@b.matrix_local for b in rig.data.bones}
srest={b.name:donor.matrix_world@b.matrix_local for b in donor.data.bones}
names=[b.name for b in rig.data.bones if b.name in srest]
rig.animation_data.action=None
for t in list(rig.animation_data.nla_tracks):
    if t.name in clips.values():rig.animation_data.nla_tracks.remove(t)
for name in clips.values():
    a=bpy.data.actions.get(name)
    if a:a.name='retarget_backup_'+name;a.use_fake_user=True
for src_name,name in clips.items():
    src=source[src_name];donor.animation_data.action=src;donor.animation_data.action_slot=src.slots[0]
    dst=bpy.data.actions.new(name);rig.animation_data.action=dst
    for pb in rig.pose.bones:pb.rotation_mode='QUATERNION';pb.matrix_basis=Matrix.Identity(4)
    first,last=map(int,src.frame_range)
    previous={}
    for frame in range(first,last+1):
        scene.frame_set(frame);bpy.context.view_layer.update()
        worldq={n:(donor.matrix_world@donor.pose.bones[n].matrix).to_quaternion()@srest[n].to_quaternion().inverted()@rest[n].to_quaternion() for n in names}
        for n in names:
            pb=rig.pose.bones[n]
            parent=pb.parent.name if pb.parent else None
            parentrest=rest[parent].to_quaternion() if parent else rig.matrix_world.to_quaternion()
            parentpose=worldq[parent] if parent in worldq else parentrest
            localrest=parentrest.inverted()@rest[n].to_quaternion()
            localpose=parentpose.inverted()@worldq[n]
            q=localrest.inverted()@localpose
            if n in previous:q.make_compatible(previous[n])
            previous[n]=q.copy();pb.rotation_quaternion=q
            pb.location=(0,0,0)
            if n=='pelvis':
                dz=(donor.matrix_world@donor.pose.bones[n].matrix).translation.z-srest[n].translation.z
                pb.location=rest[n].to_3x3().inverted()@Vector((0,0,dz))
            pb.keyframe_insert('rotation_quaternion',frame=frame)
            if n in ('root','pelvis'):pb.keyframe_insert('location',frame=frame)
    for layer in dst.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:key.interpolation='LINEAR'
    dst.use_fake_user=True
    t=rig.animation_data.nla_tracks.new();t.name=name;strip=t.strips.new(name,1,dst);strip.action_slot=dst.slots[0];t.mute=True
rig.animation_data.action=bpy.data.actions['idle'];rig.animation_data.action_slot=bpy.data.actions['idle'].slots[0];scene.frame_set(1);bpy.context.view_layer.update()
print('RETARGET_CHECK',json.dumps({n:list(rig.matrix_world@rig.pose.bones[n].head) for n in ['upperarm_r','hand_r','upperarm_l','hand_l','spine_03']}))
rig.animation_data.action=None
