using UnityEngine;
using System.Collections.Generic;
using UnityEditor;
 
public class CheckingScript : Editor
{
    
    [MenuItem("ZEPETO/Script/DoCheckFormat")]
    public static void DoCheckFormat()
    {
        List<GameObject> sceneRoot = new List<GameObject>();
        
        UnityEngine.SceneManagement.SceneManager.GetActiveScene().GetRootGameObjects(sceneRoot);
        
        Debug.Log("Root Object = " + sceneRoot.Count);
        for (int i = 0; i < sceneRoot.Count; i++)
        {
            Transform[] objs = sceneRoot[i].GetComponentsInChildren<Transform>();

            for (int j = 0; j < objs.Length; j++)
            {   
                GameObject go = objs[j].gameObject;
                FormatTransform(go.transform);
                
                int number = GameObjectUtility.RemoveMonoBehavioursWithMissingScript(go);
                if (number > 0)
                {
                    Debug.LogError("Missing Script = " + go.name);
                }
            }
        }
        
        Debug.Log("Format Finish!");
    }

    private static void FormatTransform(Transform t)
    {
        var pos = t.localPosition;
        //var rot = t.localEulerAngles;
        //var scale = t.localScale;

        pos = new Vector3(((int)(pos.x * 1000)) * 0.001f, ((int)(pos.y * 1000)) * 0.001f, ((int)(pos.z * 1000)) * 0.001f);
        //rot = new Vector3(((int)(rot.x * 1000)) * 0.001f, ((int)(rot.y * 1000)) * 0.001f, ((int)(rot.z * 1000)) * 0.001f);
        //scale = new Vector3((int)(scale.x * 1000) * 0.001f, (int)(scale.y * 1000) * 0.001f, (int)(scale.z * 1000) * 0.001f);

        t.localPosition = pos;
        //t.localEulerAngles = rot;
        //t.localScale = scale;
    }
 
}