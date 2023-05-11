import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldHelper, Users } from 'ZEPETO.World'
import { sRoundResult } from "ZEPETO.Multiplay.Schema";
import { GameObject, Texture, Texture2D, Rect, Vector2, WaitForSeconds, Sprite } from "UnityEngine";
import { Image, Text, Button } from "UnityEngine.UI";
import Localization from '../Common/Localization/Scripts/Localization';
import AudioController from '../GameController/AudioController';
import ScreenshotManager from '../../CommonModules/Screenshot/Scripts/ScreenshotManager';
import UIManager from '../GameManager/UIManager';

export default class UIRoundResultPanel extends ZepetoScriptBehaviour {

    public mProfileImg: Image;
    public mName: Text;
    public mScore: Text;
    public mCoundDownTimer: Text;

    public mTitle: Text;
    public mContent: Text;
    public mMyScore: Text;
    public feedBtn: Button;

    private mRoundResult: sRoundResult;

    Awake() {
        this.feedBtn.onClick.AddListener(() => {
            this.feedBtn.interactable = false;
            ScreenshotManager.Instance.CreateFeedImmediately((result) => {
                if (result) {
                    UIManager.Instance.TOAST.ShowFeedSuccess();
                }
                else {
                    UIManager.Instance.TOAST.ShowFeedFail();
                }
            });
        });
    }

    Show(roundResult: sRoundResult, myRoundScore: number) {
        this.feedBtn.interactable = true;
        AudioController.Instance.PlayRoundOver();
        this.gameObject.SetActive(true);
        this.mRoundResult = roundResult;
        this.mMyScore.text = Localization.Instance.GetLocalizedTextWithParam("Ending_tips_2", [myRoundScore.toString()]);
        this.StartCoroutine(this.IE_ShowPanel());
    }

    *IE_ShowPanel() {
        console.log("ShowRoundPanel", this.mRoundResult.hunterId, this.mRoundResult.hiderId);
        var userId = this.mRoundResult.hiderId;
        this.mTitle.text = Localization.Instance.GetLocalizedText("Ending_title_1"); //"躲藏者胜利";
        this.mContent.text = Localization.Instance.GetLocalizedText("Ending_content_1"); //"最佳躲藏者";
        if (this.mRoundResult.isHunterWin) {
            userId = this.mRoundResult.hunterId;
            this.mTitle.text = Localization.Instance.GetLocalizedText("Ending_title_2"); "寻找者胜利";
            this.mContent.text = Localization.Instance.GetLocalizedText("Ending_content_2"); //"最佳寻找者";
        }
        this.mScore.text = this.mRoundResult.bestScore.toString();
        this.LoadHeadImg(userId);
        yield 0;

        let ids: string[] = [userId];
        ZepetoWorldHelper.GetUserInfo(ids, (info: Users[]) => {
            if (this) {
                console.log(info[0].name);
                this.mName.text = info[0].name;
            }
        }, (error) => {
            console.log(error);
        });
    }

    private LoadHeadImg(userId: string) {
        this.mProfileImg.enabled = false;
        console.log("[LoadHead]:Satrt");
        ZepetoWorldHelper.GetProfileTexture(userId, (texture: Texture) => {
            if (this) {
                console.log("[LoadHead]:Success");
                this.mProfileImg.sprite = this.GetSprite(texture);
                this.mProfileImg.enabled = true;
            }
        }, (error) => {
            console.error("[LoadHead]:Failed");
            console.log(error);
        });
    }

    private GetSprite(texture: Texture) {
        let rect: Rect = new Rect(0, 0, texture.width, texture.height);
        return Sprite.Create(texture as Texture2D, rect, new Vector2(0.5, 0.5));
    }

}