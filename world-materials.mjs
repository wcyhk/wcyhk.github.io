// Procedural PBR surfaces and radiance: no remote textures, models or keys.
export function createSurfaceKit(THREE){
  const size=192,heights=new Float32Array(size*size),albedo=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4),roughness=new Uint8Array(size*size*4),inlay=new Uint8Array(size*size*4);
  const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
  function noise(u,v,period){let x=u*period,y=v*period,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);const h=(a,b)=>hash((a+period)%period,(b+period)%period);return (h(ix,iy)*(1-fx)+h(ix+1,iy)*fx)*(1-fy)+(h(ix,iy+1)*(1-fx)+h(ix+1,iy+1)*fx)*fy;}
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=x/size,v=y/size;heights[y*size+x]=noise(u,v,8)*.58+noise(u,v,24)*.28+noise(u,v,64)*.14;}
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,u=x/size,v=y/size,n=heights[y*size+x],grain=hash(x,y),edge=Math.min(u,v,1-u,1-v);
    const h=(a,b)=>heights[((b+size)%size)*size+(a+size)%size];
    const nx=(h(x-1,y)-h(x+1,y))*4,ny=(h(x,y-1)-h(x,y+1))*4,length=Math.hypot(nx,ny,1);
    normal.set([(nx/length*.5+.5)*255,(ny/length*.5+.5)*255,(1/length*.5+.5)*255,255],i);
    const fissure=Math.pow(Math.max(0,1-Math.abs(n-.47)*35),3),shade=n*.8+grain*.08-fissure*.11;
    albedo.set([111+shade*62,122+shade*57,132+shade*51,255],i);
    roughness.set([181+n*63,181+n*63,181+n*63,255],i);
    const line=Math.abs(edge-.085)<.006||Math.abs(Math.abs(u-.5)+Math.abs(v-.5)-.27)<.006||Math.abs(u-.5)<.004&&Math.abs(v-.5)<.15;
    inlay.set(line?[191,159,101,255]:[133+shade*50,140+shade*48,147+shade*44,255],i);
  }
  const texture=(data,colorSpace,repeat=3)=>{const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.colorSpace=colorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;};
  const maps={map:texture(albedo,THREE.SRGBColorSpace),normalMap:texture(normal,THREE.NoColorSpace),roughnessMap:texture(roughness,THREE.NoColorSpace),inlayMap:texture(inlay,THREE.SRGBColorSpace,1)};
  let envTarget;
  function environment(renderer){
    const anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());Object.values(maps).forEach(t=>{t.anisotropy=anisotropy;});
    if(!renderer.extensions.has('EXT_color_buffer_float'))return null;
    const width=256,height=128,data=new Float32Array(width*height*4);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const phi=(x+.5)/width*Math.PI*2,theta=(y+.5)/height*Math.PI,s=Math.sin(theta),dx=Math.cos(phi)*s,dy=Math.cos(theta),dz=Math.sin(phi)*s;
      const horizon=Math.exp(-Math.abs(dy)*4),warm=Math.pow(Math.max(0,-dx*.45+dy*.72+dz*.52),58),cool=Math.pow(Math.max(0,dx*.68+dy*.25-dz*.68),34),i=(y*width+x)*4;
      data.set([.018+horizon*.13+warm*5+cool*.28,.032+horizon*.17+warm*2.9+cool*.72,.065+horizon*.23+warm*1.1+cool*1.25,1],i);
    }
    const env=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.FloatType);env.mapping=THREE.EquirectangularReflectionMapping;env.needsUpdate=true;
    const generator=new THREE.PMREMGenerator(renderer);envTarget=generator.fromEquirectangular(env);env.dispose();generator.dispose();return envTarget.texture;
  }
  const shape=new THREE.Shape();shape.moveTo(-.42,-.5);shape.lineTo(.42,-.5);shape.quadraticCurveTo(.5,-.5,.5,-.42);shape.lineTo(.5,.42);shape.quadraticCurveTo(.5,.5,.42,.5);shape.lineTo(-.42,.5);shape.quadraticCurveTo(-.5,.5,-.5,.42);shape.lineTo(-.5,-.42);shape.quadraticCurveTo(-.5,-.5,-.42,-.5);
  const bevelGeometry=new THREE.ExtrudeGeometry(shape,{depth:.86,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.045,bevelThickness:.045,curveSegments:3});bevelGeometry.center();bevelGeometry.computeBoundingBox();const bounds=bevelGeometry.boundingBox.getSize(new THREE.Vector3());bevelGeometry.scale(1/bounds.x,1/bounds.y,1/bounds.z);
  return {...maps,bevelGeometry,environment,dispose(){Object.values(maps).forEach(t=>t.dispose());envTarget?.dispose();}};
}
