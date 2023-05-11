import { GameObject, Sprite, ParticleSystemRenderer, Texture2D } from 'UnityEngine';
import { Text, Button, Image } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import Localization from '../Common/Localization/Scripts/Localization';
import AudioController from '../GameController/AudioController';
import { RewardType } from '../GameManager/ConfigManager';
export default class UIRewardPanel extends ZepetoScriptBehaviour {

    public sprites: Sprite[];
    public mTipText: Text;
    public mOKBtn: Button;
    public mRewardIcon: Image;


    Awake() {

        this.mOKBtn.onClick.AddListener(() => {
            this.gameObject.SetActive(false);
        });
    }

    ShowReward(tip: string, rewardType: RewardType) {
        AudioController.Instance.PlayGetReward();
        this.mTipText.text = tip;
        switch (rewardType) {
            case RewardType.COIN:
                this.mRewardIcon.sprite = this.sprites[0];
                break;
            case RewardType.ZEM:
                this.mRewardIcon.sprite = this.sprites[1];
                break;
            default:
                break;
        }
    }

}