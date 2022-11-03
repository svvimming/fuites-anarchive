precision highp float;
#define PI 3.1415926538

varying highp vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_pulse;
uniform float u_level;

vec2 lookup (vec2 st, vec2 offset, float amp2) {
  vec3 bins = vec3(0.0, 0.0, 0.1);
  return st + amp2 * 0.1 * u_pulse * vec2(cos(u_time), sin(u_time));
}
void main() {
  vec2 uv = vTextureCoord;
  uv.x = 1.0 - uv.x;
  float dist = distance(uv, u_mouse * 0.5);
  float amp2 = pow(1.0 - dist, 2.0);
  float colorSeparation = 0.02 * mix(amp2, 1.0, 0.5);
  vec2 orientation = vec2(1.0, 0.0);
  vec4 cull = vec4(
    vec3(
      texture2D(uSampler, lookup(uv, colorSeparation * orientation, amp2)).r,
      texture2D(uSampler, lookup(uv, -colorSeparation * orientation, amp2)).g,
      texture2D(uSampler, lookup(uv, vec2(0.0), amp2)).b
    ),
    1.0
  );

  if(0.25<(cull.r-cull.g)){
    cull.a *= abs(sin(PI * u_level / 0.5));
  }
  if(0.25<(cull.b-cull.r)){
    cull.a *= abs(sin(PI * u_level / 0.5 - 0.25));
  }
  if(0.25<(cull.g-cull.b)){
    cull.a *= abs(sin(PI * u_level / 0.5 - 0.5));
  }
  cull.a *= 1.0 - pow((0.5*sin((2.0*uv.x*PI)+(PI/2.0))+0.5), 10.0);
  cull.a *= 1.0 - pow((0.5*sin((2.0*uv.y*PI)+(PI/2.0))+0.5), 10.0);

  gl_FragColor = cull;
}
