import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { GameObject, Vector3, Animation } from "UnityEngine";
import { Text } from "UnityEngine.UI";
import { Action } from "System";
import Localization from '../Common/Localization/Scripts/Localization';
import UIRoundResultPanel from "../UI/UIRoundResultPanel"
import UIGameOverPanel from "../UI/UIGameOverPanel"
import { GameRule } from '../GameMain';
import AudioController from '../GameController/AudioController';

class ToastNode {
    public IsTimeout: boolean = false;
    public LeftTime: number = 0;
    private mTimeChange: Action = null;

    private mDuration: number = 0;     // 持续时间
    private mElapsed: number;
    private mPassedTime: number = 0;

    public Init(_duration: number, _elapsed: number, _timeChange: Action) {
        this.mDuration = _duration;
        this.mElapsed = _elapsed;
        this.LeftTime = _duration;
        this.mTimeChange = _timeChange;
    }

    public Update(deltaTime: number) {
        this.mPassedTime += deltaTime;
        if (this.mPassedTime >= 1) {
            this.mPassedTime -= 1;
            this.mDuration--;

            if (this.mDuration <= 0) {
                this.IsTimeout = true;
            }
            if (this.mTimeChange != null) {
                this.mTimeChange();
            }
        }
    }

    public UpdateElapsed(_elapsed: number) {
        this.mPassedTime = _elapsed - this.mElapsed;
        this.LeftTime = this.mDuration - this.mPassedTime;
        if (this.LeftTime <= 0) {
            this.IsTimeout = true;
        }
        if (this.mTimeChange != null) {
            this.mTimeChange();
        }
    }
}

export default class UIToast extends ZepetoScriptBehaviour {
    public mGameStatusToast: GameObject;
    public mGameStatusTitle: Text;
    public mGameStatusContent: Text;
    public mGameStatusCountDown: GameObject;
    public mCommonToast: GameObject;
    public mRoundResult: GameObject;
    public mGameOverPanel: GameObject;
    public mLeaderboardPanel: GameObject;
    public mLeaderboardRewardPanel: GameObject;
    public mRewardPanel: GameObject;

    private readonly GameStatusToast = "GameStatusToast";
    private readonly CommonToastDuration = 3;
    private mElasped: number;

    /* singleton */
    private static _instance: UIToast;
    public static get Instance(): UIToast {
        return UIToast._instance;
    }

    private mToastMap: Map<string, ToastNode> = new Map<string, ToastNode>();

    Awake() {
        UIToast._instance = this;
    }

    UpdateElapsed(_elapsed: number) {
        this.mElasped = _elapsed;
        if (this.mToastMap.size > 0) {
            this.mToastMap.forEach((node: ToastNode, name: string) => {
                node.UpdateElapsed(_elapsed);
                if (node.IsTimeout) {
                    this.mToastMap.delete(name);
                }
            })
        }
    }

    public HideGameStatus() {
        this.mGameStatusToast.SetActive(false);
    }

    public ShowGameStatus(title: string, msg: string) {
        this.mGameStatusToast.SetActive(true);
        this.mGameStatusTitle.text = title;
        if (msg == null) {
            this.mGameStatusContent.gameObject.SetActive(false);
        } else {
            this.mGameStatusContent.gameObject.SetActive(true);
            this.mGameStatusContent.text = msg;
        }
    }

    //游戏状态提示Toast
    private ShowGameStatusToast(duration: number, title: string, content?: string) {
        if (this.mToastMap.has(this.GameStatusToast)) {
            this.mToastMap.delete(this.GameStatusToast);
        }

        this.ShowGameStatus(title, content ? content : null);

        let node: ToastNode = new ToastNode();
        node.Init(this.CommonToastDuration, this.mElasped, () => {
            if (node.IsTimeout) {
                this.HideGameStatus();
            }
        });

        this.mToastMap.set(this.GameStatusToast, node);
    }

    //游戏状态提示Toast(有倒计时)
    private ShowGameStatusToastWithCountDown(duration: number, title: string, content?: string) {
        if (this.mToastMap.has(this.GameStatusToast)) {
            this.mToastMap.delete(this.GameStatusToast);
        }

        this.ShowGameStatus(title, content ? content : null);

        var countDown = this.mGameStatusCountDown;
        countDown.SetActive(true);
        var countDownText = countDown.GetComponentInChildren<Text>();
        countDownText.text = duration.toString();

        let node: ToastNode = new ToastNode();
        node.Init(duration, this.mElasped, () => {
            countDownText.text = node.LeftTime.toString(); //mathf.floor( time / 10)
            if (node.LeftTime <= 10) {
                AudioController.Instance.PlayTimeout();
            }
            if (node.IsTimeout) {
                countDown.SetActive(false);
                this.HideGameStatus();
            }
        });

        this.mToastMap.set(this.GameStatusToast, node);
    }

    //公用提示弹窗
    private ShowCommonToast(title: string, content?: string) {

        if (this.mToastMap.has(title)) {
            return;
        }
        let comToastObj = GameObject.Instantiate<GameObject>(this.mCommonToast, this.transform);
        let titleText = comToastObj.transform.GetChild(0).GetComponent<Text>();
        titleText.text = title;

        let contentText = comToastObj.transform.GetChild(1).GetComponent<Text>();
        if (content && content != "") {
            contentText.text = content;
            contentText.gameObject.SetActive(true);
        }
        else {
            contentText.gameObject.SetActive(false);
        }

        let animationClip = comToastObj.GetComponent<Animation>().clip;
        let node: ToastNode = new ToastNode();
        node.Init(animationClip.length, this.mElasped, () => {
            if (node.IsTimeout) {
                if (this.mToastMap.has(title)) {
                    this.mToastMap.delete(title);
                }
                GameObject.DestroyImmediate(comToastObj);
            }
        });

        this.mToastMap.set(title, node);
    }

    // 通知------------------------
    //游戏等待提示
    public ShowGameWait() {
        var title = Localization.Instance.GetLocalizedText("Toast_wait_tip");
        var content = Localization.Instance.GetLocalizedText("Toast_wait_content");
        this.ShowGameStatus(title, content);
    }

    //游戏开始提示
    public ShowGameStart(isHunter: boolean, duration: number) {
        var title = Localization.Instance.GetLocalizedText("Toast_hider_tip");
        if (isHunter) {
            title = Localization.Instance.GetLocalizedText("Toast_hunter_tip");
        }
        // console.error("游戏开始倒计时：", Date.now());
        this.ShowGameStatusToastWithCountDown(duration, title);
    }

    //巅峰时刻提示
    public ShowPeakMoment(duration: number, elapsed: number) {
        // Crazy_tips_1,巅峰时刻xx秒
        // Crazy_tips_2,躲藏者血量大幅提升！寻找者移动速度增加，获得扫描功能
        // if (this.mToastMap.has(this.CommonToast)) {
        //     this.mToastMap.delete(this.CommonToast);
        // }

        var title = Localization.Instance.GetLocalizedText("Toast_peak_tip");
        var content = Localization.Instance.GetLocalizedText("Toast_peak_content");
        this.ShowGameStatus(title, content);

        // let node: ToastNode = new ToastNode();
        // node.Init(duration, elapsed, () => {
        //     this.mCommonContent.text = title;
        //     if (node.IsTimeout) {
        //         this.Hide();
        //     }
        // });
        // this.mToastMap.set(this.CommonToast, node);
    }

    //即将开始倒计时
    public ShowReadyCountDown(duration: number) {
        var title = Localization.Instance.GetLocalizedText("Toast_ready_start");
        // console.error("即将开始倒计时");
        this.ShowGameStatusToastWithCountDown(duration, title);
    }

    private readonly mResultDealyConst: number = 2;
    private readonly mRoundOverDuration: number = 5;
    private readonly mGameOverDuration: number = 10;

    //小回合结算
    public ShowRoundResult(roundResult: any, round: number, gameRule: GameRule, myScore: number) {
        if (round < gameRule.roundNumber) { //最后一回合结束时只显示游戏结算面板       
            let tip = Localization.Instance.GetLocalizedText("Toast_round_over");
            this.ShowGameStatus(tip, null);
            let node: ToastNode = new ToastNode();
            node.Init(this.mResultDealyConst, this.mElasped, () => {
                if (node.IsTimeout) {
                    this.mToastMap.delete("RoundResultDelay");
                    this.ShowRoundPanel(roundResult, this.mRoundOverDuration, myScore);
                }
            });
            this.mToastMap.set("RoundResultDelay", node);
        }
    }

    private ShowRoundPanel(roundResult: any, duration: number, myScore: number) {
        this.HideGameStatus();
        console.log("[RoundOver]显示回合结算");
        var item = GameObject.Instantiate<GameObject>(this.mRoundResult, this.transform);
        let roundResultPanel = item.GetComponent<UIRoundResultPanel>();
        roundResultPanel.mCoundDownTimer.text = duration.toString();
        roundResultPanel.Show(roundResult, myScore);
        let node: ToastNode = new ToastNode();
        node.Init(duration, this.mElasped, () => {
            roundResultPanel.mCoundDownTimer.text = node.LeftTime.toString(); //mathf.floor( time / 10)
            if (node.IsTimeout) {
                console.log("[RoundOver]关闭回合结算");
                this.mToastMap.delete("RoundResult");
                GameObject.DestroyImmediate(item);
            }
        });
        this.mToastMap.set("RoundResult", node);
    }

    //游戏结算
    public ShowGameOver(result: any) {
        let tip = Localization.Instance.GetLocalizedText("Toast_game_over");
        this.ShowGameStatus(tip, null);
        let node: ToastNode = new ToastNode();
        node.Init(this.mResultDealyConst, this.mElasped, () => {
            if (node.IsTimeout) {
                if (this.mToastMap.has("GameOverDelay")) {
                    this.mToastMap.delete("GameOverDelay");
                }
                this.ShowGameOverPanel(result, this.mGameOverDuration);
            }
        });

        this.mToastMap.set("GameOverDelay", node);
    }

    private ShowGameOverPanel(result: any, duration: number) {
        this.HideGameStatus();
        var item = GameObject.Instantiate<GameObject>(this.mGameOverPanel, this.transform);
        item.SetActive(true);
        let gameOverPanel = item.GetComponent<UIGameOverPanel>();
        gameOverPanel.mCoundDownTimer.text = duration.toString();
        gameOverPanel.Show(result);
        item.transform.localScale = Vector3.one;
        let node: ToastNode = new ToastNode();

        console.log("[GameOver]显示游戏结算");
        node.Init(duration, this.mElasped, () => {
            gameOverPanel.mCoundDownTimer.text = node.LeftTime.toString(); //mathf.floor( time / 10)
            if (node.IsTimeout) {
                if (this.mToastMap.has("GameOverResult")) {
                    this.mToastMap.delete("GameOverResult");
                }
                console.log("[GameOver]关闭游戏结算");
                GameObject.DestroyImmediate(item);
            }
        });
        this.mToastMap.set("GameOverResult", node);
    }

    //躲藏者受击提示
    public ShowHiderBeFound() {
        var title = Localization.Instance.GetLocalizedText("Toast_hider_beFound");
        this.ShowCommonToast(title);
    }

    //躲藏者被扫描到提示
    public ShowHiderBeScan() {
        var title = Localization.Instance.GetLocalizedText("Toast_hider_beScan");
        this.ShowCommonToast(title);
    }

    //寻找者扫描到提示
    public ShowHunterScan() {
        var title = Localization.Instance.GetLocalizedText("Toast_hunter_Scan");
        this.ShowCommonToast(title);
    }

    //躲藏者死亡提示
    public ShowHiderDead() {
        var title = Localization.Instance.GetLocalizedText("Toast_hider_dead");
        this.ShowCommonToast(title);
    }

    //寻找者击杀提示
    public ShowHunterKill() {
        var title = Localization.Instance.GetLocalizedText("Toast_hunter_kill");
        this.ShowCommonToast(title);
    }

    //躲藏者使用隐身道具时间提示 //功能不要了
    // public ShowHiderBuffTime() {
    //     var title = Localization.Instance.GetLocalizedText("Toast_buff_duration");
    //     this.ShowCommonToast(title);
    // }

    //状态锁定/解锁提示
    public ShowLockViewStatus(isLock: boolean) {
        var title = Localization.Instance.GetLocalizedText(isLock ? "Toast_status_lock" : "Toast_status_unlock");
        this.ShowCommonToast(title);
    }

    //分享成功提示
    public ShowFeedSuccess() {
        var title = Localization.Instance.GetLocalizedText("Feed_success");
        this.ShowCommonToast(title);
    }

    //分享失败提示
    public ShowFeedFail() {
        var title = Localization.Instance.GetLocalizedText("Feed_fail");
        this.ShowCommonToast(title);
    }
    //-------------------------通知
}