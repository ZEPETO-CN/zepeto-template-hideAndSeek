import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Text, Toggle, Image } from 'UnityEngine.UI';
import { Sprite } from 'UnityEngine';

export default class TutorialBtnItem extends ZepetoScriptBehaviour {

    public nameText: Text;
    public img: Image;
    public toggleImg: Image;

    @HideInInspector()
    public index: number;

    SetItem(name: string, index: number) {
        this.nameText.text = name;
        this.index = index;
    }

    SetStatus(isOn: boolean): void {
        this.toggleImg.enabled = isOn;
        // this.img.enabled = !isOn;
    }
}