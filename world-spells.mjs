// Shared radial field: every surface is removed only after the visible wave reaches it.
export function holySkin(material,field){
  material.onBeforeCompile=s=>{s.uniforms.uHolyRadius=field.radius;s.uniforms.uHolyActive=field.active;
    s.vertexShader='varying vec3 vHolyWorld;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
      vec4 holyPosition=vec4(transformed,1.);
      #ifdef USE_INSTANCING
      holyPosition=instanceMatrix*holyPosition;
      #endif
      vHolyWorld=(modelMatrix*holyPosition).xyz;`);
    s.fragmentShader='varying vec3 vHolyWorld;uniform float uHolyRadius,uHolyActive;\n'+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
      float holyDistance=length(vHolyWorld-vec3(0.,3.9,-3.2));
      float holyGrain=fract(sin(dot(floor(vHolyWorld*12.),vec3(12.9898,78.233,37.719)))*43758.5453);
      if(uHolyActive>.5&&holyDistance+holyGrain*.24<uHolyRadius)discard;`);
    s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      totalEmissiveRadiance+=vec3(3.,1.9,.6)*exp(-abs(holyDistance-uHolyRadius)*9.)*uHolyActive*step(.01,uHolyRadius);
`);
  };material.customProgramCacheKey=()=> 'radial-holy-skin-v3';return material;
}
