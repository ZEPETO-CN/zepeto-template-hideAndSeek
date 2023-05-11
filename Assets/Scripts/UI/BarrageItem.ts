import { Animator, AnimatorStateInfo, Sprite } from 'UnityEngine';
import { Text, Image } from 'UnityEngine.UI'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization from '../Common/Localization/Scripts/Localization';

export enum BarrageGroup {
    hunter = "hunter",
    hider = "hider",
    common = "common",
}

export default class BarrageItem extends ZepetoScriptBehaviour {

    public mText: Text;
    public mImage: Image;
    public mTeamIcon: Image;
    public mEmoji: Image;
    public mBGSprites: Sprite[];
    public mTeamSprites: Sprite[];
    private animator: Animator;
    private completedAction: Function;

    Awake() {
        this.animator = this.GetComponent<Animator>();
    }

    public PlayBarrageItem(des: string, group: string) {
        this.gameObject.SetActive(false);
        this.SetBarrageTeamType(group);
        if (group == BarrageGroup.hunter) {
            des = Localization.Instance.GetLocalizedTextWithParam("Barrage_tip_1", [des]);
        }
        else if (group == BarrageGroup.hider) {
            des = Localization.Instance.GetLocalizedTextWithParam("Barrage_tip_2", [des]);
        }
        this.mText.text = des;
        this.gameObject.SetActive(true);
    }

    public PlayBarrageEmojiItem(des: string, group: string, sprite: Sprite) {
        this.gameObject.SetActive(false);
        this.SetBarrageTeamType(group);
        if (group == BarrageGroup.hunter) {
            des = Localization.Instance.GetLocalizedTextWithParam("Barrage_tip_1", [des]);
        }
        else if (group == BarrageGroup.hider) {
            des = Localization.Instance.GetLocalizedTextWithParam("Barrage_tip_2", [des]);
        }
        this.mText.text = des;
        this.mEmoji.sprite = sprite;
        this.gameObject.SetActive(true);
    }

    private SetBarrageTeamType(group: string) {
        this.mTeamIcon.gameObject.SetActive(false);
        let bgSprite: Sprite;
        switch (group) {
            case BarrageGroup.hunter:
                bgSprite = this.mBGSprites[1];
                this.mTeamIcon.sprite = this.mTeamSprites[0];
                this.mTeamIcon.gameObject.SetActive(true);
                break;
            case BarrageGroup.hider:
                bgSprite = this.mBGSprites[2];
                this.mTeamIcon.sprite = this.mTeamSprites[1];
                this.mTeamIcon.gameObject.SetActive(true);
                break;
            case BarrageGroup.common:
                bgSprite = this.mBGSprites[0];
                break;
            default:
                bgSprite = this.mBGSprites[0];
                break;
        }
        this.mImage.sprite = bgSprite;
    }

    public SetCompletedAction(action: Function) {
        this.completedAction = action;
    }

    Update() {
        let info: AnimatorStateInfo = this.animator.GetCurrentAnimatorStateInfo(0);
        if (info.normalizedTime >= 0.95) {
            this.completedAction?.(this);
        }
    }

}