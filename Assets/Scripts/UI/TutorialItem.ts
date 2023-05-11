import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Image } from 'UnityEngine.UI';
import { Sprite } from 'UnityEngine';
//import UIUtils from '../Common/UIUtils';

export default class TutorialItem extends ZepetoScriptBehaviour {

    public img: Image;

    public setImg(sprite: Sprite): void {
        this.img.sprite = sprite;
    }

}