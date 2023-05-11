import { Sprite } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Image, Button } from 'UnityEngine.UI';

export default class EmojiItem extends ZepetoScriptBehaviour {

    public mBtn: Button;
    public mImage: Image;
    public id: number;

    private ClickCallback: Function;

    Awake() {
        this.mBtn.onClick.AddListener(() => {
            this.ClickCallback?.(this.id);
        });
    }

    SetEmoji(id: number, sprite: Sprite) {
        this.id = id;
        this.mImage.sprite = sprite;
    }

    SetClickCallback(callback: Function) {
        this.ClickCallback = callback;
    }

}