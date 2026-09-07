import bpy, json
from pathlib import Path
root=Path(r'C:\Users\jared\Local Sites\alderwatch')
scene=bpy.data.scenes.get('Alderwatch Characters') or bpy.data.scenes.new('Alderwatch Characters')
bpy.context.window.scene=scene
sources=[
 ('Base',root/'assets/source/characters/Universal Base Characters[Standard]/Base Characters/Godot - UE/Superhero_Male_FullBody.gltf'),
 ('Ranger',root/'assets/source/outfits/Modular Character Outfits - Fantasy[Standard]/Exports/glTF (Godot-Unreal)/Outfits/Male_Ranger.gltf'),
 ('Animations',root/'assets/source/animations/Animation Library[Standard]/Unreal Engine/AL_Standard.fbx')
]
for label,path in sources:
    before=set(bpy.data.objects)
    if path.suffix=='.fbx': bpy.ops.import_scene.fbx(filepath=str(path))
    else: bpy.ops.import_scene.gltf(filepath=str(path))
    imported=[o for o in bpy.data.objects if o not in before]
    for o in imported: o['alderwatch_source']=label
    print(label,json.dumps([{'name':o.name,'type':o.type,'dimensions':list(o.dimensions),'bones':[b.name for b in o.data.bones] if o.type=='ARMATURE' else None} for o in imported]))
print('ACTIONS',json.dumps([{'name':a.name,'frames':list(a.frame_range),'slots':[s.identifier for s in a.slots]} for a in bpy.data.actions]))
