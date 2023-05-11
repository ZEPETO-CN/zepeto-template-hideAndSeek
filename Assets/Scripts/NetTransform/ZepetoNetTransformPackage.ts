import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Mathf, Vector3 } from 'UnityEngine';

export class sNetTransform{
    public x : number;
    public y : number;
    public z : number;
    public a : number; // angleY
    public s : number; // state
    
    public SetPosition(pos : Vector3){
        this.x = Math.round(pos.x * 100);
        this.y = Math.round(pos.y * 100);
        this.z = Math.round(pos.z * 100);
    }
}

const  CacheNum : number = 2;
export class ZepetoNetTransformPackage {

    public mIndex : number;
    public mDatas : Queue<sNetTransform> = new Queue<sNetTransform>();
    private mNum : number = 0;
    
    public IsEmpty() : boolean{
        if(this.mDatas == null) return true;
        
        else if(this.mDatas.Size() == 0) return true;
        else return false;
    }
    
    public IsCacheData() : boolean{
        return (this.mDatas.Size() - this.mNum) <= CacheNum; 
    }
    
    public GetNextPosData() : sNetTransform {
        
        if(this.mDatas.Size() == 0) return null;
        else {
            this.mNum ++;
            return this.mDatas.Dequeue();
        }
    }


    public ParseJson( dataJson : string){
        let result = JSON.parse(dataJson);
        this.mNum = 0;
        this.mIndex = result.index;
        this.mDatas.Clear();
        this.mDatas.items = this.obj2Map(JSON.parse(result.data));
    }

    obj2Map(obj) {
        let strMap = new Map<number, sNetTransform>();
        for (let k of Object.keys(obj)) {
            strMap.set(Number(k), obj[k]);
        }
        return strMap;
    }
}

// 封装消息队列

export default class Queue<T> {
    private count: number;
    private lowestCount: number;
    public items: Map<number, T>;

    constructor() {
        this.count = 0;
        this.lowestCount = 0;
        this.items = new Map();
    }

    /**
     * @description: 在count方向（队列底部）入队
     * @param {T} element
     */
    Enqueue(element: T): void {
        this.items.set(this.count, element);
        this.count++;
    }

    /**
     * @description: 在lowestCount方向（队列顶部）出队
     * @return {T} element
     */
    Dequeue(): T {
        if (this.IsEmpty()) {
            console.warn("IsEmpty!!!");
            return undefined;
        }
        const result: T = this.items.get(this.lowestCount);
        this.items.delete(this.lowestCount);
        this.lowestCount++;
        return result;
    }

    /**
     * @description: 返回队列顶部的元素
     * @return {T} element
     */
    Peek(): T {
        if (this.IsEmpty()) {
            return undefined;
        }
        return this.items.get(this.lowestCount);
    }

    /**
     * @description: 返回队列是否为空
     * @return {Boolean}
     */
    IsEmpty(): boolean {
        return this.items.size === 0;
    }

    /**
     * @description: 清空队列
     */
    Clear(): void {
        this.items = new Map();
        this.count = 0;
        this.lowestCount = 0;
    }

    /**
     * @description: 返回队列元素的数目
     * @return {Number}
     */
    Size(): number {
        return this.items.size;
    }

    /**
     * @description: 覆盖Object默认的toString
     * @return {String}
     */
    toString(): string {
        if (this.IsEmpty()) {
            return '';
        }
        let objString: string = `${this.items.get(this.lowestCount)}`;
        for (let i = this.lowestCount + 1; i < this.count; i++) {
            objString = `${objString},${this.items.get(i)}`;
        }
        return objString;
    }

    toJson(id : number, index : number) : string{
        if(this.IsEmpty()){
            return "";
        }
        const target = {0: this.items.get(this.lowestCount)};
        for (let i = this.lowestCount + 1; i < this.count; i++) {
            target[i as keyof typeof target] = this.items.get(i);
        }
        let dataJson = JSON.stringify(target);

        const result = {"id" : id, "index"  : index, "data" : dataJson};

        return JSON.stringify(result);

    }
}
