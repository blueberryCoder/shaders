#version 300 es
precision mediump float;

uniform vec2  u_resolution;

uniform sampler2D u_texture_0;


uniform float u_saturation;
uniform float u_hue;
uniform float u_bright;

out vec4 fragColor;

// RGB [0,1] → HLS([0,1],[0,1],[0,1])  —— 返回 vec3(H, L, S)
// 思路：沿用无分支 rgb2hsv 的比较结构，只把 L 与 S 的定义改成 HLS 的：
vec3 rgb2hls(vec3 c)
{
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);

    // 先在 g/b 之间选出大/小，并携带色相扇区常数
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    // 再把 r 与上一步的最大值比较，得到 Cmax/Cmin 以及 hue 分子所需的两项
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float Cmax = q.x;
    float Cmin = min(q.w, q.y);
    float d    = Cmax - Cmin;           // Δ (chroma)
    float L    = 0.5 * (Cmax + Cmin);   // HLS 的 Lightness
    float e    = 1.0e-10;

    // Hue 与 HSV 相同（范围 [0,1)）
    float H = abs(q.z + (q.w - q.y) / (6.0 * d + e));
    // HLS 的 Saturation 定义
    float S = d / (1.0 - abs(2.0 * L - 1.0) + e);

    return vec3(H, L, S);
}


// HLS([0,1],[0,1],[0,1]) → RGB [0,1]  —— 传入 vec3(H, L, S)
vec3 hls2rgb(vec3 hls)
{
    float H = hls.x;
    float L = hls.y;
    float S = hls.z;

    // HLS 的“彩度” C = (1 - |2L-1|) * S
    float C = (1.0 - abs(2.0 * L - 1.0)) * S;

    // 三角波权重（与 hsv2rgb 的结构类似，但这里用 C 和 L 来组合）
    vec3 t = clamp(abs(mod(H * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);

    // 把纯色权重从 [-0.5,+0.5] 线性映射并绕 L 做对称伸缩
    // 等价于：L + C*(t - 0.5)
    return L + C * (t - 0.5);
}


void main() {
    vec2 st = gl_FragCoord.xy / u_resolution;
    vec3 rgb = texture(u_texture_0, st).rgb;   // WebGL2 用 texture()

    vec3 hls = rgb2hls(rgb);
    float hue = u_hue * 10.0;
    float saturation = u_saturation * 10.0;
    float bright = u_bright * 10.0;

    hls.x = hls.x * hue ;
    hls.y = hls.y * bright;
    hls.z = hls.z * saturation ;
    rgb = hls2rgb(hls);
    fragColor = vec4(rgb, 1.0);                // 自定义输出
}
