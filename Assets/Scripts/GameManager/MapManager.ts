import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import BaseManager from './BaseManager'
import {GameObject, WaitForSeconds, Time, Vector3} from "UnityEngine";
import {GameState } from "./NetManager"
import { sDynamicMap } from 'ZEPETO.Multiplay.Schema';

export default class MapManager extends BaseManager {


    private static _instance: MapManager;
    public static get Instance(): MapManager {
       
        return MapManager._instance;
    }
    
    public mAudioCtrl : GameObject;

    public mDynamicModels : GameObject[];
    
    Awake(){
        MapManager._instance = this;
        this.mStartPos = this.mReadyWall.transform.position ;
        this.mReadyWall.transform.position = this.mEndPos;
    }
    
    /* Collider */
    public mReadyWall : GameObject;
    private mStartPos : Vector3;
    public mEndPos : Vector3;
    
    private mIsOpenDoor : boolean = true;

    
    OnDisable(){
        if(this.mIsOpenDoor){
            this.mReadyWall.transform.position = this.mEndPos;
        }
    }
    
    // 心跳同步校验
    UpdateCheck(){
        if(this.mIsOpenDoor){
            if(this.mGameState == GameState.GameStart){
                this.OnCloseDoor();
            }
        }
        
        if(this.mGameState == GameState.OpenDoor && !this.mIsOpenDoor){
            this.OnOpenDoor();
        }
    }
    
    OnOpenDoor(){
        console.error("OnOpenDoor");
        this.mIsOpenDoor = true;
        this.StartCoroutine(this.IE_DestoryWall());
    }
    
    OnCloseDoor(){
        console.error("OnCloseDoor");
        this.mIsOpenDoor = false;
        this.mReadyWall.transform.position = this.mStartPos;
    }
    *IE_DestoryWall(){
        let timer = 0;
        let animTime = 1;
        while (timer < animTime){
            timer += Time.deltaTime;
            this.mReadyWall.transform.position = Vector3.Lerp(
                this.mStartPos, this.mEndPos, timer
            );
            yield null;
        }
        this.mReadyWall.transform.position = this.mEndPos;
    }

    OnDynamicMapChange(dynamicMaps : sDynamicMap){

        if(dynamicMaps == null || dynamicMaps.models == null) return ;

        for(var i = 0; i < this.mDynamicModels.length; i++){
            this.mDynamicModels[i].SetActive(false);
        }
        console.log(dynamicMaps.models);
        let models = dynamicMaps.models.split(',');
        for(var i = 0; i < models.length; i++){
            let index = parseInt(models[i]);

            if(index < this.mDynamicModels.length){
                this.mDynamicModels[index].SetActive(true);
            }
        }
    }

}