using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;

public class ImageFontMaker
{

    [MenuItem("ZZSH/CreateImageFont")]
    static void CreateImageFont()
    {

        if (Selection.objects == null) { return; }

        for (int i = 0; i < Selection.objects.Length; i++)
        {
            if (Selection.objects[i].GetType() == typeof(Texture2D))
            {

                CreateImageFont(Selection.objects[i] as Texture2D);
            }
        }

    }

    public static void CreateImageFont(Texture2D texture)
    {

        if (texture == null) return;
        string texturePath = AssetDatabase.GetAssetPath(texture);
        string textureExtension = Path.GetExtension(texturePath);
        string filePath = texturePath.Remove(texturePath.Length - textureExtension.Length);

        string matPath = filePath + ".mat";
        string fontPath = filePath + ".fontsettings";

        Font myFont = AssetDatabase.LoadAssetAtPath<Font>(fontPath);
        if (myFont == null)
        {
            myFont = new Font();
            // 设置材质 
            Material mat = new Material(Shader.Find("GUI/Text Shader"));
            mat.SetTexture("_MainTex", texture);
            AssetDatabase.CreateAsset(mat, matPath);
            myFont.material = mat;
            AssetDatabase.CreateAsset(myFont, fontPath);
        }


        // 设置字符信息
        Sprite[] sprites = LoadSpritesByPath(texturePath);
        if (sprites.Length == 0) return;
        CharacterInfo[] characterInfos = new CharacterInfo[sprites.Length];
        for (int i = 0; i < characterInfos.Length; i++)
        {
            characterInfos[i] = new CharacterInfo();
            // 设置 ascii 码 
            characterInfos[i].index = sprites[i].name[sprites[i].name.Length - 1];

            // 设置 字符 uv 
            Rect rect = sprites[i].rect;

            characterInfos[i].uvBottomLeft = new Vector2(rect.x / texture.width, rect.y / texture.height);
            characterInfos[i].uvBottomRight = new Vector2((rect.x + rect.width) / texture.width, rect.y / texture.height);
            characterInfos[i].uvTopRight = new Vector2((rect.x + rect.width) / texture.width, (rect.y + rect.height) / texture.height);
            characterInfos[i].uvTopLeft = new Vector2(rect.x / texture.width, (rect.y + rect.height) / texture.height);

            // 字符的偏移 和 宽高 
            characterInfos[i].minX = 0;
            characterInfos[i].maxX = (int)rect.width;
            characterInfos[i].minY = 0 - (int)sprites[i].pivot.y;
            characterInfos[i].maxY = (int)rect.height - (int)sprites[i].pivot.y;

            characterInfos[i].advance = (int)rect.width;

        }

        myFont.characterInfo = characterInfos;

        EditorUtility.SetDirty(myFont);
        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();


    }

    public static Sprite[] LoadSpritesByPath(string path)
    {
        List<Sprite> sprites = new List<Sprite>();

        Object[] objects = AssetDatabase.LoadAllAssetsAtPath(path);
        foreach (var item in objects)
        {
            if (item.GetType() == typeof(Sprite))
            {
                sprites.Add(item as Sprite);
            }
        }

        return sprites.ToArray();
    }

}