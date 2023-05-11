Shader "Custom/RoundRect"
{
    Properties
    {
        [PerRendererData]
        _MainTex ("Main Texture", 2D) = "white" {}
        [PerRendererData]
        _Color ("Main Color", Color) = (1,1,1,1)
        _Radius ("Radius", Range(0,0.5)) = 0
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 200

	pass{
        CGPROGRAM
       
	   #pragma vertex vert
	   #pragma fragment frag
	   #include "unitycg.cginc"
	   
	   sampler2D _MainTex;
	   fixed _Radius;
	   fixed4 _Color;

	   struct v2f{
            float4 pos:SV_POSITION;
            float2 srcUV:TEXCOORD0;		// 原本的uv
            float2 adaptUV:TEXCOORD1;	// 用来调整方便计算的uv
	   };

	   
	   v2f vert(appdata_base v){
			v2f o;
			o.pos = UnityObjectToClipPos(v.vertex);
			o.srcUV = v.texcoord;

			// 调整uv范围从(0,1)到(-0.5,0.5)，即图片uv原点从左下角到中心点
			o.adaptUV = o.srcUV - fixed2(0.5,0.5);
			return o;
	   }

	   fixed4 frag(v2f i):COLOR
	   {
			fixed4 col = fixed4(0,0,0,0);

			// 首先绘制中间部分（在设置圆角半径里面的）(adaptUV x y 绝对值小于 0.5-圆角半径内的区域)
			if(abs(i.adaptUV).x<(0.5-_Radius) || abs(i.adaptUV).y<(0.5-_Radius))
			{
				col =tex2D(_MainTex,i.srcUV);
			}
			else
			{  
				// 其次四个圆角部分（相当于以 （0.5-圆角半径，0.5-圆角半径）为圆心，把 uv 在 圆角半径内的uv绘制出来）
				if(length(abs(i.adaptUV)-fixed2(0.5-_Radius,0.5-_Radius)) < _Radius){
					col = tex2D(_MainTex,i.srcUV);
				}
				else// 超出的部分忽略掉
				{
					discard;
				}
			}
			return col*_Color;
	   }

        ENDCG
    }
	}
    FallBack "Diffuse"
}
