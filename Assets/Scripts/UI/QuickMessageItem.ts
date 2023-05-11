import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Text, Button } from 'UnityEngine.UI'
import { Barrage } from '../Data/Barrage';
import Localization from '../Common/Localization/Scripts/Localization';

export default class QuickMessageItem extends ZepetoScriptBehaviour {

    public mBtn: Button;
    public mText: Text;
    public mBarrage: Barrage;

    private ClickCallback: Function;

    Awake() {
        this.mBtn.onClick.AddListener(() => {
            this.ClickCallback?.(this.mBarrage);
        });
    }

    SetQuickMessage(barrage: Barrage) {
        this.mBarrage = barrage;
        this.mText.text = Localization.Instance.GetLocalizedText(barrage.des);
    }

    SetClickCallback(callback: Function) {
        this.ClickCallback = callback;
    }

}