Shader "Unlit/M_Color"
{
    Properties
    {
        _UpLight("UpLightColor",Color) = (1.0,1.0,1.0,1.0)
        _DownLight("DownLightColor",Color) = (0.0,0.0,0.0,0.0)
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_fwdbase_fullshadows
            #include "UnityCG.cginc"
            #pragma target 3.0

            uniform float3  _UpLight;
            uniform float3 _DownLight;

            struct appdata
            {
                float4 vertex : POSITION;
                float3 NORMAL : NORMAL;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
                float3 nDirws: TEXCOORD1;
            };
            v2f vert (appdata v)
            {   
                v2f o;
                o.vertex = UnityObjectToClipPos( v.vertex );
                o.nDirws = UnityObjectToWorldNormal(v.NORMAL);
                return o;
            };

            fixed4 frag (v2f i) : SV_Target
            {
                float3 nDir = i.nDirws;
                float3 lDir = normalize(_WorldSpaceLightPos0.xyz);
                float nDotl = dot(nDir ,lDir);
                float halflambert = nDotl*0.5+0.5;
                float UpMask = max(0.0, halflambert);
                float DownMask = max(0.0,-halflambert);
                float3 MaskColor = _UpLight*UpMask + _DownLight*DownMask;
                return float4(MaskColor, 1.0);
            }
            ENDCG
        }
    }
}            
