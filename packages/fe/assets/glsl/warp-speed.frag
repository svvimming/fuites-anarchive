precision mediump float;
#define PI 3.1415926538

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_scroll;

float vDrop (vec2 uv,float t) {
  uv.x = uv.x * 128.0; // H-Count
  float dx = fract(uv.x);
  uv.x = floor(uv.x);
  uv.y *= 0.04; // stretch
  float o = sin(uv.x * 215.4); // offset
  float s = cos(uv.x * 33.1) * 0.3 + 0.7; // speed
  float trail = mix(95.0, 20.0, s); // trail length
  float yv = fract(uv.y + t * s + o) * trail;
  yv = 1.0 / yv;
  // smooth edges of meteors
  yv = smoothstep(0.0, 1.0, yv * yv);
  yv = sin(yv * PI) * (s * 5.0);
  float d2 = sin(dx * PI);
  return yv * (d2 * d2);
}

void main(void) {
  // warp speed
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  float d = length(p) + 0.1;
  p = vec2(atan(p.x, p.y) / PI, 2.5 / d);
  float t = u_scroll * 0.1;
  vec3 col = vec3(0.89, 0.8275, 0.7529) * vDrop(p,t); // draw meteors
  col = col * (d * d);
  // make black background transparent
  float a = length(col / d);

  gl_FragColor = vec4(col, a * a);
}
