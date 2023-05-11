Shader "Wit/Standard(NoColor)_UVScrollRotationScale"  {
	Properties {

		
		
		_MainTex ("Albedo (RGB)", 2D) = "white" {}
		_Glossiness ("Smoothness", Range(0,1)) = 0.5
		_Shininess ("Shininess", Range (0.03, 1)) = 0.078125
		_BumpMap ("Normal map", 2D) = "bump" {}

 		_ScrollX("ScrollX", Range(-100, 100)) = 0
        _ScrollY("ScrollY", Range(-100, 100)) = 0
        _Angle("Angle", Range(-1, 1)) = 0
        _AngleSpeed("AngleSpeed", Float ) = 1
        _Scale("Scale", Float ) = 1


		[HideInInspector]_LogLut ("_LogLut", 2D)  = "white" {}	
	}
	SubShader {
		Tags { "RenderType"="Opaque" }
		LOD 200

		CGPROGRAM
		// Physically based Standard lighting model, and enable shadows on all light types
		#pragma surface surf StandardSpecular  finalcolor:tonemapping
		#include "ToneMapping.cginc"

		// Use shader model 3.0 target, to get nicer looking lighting
		#pragma target 3.0

		sampler2D _MainTex;
		sampler2D _BumpMap;
		sampler2D _SpecularTex;
		struct Input {
			float2 uv_MainTex;
			float2 uv_BumpMap;
			float2 uv_SpecularTex;
		};

		half _Glossiness;	
		half _Shininess;
		
		half _ScrollX;
		half _ScrollY;
		half _Angle;
		half _AngleSpeed;
		half _Scale;

		void surf (Input IN, inout SurfaceOutputStandardSpecular o) {
			float t = _Time.r;
			float2 pivot = float2(0.5,0.5);
			float r = (_Angle * 6.28) * (_AngleSpeed * t);
			float _cos = cos(r);
			float _sin = sin(r);
			float2 _uv = (mul(((_Scale*(((IN.uv_MainTex+(_ScrollX*t)*float2(1,0))+(_ScrollY*t)*float2(0,1))*1.0+-0.5))+pivot)-pivot,float2x2(_cos,-_sin,_sin,_cos))+pivot);

			// Albedo comes from a texture tinted by color
			fixed4 c = tex2D (_MainTex, _uv);
			o.Albedo = c.rgb;			
			o.Smoothness = _Glossiness;			
			o.Normal = UnpackNormal(tex2D(_BumpMap, IN.uv_BumpMap));
        	o.Specular = _Shininess;
			o.Alpha = c.a;

		}

		void tonemapping (Input IN, SurfaceOutputStandardSpecular o, inout fixed4 color) {
        	color = ApplyColorGrading(color);			
    	}		
		ENDCG
	}
	FallBack "Diffuse"
}
