"""Run in Blender MCP after integrate-visual-meshes has preserved survivor-original.glb.
Creates an isolated authoring scene, never saves or replaces the user's .blend.
Only geometry is exported here; the Node integration script preserves the shipping rig/clips.
"""
import bpy
from pathlib import Path
root=Path('C:/Users/jared/Local Sites/alderwatch')
if bpy.data.objects.get('SurvivorRig'):raise RuntimeError('Use a fresh authoring file: an existing survivor rig must not be overwritten or subdivided twice.')
scene=bpy.data.scenes.new('Alderwatch Character Refinement')
bpy.context.window.scene=scene
bpy.ops.import_scene.gltf(filepath=str(root/'assets/source/visual-pass/survivor-original.glb'))
names={'Male_Ranger_Head_Hood','Male_Ranger_Legs','Marcher shoulder cowl','Marcher split jerkin hem','Survivor Head'}
for obj in scene.objects:
    if obj.type!='MESH' or obj.name not in names:continue
    if obj.name=='Male_Ranger_Head_Hood':
        for v in obj.data.vertices:
            if v.co.z>1.79:v.co.z=1.79+(v.co.z-1.79)*.68
    if obj.name=='Marcher shoulder cowl':
        for v in obj.data.vertices:
            if abs(v.co.x)>.16:v.co.z-=min(.045,(abs(v.co.x)-.16)*.3)
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    modifier=obj.modifiers.new('Tailored soft silhouette','SUBSURF');modifier.levels=1
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    for face in obj.data.polygons:face.use_smooth=True
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.name in names or obj.type=='ARMATURE':obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(root/'assets/source/visual-pass/character-refined.glb'),use_selection=True,use_active_scene=True,export_format='GLB',export_animations=False,export_skins=True)
