import { Sprite } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class ModelImageConverter extends ZepetoScriptBehaviour {
    public modelList: Sprite[] = [];
    public isHide : boolean[] ;  // 临时使用
}