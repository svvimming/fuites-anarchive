precision highp float;
#define PI 3.1415926538

uniform vec2 u_resolution;
uniform float u_time, u_level, u_throb;
uniform sampler2D u_sampler;
uniform vec2 mouse;
uniform vec3 bins;

vec2 lookup (vec2 st, vec2 offset, float amp2) {
  vec2 lu = st + amp2 * bins.z * u_throb * vec2(cos(bins.x * (st.x + offset.x) + u_time), sin(bins.y * (st.y + offset.x) + u_time));
  return lu;
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv.y = 1.0 - uv.y;
  float dist = distance(uv, mouse * 0.5);
  float amp2 = pow(1.0 - dist, 2.0);
  float colorSeparation = 0.02 * mix(amp2, 1.0, 0.5);
  vec2 orientation = vec2(1.0, 0.0);
  vec4 cull = vec4(vec3(
    texture2D(u_sampler, lookup(uv, colorSeparation * orientation, amp2)).r,
    texture2D(u_sampler, lookup(uv, -colorSeparation * orientation, amp2)).g,
    texture2D(u_sampler, lookup(uv, vec2(0.0), amp2)).b),
    1.0);

  if(0.25 < (cull.r - cull.g)){
    cull.a *= abs(sin(PI * u_level / 0.5));
  }
  if(0.25 < (cull.b - cull.r)){
    cull.a *= abs(sin(PI * u_level / 0.5 - 0.25));
  }
  if(0.25 < (cull.g - cull.b)){
    cull.a *= abs(sin(PI * u_level / 0.5 - 0.5));
  }
  cull.a *= 1.0 - pow((0.5 * sin((2.0 * uv.x * PI) + (PI / 2.0)) + 0.5), 10.0);
  cull.a *= 1.0 - pow((0.5 * sin((2.0 * uv.y * PI) + (PI / 2.0)) + 0.5), 10.0);

  gl_FragColor = cull;
}
