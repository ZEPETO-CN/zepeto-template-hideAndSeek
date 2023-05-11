import { GameObject, Sprite } from 'UnityEngine';
import { Text, Image } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { RewardType } from '../GameManager/ConfigManager';

export default class StarRewardItem extends ZepetoScriptBehaviour {

    public icon: Image;
    public amountText: Text;
    public select: GameObject;

    public sprites: Sprite[];

    public SetItem(amount: number, rewardType: RewardType) {
        this.amountText.text = amount + "";
        switch (rewardType) {
            case RewardType.ZEM:
                this.icon.sprite = this.sprites[0];
                break;
            case RewardType.COIN:
                this.icon.sprite = this.sprites[1];
                break;
            default:
                break;
        }
    }

    public SetSelect(selected: boolean) {
        this.select.SetActive(selected);
    }

}