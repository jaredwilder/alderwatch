"""Author two-handed axe and mining motions on actual anatomical arm chains."""
import bpy,math,json
from mathutils import Vector,Matrix,Quaternion
scene=bpy.data.scenes['Alderwatch Characters'];bpy.context.window.scene=scene
rig=bpy.data.objects['SurvivorRig'];scene.render.fps=30
idle=bpy.data.actions['idle'];rig.animation_data.action=idle;rig.animation_data.action_slot=idle.slots[0];scene.frame_set(1);bpy.context.view_layer.update()
base={pb.name:pb.matrix_basis.copy() for pb in rig.pose.bones}
handq={side:rig.pose.bones['hand_'+side].matrix.to_quaternion().copy() for side in ('r','l')}
guard=bpy.data.actions['guard'];rig.animation_data.action=guard;rig.animation_data.action_slot=guard.slots[0];scene.frame_set(1);bpy.context.view_layer.update()
fingers={pb.name:pb.matrix_basis.copy() for pb in rig.pose.bones if any(pb.name.startswith(n) for n in ('index','middle','ring','pinky','thumb'))}
rest={b.name:b.matrix_local.copy() for b in rig.data.bones}
def pose_bone_direction(name,start,end):
    b=rig.data.bones[name];pb=rig.pose.bones[name]
    q=(b.tail_local-b.head_local).rotation_difference(end-start)@rest[name].to_quaternion()
    pb.matrix=Matrix.LocRotScale(start,q,Vector((1,1,1)));bpy.context.view_layer.update()
def arm(side,wrist,shaft):
    up=rig.pose.bones['upperarm_'+side];lo=rig.pose.bones['lowerarm_'+side]
    shoulder=up.head.copy();length1=rig.data.bones[up.name].length;length2=rig.data.bones[lo.name].length
    line=wrist-shoulder;distance=min(line.length,length1+length2-.006);axis=line.normalized();wrist=shoulder+axis*distance
    pole=Vector((-1 if side=='r' else 1,.28,-.22));bend=(pole-axis*pole.dot(axis)).normalized()
    along=(length1**2-length2**2+distance**2)/(2*distance);off=math.sqrt(max(0,length1**2-along**2))
    elbow=shoulder+axis*along+bend*off
    pose_bone_direction(up.name,shoulder,elbow);pose_bone_direction(lo.name,elbow,wrist)
    q=Vector((0,-.20,-.98)).rotation_difference(shaft)@handq[side]
    rig.pose.bones['hand_'+side].matrix=Matrix.LocRotScale(wrist,q,Vector((1,1,1)));bpy.context.view_layer.update()
for name in ('chop','mine'):
    rig.animation_data.action=None
    for track in list(rig.animation_data.nla_tracks):
        if track.name==name:rig.animation_data.nla_tracks.remove(track)
    previous=bpy.data.actions.get(name)
    if previous:previous.name='tool_backup_'+name;previous.use_fake_user=True
    action=bpy.data.actions.new(name);rig.animation_data.action=action
    # A compact lateral cut driven by torso rotation, not an overhead windmill.
    poses=[(1,(-.27,-.17,1.02),(0,-.20,-.98),0),(8,(-.44,-.05,1.17),(-.86,.43,.27),-.05),(12,(-.42,.02,1.21),(-.94,.25,.22),-.07),(18,(-.23,-.49,1.07),(0,-.96,-.28),.11),(23,(.18,-.42,.99),(.86,-.48,-.16),.14),(30,(-.13,-.28,1.02),(.32,-.71,-.62),.04),(38,(-.27,-.17,1.02),(0,-.20,-.98),0)]
    if name=='mine':poses=[(f,(p[0],p[1],p[2]-.10),Vector((d[0],d[1],d[2]-.23)).normalized(),lean+.06) for f,p,d,lean in poses]
    previous={}
    for frame in range(1,39):
        a,b=next(((a,b) for a,b in zip(poses,poses[1:]) if a[0]<=frame<=b[0]),(poses[-1],poses[-1]))
        t=0 if a[0]==b[0] else (frame-a[0])/(b[0]-a[0]);t=t*t*(3-2*t)
        wrist=Vector(a[1]).lerp(Vector(b[1]),t);direction=Vector(a[2]).lerp(Vector(b[2]),t);lean=a[3]*(1-t)+b[3]*t
        scene.frame_set(frame)
        for pb in rig.pose.bones:pb.matrix_basis=base[pb.name]
        for n,m in fingers.items():rig.pose.bones[n].matrix_basis=m
        spine=rig.pose.bones['spine_02'];spine.rotation_mode='QUATERNION';spine.rotation_quaternion=base[spine.name].to_quaternion()@Quaternion((1,0,0),lean)@Quaternion((0,1,0),-.20*math.sin((frame-1)/37*math.tau))
        bpy.context.view_layer.update();shaft=Vector(direction).normalized();point=Vector(wrist)
        arm('r',point,shaft);arm('l',point+shaft*.16,shaft)
        for pb in rig.pose.bones:
            pb.rotation_mode='QUATERNION';q=pb.rotation_quaternion.copy()
            if pb.name in previous:q.make_compatible(previous[pb.name])
            previous[pb.name]=q.copy();pb.rotation_quaternion=q;pb.keyframe_insert('rotation_quaternion',frame=frame)
            if pb.name in ('root','pelvis'):pb.keyframe_insert('location',frame=frame)
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:key.interpolation='LINEAR'
    action.use_fake_user=True;track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action);strip.action_slot=action.slots[0];track.mute=True
rig.animation_data.action=None
print(json.dumps({'authored':['chop','mine'],'duration':37/30,'impact_seconds':17/30,'rig':rig.name}))
