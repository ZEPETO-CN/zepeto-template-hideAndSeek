import { GameObject, Quaternion, Vector3 } from 'UnityEngine'
import { Justify } from 'UnityEngine.UIElements';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class PoolManager extends ZepetoScriptBehaviour {

    private _pool: Map<string, GameObject[]> = new Map<string, GameObject[]>();

    private static _instance: PoolManager;
    public static get Instance(): PoolManager {
        return PoolManager._instance;
    }

    prefabs: GameObject[] = [];

    Awake() {
        PoolManager._instance = this;
    }

    /**
     * 从对象池获取对象
     * @param prefabName
     * @returns
     */
    Spawn(prefabName: string): GameObject {
        let result: GameObject;
        if (!this._pool.has(prefabName)) {
            this._pool.set(prefabName, []);
        }
        let isGetObject: boolean = false;
        for (let i = 0; i < this._pool.get(prefabName).length; i++) {
            let item = this._pool.get(prefabName)[i];
            if (item.activeSelf === false) {
                result = item;
                isGetObject = true;
                break;
            }
        }
        //对象池中没有的话，创建一个出来
        if (!isGetObject) {
            let prefab: GameObject;
            for (let i = 0; i < this.prefabs.length; i++) {
                if (this.prefabs[i].name === prefabName) {
                    prefab = this.prefabs[i];
                }
            }
            result = GameObject.Instantiate<GameObject>(prefab);
            result.name = prefabName;
           
            this._pool.get(prefabName).push(result);
        }
        result.SetActive(true);
        return result;
    }


    UnSpawn(obj : GameObject){
        if(this._pool.has(obj.name)){
            obj.transform.SetParent(this.transform);
            obj.SetActive(false);
            this._pool.get(obj.name).push(obj);
        }
    }

    CreatePrefab(prefabName : string) : GameObject{
        let prefab: GameObject = null;
        for (let i = 0; i < this.prefabs.length; i++) {
            if (this.prefabs[i].name === prefabName) {
                prefab = this.prefabs[i];
            }
        }
        if(prefab == null){
            console.error("prefab is null");
            return null;
        }
        return GameObject.Instantiate<GameObject>(prefab);
    }
    
}
