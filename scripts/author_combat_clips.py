"""Author contact-matched sword cuts on the existing anatomical arm chains.

This is a mesh/Action capability gap in the structured MCP surface. No nodes
or unrelated scenes are changed. Prior Actions remain as fake-user backups.
"""
import bpy, math, json
from mathutils import Vector, Matrix, Quaternion
scene=bpy.data.scenes['Alderwatch Characters'];bpy.context.window.scene=scene
rig=bpy.data.objects['SurvivorRig'];scene.render.fps=30
rig.animation_data.action=bpy.data.actions['idle'];rig.animation_data.action_slot=rig.animation_data.action.slots[0]
scene.frame_set(1);bpy.context.view_layer.update()
base={pb.name:pb.matrix_basis.copy() for pb in rig.pose.bones}
handq={side:rig.pose.bones['hand_'+side].matrix.to_quaternion().copy() for side in ('r','l')}
rest={b.name:b.matrix_local.copy() for b in rig.data.bones}
rig.animation_data.action=bpy.data.actions['guard'];rig.animation_data.action_slot=rig.animation_data.action.slots[0]
scene.frame_set(1);bpy.context.view_layer.update()
fingers={pb.name:pb.matrix_basis.copy() for pb in rig.pose.bones if any(pb.name.startswith(n) for n in ('index','middle','ring','pinky','thumb'))}

def bone_direction(name,start,end):
    b=rig.data.bones[name];q=(b.tail_local-b.head_local).rotation_difference(end-start)@rest[name].to_quaternion()
    rig.pose.bones[name].matrix=Matrix.LocRotScale(start,q,Vector((1,1,1)));bpy.context.view_layer.update()

def arm(side,wrist,shaft):
    upper=rig.pose.bones['upperarm_'+side];lower=rig.pose.bones['lowerarm_'+side]
    shoulder=upper.head.copy();l1=rig.data.bones[upper.name].length;l2=rig.data.bones[lower.name].length
    line=wrist-shoulder;d=min(line.length,l1+l2-.006);axis=line.normalized();wrist=shoulder+axis*d
    pole=Vector((-1 if side=='r' else 1,.28,-.22));bend=(pole-axis*pole.dot(axis)).normalized()
    along=(l1*l1-l2*l2+d*d)/(2*d);elbow=shoulder+axis*along+bend*math.sqrt(max(0,l1*l1-along*along))
    bone_direction(upper.name,shoulder,elbow);bone_direction(lower.name,elbow,wrist)
    q=Vector((0,-.20,-.98)).rotation_difference(shaft)@handq[side]
    rig.pose.bones['hand_'+side].matrix=Matrix.LocRotScale(wrist,q,Vector((1,1,1)));bpy.context.view_layer.update()

poses={
 'guard':[(1,(-.15,-.37,1.15),(-.42,-.25,.873),-.025,0),
          (25,(-.15,-.37,1.17),(-.42,-.25,.873),-.015,.015),
          (49,(-.15,-.37,1.15),(-.42,-.25,.873),-.025,0)],
 'attack':[(1,(-.27,-.17,1.02),(0,-.2,-.98),0,0),
           (6,(-.38,.04,1.36),(-.7,.12,.7),-.07,-.16),
           (10,(-.39,.06,1.39),(-.72,.1,.68),-.08,-.21),
           (14,(-.18,-.55,1.13),(.1,-.99,-.07),.10,.12),
           (19,(.30,-.41,.94),(.84,-.42,-.33),.14,.25),
           (25,(-.17,-.28,1.0),(.20,-.50,-.84),.03,.10),
           (32,(-.27,-.17,1.02),(0,-.2,-.98),0,0)],
 'heavy':[(1,(-.27,-.17,1.02),(0,-.2,-.98),0,0),
          (10,(-.14,.06,1.53),(0,.28,.96),-.12,-.08),
          (20,(-.13,.10,1.58),(0,.4,.92),-.17,-.1),
          (26,(-.18,-.55,1.12),(0,-.985,-.17),.20,.06),
          (31,(-.12,-.47,.86),(0,-.70,-.71),.27,.12),
          (40,(-.24,-.30,.94),(0,-.47,-.88),.09,.03),
          (48,(-.27,-.17,1.02),(0,-.2,-.98),0,0)]
}
for name,keys in poses.items():
    rig.animation_data.action=None
    for track in list(rig.animation_data.nla_tracks):
        if track.name==name:rig.animation_data.nla_tracks.remove(track)
    old=bpy.data.actions.get(name)
    if old:old.name='combat_backup_'+name;old.use_fake_user=True
    action=bpy.data.actions.new(name);rig.animation_data.action=action
    previous={}
    for frame,wrist,direction,lean,twist in keys:
        scene.frame_set(frame)
        for pb in rig.pose.bones:pb.matrix_basis=base[pb.name]
        for bone,m in fingers.items():rig.pose.bones[bone].matrix_basis=m
        spine=rig.pose.bones['spine_02'];spine.rotation_mode='QUATERNION'
        spine.rotation_quaternion=base[spine.name].to_quaternion()@Quaternion((1,0,0),lean)@Quaternion((0,1,0),twist)
        bpy.context.view_layer.update();shaft=Vector(direction).normalized();w=Vector(wrist)
        arm('r',w,shaft)
        if name in ('heavy','guard'):arm('l',w-shaft*.10,shaft)
        else:arm('l',Vector((.28,-.21,1.16)),Vector((0,-.5,-.86)))
        for pb in rig.pose.bones:
            pb.rotation_mode='QUATERNION';q=pb.rotation_quaternion.copy()
            if pb.name in previous:q.make_compatible(previous[pb.name])
            previous[pb.name]=q.copy();pb.rotation_quaternion=q;pb.keyframe_insert('rotation_quaternion',frame=frame)
            if pb.name in ('root','pelvis'):pb.keyframe_insert('location',frame=frame)
    action.use_fake_user=True
    if name!='guard':action['impact_seconds']=(13 if name=='attack' else 25)/30
    track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action);strip.action_slot=action.slots[0];track.mute=True
rig.animation_data.action=None;scene.frame_set(1);bpy.context.view_layer.update()
print(json.dumps({'authored':['guard','attack','heavy'],'attack_contact':13/30,'heavy_contact':25/30,'backups_retained':True}))
