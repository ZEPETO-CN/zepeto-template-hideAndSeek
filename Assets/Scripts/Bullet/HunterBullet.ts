import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import * as UnityEngine from "UnityEngine";
import PoolManager from "../GameManager/PoolManager"
import {UnityEvent$1} from "UnityEngine.Events";

export default class HunterBullet extends ZepetoScriptBehaviour {

    public mBulletPS : UnityEngine.ParticleSystem;
    public mExplosionPS : UnityEngine.ParticleSystem;
    public mSpeed : number;
    public mDuration : number;
    public mExplosionDuration : number;
    public mBulletCollider : UnityEngine.BoxCollider;
    public mExplosionTirgger : UnityEngine.BoxCollider;
    
    public mMoveDir : UnityEngine.Vector3;
    private mIsFlying : boolean;
    private mTimer : number = 0;
    private mIsLocal : boolean;
    private mOwnerId : number;
    public mExplosionEvent : UnityEvent$1<UnityEngine.GameObject>;
    
    private readonly HitTag : string = "Player";
    
    private OnEnable(){
        this.mIsFlying = true;
        this.mTimer = 0;
        this.mIsLocal = false;
        this.mBulletPS.gameObject.SetActive(true);
        this.mExplosionPS.gameObject.SetActive(false);
        this.mBulletCollider.enabled = true;
        this.mExplosionTirgger.enabled = false;
        this.mBulletPS.Play();
    }
    
    private OnDisable(){
        this.transform.rotation = UnityEngine.Quaternion.identity;
        if(this.mIsLocal){
            this.mExplosionEvent.RemoveAllListeners();
        }
    }

    SetIsLocal(v : boolean, id : number, moveDir : UnityEngine.Vector3){
        this.mIsLocal = v;
        this.mOwnerId = id;
        this.mMoveDir = moveDir;
    }
    
    Update(){
        if(this.mIsFlying){
            this.transform.position += this.mMoveDir * this.mSpeed * UnityEngine.Time.deltaTime;
        }
        this.mTimer += UnityEngine.Time.deltaTime;
        if(this.mTimer > this.mDuration){
            PoolManager.Instance.UnSpawn(this.gameObject);
        }
    }

    OnCollisionEnter(coll: UnityEngine.Collision) {
        if(this.mIsFlying){
            this.mBulletCollider.enabled = false;
            this.mExplosionTirgger.enabled = true;
            this.mIsFlying = false;
            this.mBulletPS.gameObject.SetActive(false);
            this.mExplosionPS.gameObject.SetActive(true);
            this.mExplosionPS.Play();
            this.mTimer = this.mDuration - this.mExplosionDuration;
        }
    }

    OnTriggerEnter(coll: UnityEngine.Collider) {
        // todo
        if(this.mIsLocal){
            let obj = coll.gameObject;
            if(obj.tag == this.HitTag){
                console.log(`OnTriggerEnter ${coll.gameObject.name}.`);
                this.mExplosionEvent.Invoke(obj);
            }
        }
        
    }

}