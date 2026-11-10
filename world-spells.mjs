// Shared radial field: every surface is removed only after the visible wave reaches it.
export function holySkin(material,field){
  material.onBeforeCompile=s=>{s.uniforms.uHolyRadius=field.radius;s.uniforms.uHolyActive=field.active;s.uniforms.uSpellClock=field.clock;
    s.vertexShader='varying vec3 vHolyWorld;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
      vec4 holyPosition=vec4(transformed,1.);
      #ifdef USE_INSTANCING
      holyPosition=instanceMatrix*holyPosition;
      #endif
      vHolyWorld=(modelMatrix*holyPosition).xyz;`);
    s.fragmentShader='varying vec3 vHolyWorld;uniform float uHolyRadius,uHolyActive,uSpellClock;\n'+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
      float holyDistance=length(vHolyWorld-vec3(0.,3.9,-3.2));
      float holyGrain=fract(sin(dot(floor(vHolyWorld*12.),vec3(12.9898,78.233,37.719)))*43758.5453);
      if(uHolyActive>.5&&holyDistance+holyGrain*.24<uHolyRadius)discard;`);
    s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      totalEmissiveRadiance+=vec3(3.,1.9,.6)*exp(-abs(holyDistance-uHolyRadius)*9.)*uHolyActive*step(.01,uHolyRadius);
      float spellScan=pow(max(0.,sin(vHolyWorld.y*7.-uSpellClock*3.)),22.);
      totalEmissiveRadiance+=vec3(.26,.045,.38)*spellScan;`);
  };material.customProgramCacheKey=()=> 'radial-holy-skin-v2';return material;
}

export function createRuneTexture(THREE){
  const width=512,height=64,data=new Uint8Array(width*height*4);
  function stroke(x0,y0,x1,y1){const count=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let j=0;j<=count;j++){const x=Math.round(x0+(x1-x0)*j/count),y=Math.round(y0+(y1-y0)*j/count);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;const k=(yy*width+xx)*4;data[k]=data[k+1]=data[k+2]=255;data[k+3]=255;}}}
  for(let i=0;i<16;i++){const x=i*32;stroke(x+16,12,x+16,51);stroke(x+8,23,x+24,39);stroke(x+24,23,x+8,39);if(i%2)stroke(x+6,14,x+26,14);if(i%3)stroke(x+6,50,x+26,50);if(i%4<2){stroke(x+6,30,x+12,15);stroke(x+26,30,x+20,15);}if(i%5<3){stroke(x+7,46,x+7,35);stroke(x+25,46,x+25,35);}}
  const texture=new THREE.DataTexture(data,width,height);texture.wrapS=THREE.RepeatWrapping;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;return texture;
}

export function runeMaterial(THREE,texture,field,color){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false,
  uniforms:{uRunes:{value:texture},uClock:field.clock,uHolyRadius:field.radius,uHolyActive:field.active,uColor:{value:new THREE.Color(color)}},
  vertexShader:`varying vec2 vUv;varying vec3 vWorld;void main(){vUv=uv;vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
  fragmentShader:`varying vec2 vUv;varying vec3 vWorld;uniform sampler2D uRunes;uniform float uClock,uHolyRadius,uHolyActive;uniform vec3 uColor;void main(){if(uHolyActive>.5&&length(vWorld-vec3(0.,3.9,-3.2))<uHolyRadius)discard;vec2 uv=vec2(vUv.x*2.-uClock*.09,vUv.y);float glyph=texture2D(uRunes,uv).a;float pulse=.65+.35*pow(max(0.,sin(uClock*2.1)),4.);gl_FragColor=vec4(uColor*(1.1+pulse),glyph*pulse*.85);}`});}
