using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEngine;
using System;


public class BoxColliderTool : MonoBehaviour
{

    [Serializable]
    public class ColliderConfig
    {
        public string name;
        public double centerY;
        public double radius;
        public double height;
    }
    [Serializable]
    public class Tool {
        public List<ColliderConfig> collider = new List<ColliderConfig>();
    }
    [MenuItem("Tool/Collider JSON")]
    private static void CreateJSON()
    {
        GameObject[] gameObject = Selection.gameObjects;
        Tool t = new Tool();
        for (int i = 0; i < gameObject.Length; i++)
        {
            t.collider.Add(AutoBoxCollider(gameObject[i]));
        }
        var filePath = Application.dataPath + "/Configs/ColliderConfig.json";
        string json = JsonUtility.ToJson(t);
        json = json.Remove(0, 12);
        json = json.Substring(0, json.Length - 1);
        Debug.Log(json);
        if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
        System.IO.File.WriteAllText(filePath, json);
    }

    private static ColliderConfig AutoBoxCollider(GameObject gameObject)
    {
        Vector3 center = Vector3.zero;
        var renders = gameObject.GetComponentsInChildren<Renderer>();
        for (int i = 0; i < renders.Length; i++)
        {
            center += renders[i].bounds.center;
        }
        center /= renders.Length;
        Bounds bounds = new Bounds(center, Vector3.zero);
        foreach (var render in renders)
        {
            bounds.Encapsulate(render.bounds);
        }
        var value = bounds.size;
        var firstCompare = value.x > value.y ? value.x : value.y;
        var lastCompare = firstCompare > value.z ? firstCompare : value.z;
        ColliderConfig config = new ColliderConfig();
        config.name = gameObject.name;
        config.centerY = (double)Math.Round(lastCompare / 2f, 2);
        config.radius = (double)Math.Round(lastCompare / 2, 2);
        config.height = (double)Math.Round(value.y  / 2f, 2);

        return config;
    }



}
