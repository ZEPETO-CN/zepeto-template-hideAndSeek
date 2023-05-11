import { Transform, Vector3} from 'UnityEngine'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class MapBorderCheck extends ZepetoScriptBehaviour {

    // 设置几个球形区域来检测
    // 1. 根据位置判断在那个区域
    // 2. 根据区域判断是否可以移动

    public mBorders : Transform[];

    private readonly mMinY : number = -2;
    private readonly mMaxY : number = 1.5;
    private mCount : number;
    private mBoxPosList : Vector3[] = [Vector3.one, Vector3.one, Vector3.one, Vector3.one] ;
    private mMaxDisList : number[] = [0, 0, 0, 0];

    Start(){
        this.mCount = this.mBorders.length;

        for(var i = 0; i < this.mCount; i++){
            let t = this.mBorders[i];
            this.mBoxPosList[i] = t.position;
            let dis = t.localScale.x  > t.localScale.z ? t.localScale.x : t.localScale.z;
            this.mMaxDisList[i] = dis * 0.5;
        }
    }

    public CheckIsOK(pos : Vector3) : bool{

        if(pos.y < this.mMinY || pos.y > this.mMaxY) return false;

        for(var i = 0; i < this.mCount; i++){
            if(Vector3.Distance(pos, this.mBoxPosList[i]) <= this.mMaxDisList[i]){
                let left = this.mBoxPosList[i]. x - this.mBorders[i].localScale.x * 0.5;
                let right = this.mBoxPosList[i]. x + this.mBorders[i].localScale.x * 0.5;
                let forward = this.mBoxPosList[i]. z + this.mBorders[i].localScale.z * 0.5;
                let back = this.mBoxPosList[i]. z - this.mBorders[i].localScale.z * 0.5;

                let result = true;
                
                if(pos.x < left || pos.x > right) result = false;
                if(pos.z > forward || pos.z < back) result = false;

                //console.error("mapcheck : ", i, result, pos);
                return result;
            }
        }
        return false;
    }

}