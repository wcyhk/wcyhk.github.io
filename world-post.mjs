// Small, local HDR pipeline: scene -> highlight extraction -> separable blur -> ACES.
// No network assets or runtime dependencies beyond the vendored Three.js module.
export function createWorldPost(THREE,renderer){
  const target=()=>new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false});
  const hdr=target();hdr.depthBuffer=true;
  const bright=target(),blurX=target(),blurY=target();
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
  const material=(uniforms,fragment,toneMapped=false)=>new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,depthTest:false,depthWrite:false,toneMapped});
  const extract=material({image:{value:hdr.texture}},`varying vec2 vUv;uniform sampler2D image;void main(){vec3 c=texture2D(image,vUv).rgb;float b=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(.65,2.4,b),1.);}`);
  const blur=material({image:{value:null},stepUv:{value:new THREE.Vector2()}},`varying vec2 vUv;uniform sampler2D image;uniform vec2 stepUv;void main(){vec3 c=texture2D(image,vUv).rgb*.227027;c+=(texture2D(image,vUv+stepUv*1.384615).rgb+texture2D(image,vUv-stepUv*1.384615).rgb)*.316216;c+=(texture2D(image,vUv+stepUv*3.230769).rgb+texture2D(image,vUv-stepUv*3.230769).rgb)*.070270;gl_FragColor=vec4(c,1.);}`);
  const finish=material({image:{value:hdr.texture},bloom:{value:blurY.texture},energy:{value:0}},`varying vec2 vUv;uniform sampler2D image;uniform sampler2D bloom;uniform float energy;void main(){vec2 p=vUv-.5;vec3 c=texture2D(image,vUv).rgb+texture2D(bloom,vUv).rgb*(.48+energy*.2);float vignette=1.-smoothstep(.23,.78,length(p))*.3;c*=vignette;gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`,true);
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),extract);quad.frustumCulled=false;scene.add(quad);
  let width=1,height=1;
  const draw=(mat,out)=>{quad.material=mat;renderer.setRenderTarget(out);renderer.render(scene,camera);};
  return {
    resize(w,h){width=Math.max(1,Math.floor(w/3));height=Math.max(1,Math.floor(h/3));hdr.setSize(w,h);for(const t of [bright,blurX,blurY])t.setSize(width,height);},
    render(world,camera,energy){
      renderer.setRenderTarget(hdr);renderer.render(world,camera);draw(extract,bright);
      blur.uniforms.image.value=bright.texture;blur.uniforms.stepUv.value.set(1.8/width,0);draw(blur,blurX);
      blur.uniforms.image.value=blurX.texture;blur.uniforms.stepUv.value.set(0,1.8/height);draw(blur,blurY);
      finish.uniforms.energy.value=energy;draw(finish,null);
    },
    dispose(){for(const t of [hdr,bright,blurX,blurY])t.dispose();for(const m of [extract,blur,finish])m.dispose();quad.geometry.dispose();},
  };
}
