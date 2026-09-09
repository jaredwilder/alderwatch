import * as T from 'three';
import {Assets} from './assets';

const marker=Symbol.for('alderwatch.tree-bark-hd.v1');
const globalState=globalThis as typeof globalThis&{[key:symbol]:boolean};

if(!globalState[marker]){
  globalState[marker]=true;
  const originalLoad=Assets.prototype.load;
  Assets.prototype.load=async function(progress:(message:string)=>void){
    await originalLoad.call(this,progress);
    try{
      const bark=await new T.TextureLoader().loadAsync('/textures/bark-hd.webp');
      bark.colorSpace=T.SRGBColorSpace;
      bark.wrapS=bark.wrapT=T.RepeatWrapping;
      bark.anisotropy=8;
      this.textures['bark-hd']=bark;
      const seen=new Set<T.Material>();
      this.kit.scene.traverse(o=>{
        if(!(o instanceof T.Mesh))return;
        for(const material of (Array.isArray(o.material)?o.material:[o.material]) as T.MeshStandardMaterial[]){
          if(material.name!=='AW_bark'||seen.has(material))continue;
          seen.add(material);
          material.map=bark;
          material.bumpMap=bark;
          material.bumpScale=.032;
          material.normalMap=null;
          material.roughnessMap=null;
          material.roughness=.95;
          material.metalness=0;
          material.color.setRGB(.96,.96,.96);
          material.needsUpdate=true;
        }
      });
    }catch(error){
      console.warn('Alderwatch HD tree bark texture failed; keeping stock bark.',error);
    }
  };
}
