using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEditor;
using UnityEditor.SceneManagement;

public class TlexRunTool
{
    //F5运行暂停游戏
    /*
	 # 表示shift
	 & alt
	 % Ctrl
	 如：#&C 表示shift+alt+c
			 */

    [MenuItem("ZZSH/[run] _&R", false, 1)]
    static void RunApp()
    {
        if (EditorApplication.isPlaying)
        {
            EditorApplication.isPlaying = false;
            return;
        }
        string startSceneName = Application.dataPath + "/Scenes/Peekaboo.unity";
        Debug.Log(startSceneName);
        Scene scene = SceneManager.GetActiveScene();
        if (scene.name.Equals(startSceneName))
        {
            if (!EditorApplication.isPlaying)
            {
                EditorApplication.isPlaying = true;
            }
            else
            {
                EditorApplication.isPlaying = false;
            }
            return;
        }
        EditorSceneManager.OpenScene(startSceneName);
        if (!EditorApplication.isPlaying)
        {
            EditorApplication.isPlaying = true;
        }
        else
        {
            EditorApplication.isPlaying = false;
        }
    }
    // [MenuItem("ZZSH/[open_constomWorld] _&E", false, 2)]
    // static void OpenScene()
    // {
    //     string startSceneName = Application.dataPath + "/Resources/Scenes/Armani_Env.unity";
    //     Debug.Log(startSceneName);
    //     Scene scene = SceneManager.GetActiveScene();
    //     if (scene.name.Equals(startSceneName))
    //     {
    //         return;
    //     }
    //     EditorSceneManager.OpenScene(startSceneName);
    // }

    // [MenuItem("ZZSH/[open_ZZWorld] _&F", false, 2)]
    // static void OpenScenezaizai()
    // {
    //     string startSceneName = Application.dataPath + "/Scenes/zaizaiWorld.unity";
    //     Debug.Log(startSceneName);
    //     Scene scene = SceneManager.GetActiveScene();
    //     if (scene.name.Equals(startSceneName))
    //     {
    //         return;
    //     }
    //     EditorSceneManager.OpenScene(startSceneName);
    // }
}
