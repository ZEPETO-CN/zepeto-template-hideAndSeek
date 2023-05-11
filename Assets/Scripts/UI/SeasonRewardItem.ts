import { GameObject, Sprite } from 'UnityEngine';
import { Button, Image, Text } from 'UnityEngine.UI'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { SeasonReward } from '../GameManager/ConfigManager';

export default class SeasonRewardItem extends ZepetoScriptBehaviour {
    public mAmountText: Text;
    public mScoreText: Text;
    public mBtn: Button;
    public mIcon: Image;
    public mGrayPoint: Image;
    public mRedPoint: Image;
    public mGetObj: GameObject;
    public mComplete: GameObject;
    public mSprites: Sprite[];
    public seasonReward: SeasonReward;
    public status: number = 0;

    public InitComponent(seasonReward: SeasonReward, clickCallback: Function) {
        this.seasonReward = seasonReward;
        this.mAmountText.text = seasonReward.amount + "";
        this.mScoreText.text = seasonReward.score + "";
        this.mIcon.sprite = this.mSprites[seasonReward.id - 1];
        this.mBtn.onClick.AddListener(() => {
            clickCallback?.(seasonReward.id);
        });
    }

    //0:未完成 1:已完成 2:已领取
    public SetStatus(myScore: number, status: number) {
        this.mRedPoint.gameObject.SetActive(myScore >= this.seasonReward.score);
        this.mGrayPoint.gameObject.SetActive(!this.mRedPoint.gameObject.activeSelf);
        this.status = status;
        this.mGetObj.SetActive(false);
        this.mComplete.SetActive(false);
        this.mBtn.enabled = false;
        switch (status) {
            case 0:
                break;
            case 1:
                this.mBtn.enabled = true;
                this.mGetObj.SetActive(true);
                break;
            case 2:
                this.mComplete.SetActive(true);
                break;
            default:
                break;
        }
    }

}