// A depth prepass keeps a translucent building's back walls from showing through its facade.
// All transforms remain fixed: only opacity and holy surface radiance change.
export function createManifestation(THREE,root){
  const meshes=[],materials=new Map(),depthMaterial=new THREE.MeshDepthMaterial({depthWrite:true,depthTest:true,colorWrite:false});
  const reveal={value:0},clock={value:0};root.updateMatrixWorld(true);
  root.traverse(o=>{if(o.isMesh&&!o.userData.revealIgnore)meshes.push(o);});
  const passes=[];
  for(const mesh of meshes){
    const original=mesh.material;
    if(!materials.has(original.uuid)){
      const m=original.clone();m.transparent=true;m.opacity=0;m.depthWrite=false;m.side=THREE.FrontSide;
      if(m.isMeshStandardMaterial){m.onBeforeCompile=shader=>{
        shader.uniforms.uManifest=reveal;shader.uniforms.uManifestTime=clock;
        shader.fragmentShader='uniform float uManifest,uManifestTime;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
          float edge=pow(clamp(1.-abs(dot(normal,normalize(vViewPosition))),0.,1.),2.);
          float scan=pow(max(0.,sin(vViewPosition.y*17.+uManifestTime*1.8)),18.);
          totalEmissiveRadiance+=vec3(1.8,1.2,.42)*(edge*.7+scan*.13)*(1.-uManifest);`);
      };m.customProgramCacheKey=()=> 'manifestation-v1';}
      materials.set(original.uuid,m);
    }
    mesh.material=materials.get(original.uuid);mesh.renderOrder=21;
    const pass=mesh.isInstancedMesh?new THREE.InstancedMesh(mesh.geometry,depthMaterial,mesh.count):new THREE.Mesh(mesh.geometry,depthMaterial);
    if(mesh.isInstancedMesh)pass.instanceMatrix=mesh.instanceMatrix;
    pass.position.copy(mesh.position);pass.quaternion.copy(mesh.quaternion);pass.scale.copy(mesh.scale);pass.renderOrder=19;pass.name='Manifestation depth prepass';pass.visible=false;mesh.parent.add(pass);passes.push(pass);
  }
  return {root,meshes,passes,materials:[...materials.values()],
    update(amount,time){const a=Math.max(0,Math.min(1,amount));reveal.value=a;clock.value=time;
      for(const mesh of meshes){mesh.visible=a>0;mesh.material.opacity=a;mesh.material.depthWrite=a>=.999;mesh.material.depthFunc=a>=.999?THREE.LessEqualDepth:THREE.EqualDepth;}
      for(const pass of passes)pass.visible=a>0&&a<.999;
    },
  };
}
