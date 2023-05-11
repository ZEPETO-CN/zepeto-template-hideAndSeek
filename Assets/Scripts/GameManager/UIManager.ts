import { GameObject, Input, KeyCode } from 'UnityEngine';
import { ActionEvent } from './PlayerManager'
import BaseManager from './BaseManager'
import { sEventArg } from "./NetManager"
import UIToast from '../UI/UIToast'
import UILoading from '../UI/UILoading'
import UIHomePanel from '../UI/UIHomePanel'
import { sGameInfo, sPlayer, sRoundResult } from "ZEPETO.Multiplay.Schema";
import { GameRule } from '../GameMain';
import UIModelRandomPanel from '../UI/UIModelRandomPanel';
import UIDailyTaskPanel from '../UI/DailyTask/UIDailyTaskPanel';
import Localization from '../Common/Localization/Scripts/Localization';
import UIRewardPanel from '../UI/UIRewardPanel';
import UIMessagePanel from '../UI/UIMessagePanel';
import { RewardType } from './ConfigManager';
import UIStarRewardPanel from '../UI/UIStarRewardPanel';
import UISeasonReward from '../UI/UISeasonReward';

export default class UIManager extends BaseManager {

    /* singleton */
    private static _instance: UIManager;
    public static get Instance(): UIManager {
        return UIManager._instance;
    }

    public mLoadingPanel: GameObject;
    public mHomePanel: GameObject;
    public mRandomModelPanel: GameObject;
    public mDailyTaskPanel: GameObject;
    public mRewardPanel: GameObject;
    public mMessagePanel: GameObject;
    public mLeaderboardPanel: GameObject;
    public mZemPanel: GameObject;
    public mStarRewardPanel: GameObject;
    public mSeasonRewardPanel: GameObject;
    private mDailyTaskCtrl: UIDailyTaskPanel;
    public TOAST: UIToast;
    public mHomeCtrl: UIHomePanel;
    public mMessageCtrl: UIMessagePanel;
    public mStarRewardCtrl: UIStarRewardPanel;
    public mSeasonRewardCtrl: UISeasonReward;
    private mLastModel: number;
    private mCurStar: number;
    public elasped: number;

    public get CurStar() { return this.mCurStar; }


    Awake() {
        UIManager._instance = this;
        this.mLastModel = -1;
    }

    Start() {
        this.TOAST = UIToast.Instance;
        this.mLoadingPanel.SetActive(true);
        this.mHomeCtrl = this.mHomePanel.GetComponent<UIHomePanel>();
        this.mDailyTaskCtrl = this.mDailyTaskPanel.GetComponent<UIDailyTaskPanel>();
        this.mMessageCtrl = this.mMessagePanel.GetComponent<UIMessagePanel>();
        this.mMessageCtrl.Init();
        this.mStarRewardCtrl = this.mStarRewardPanel.GetComponent<UIStarRewardPanel>();
        this.mStarRewardCtrl.Init();
        this.mSeasonRewardCtrl = this.mSeasonRewardPanel.GetComponent<UISeasonReward>();
        this.mSeasonRewardCtrl.Init();
    }

    public OnGameWait() {
        this.mHomeCtrl.OnGameWait();
        if (this.mMessageCtrl) {
            this.mMessageCtrl.OnGamwWait();
        }
    }

    OnGameReady() {
        // 游戏倒计时
        this.mHomeCtrl.OnGameReady();
    }

    OnGameStart(gameInfo: sGameInfo, gameRule: GameRule, player: sPlayer) {
        if (this.mHomeCtrl != null) {
            this.mHomeCtrl.OnGameStart(gameInfo, gameRule, player);
        }
        if (this.mMessageCtrl) {
            this.mMessageCtrl.OnGameStart(player.isHunter);
        }
    }

    OnGameUpdate(gameInfo: sGameInfo, player: sPlayer) {
        this.mHomeCtrl.OnGameUpdate(gameInfo, player);
    }

    OnPeakMoment(addHP: number, isHunter: boolean) {
        // this.TOAST.ShowPeakMoment(30);
        if (!isHunter) {
            this.mHomeCtrl.OnPeakMoment(addHP);
        }
        this.mHomeCtrl.SetTimerColor(true);
    }

    SendRandomModel() {
        this.SendEvent(sEventArg.RandomModel, null);
    }

    OnShowRandomModel(targetId: number) {
        this.mHomeCtrl.OpenRandomModelPanel(targetId);
    }

    OnConfirmedModel() {
        this.mHomeCtrl.HideRandomModelPanel();
    }

    OnRoundOver(roundResult: sRoundResult) {
        console.log("Show RoundOver UI");
        this.mLastModel = -1;

        this.mHomeCtrl.OnRoundOver();
        this.mMessageCtrl.OnRoundOver();
    }

    OnGameOver() {
        console.log("游戏结束");
        this.mHomeCtrl.OnGameOver();
    }

    OnShoot() {
        // this.SendEvent(sEventArg.OnShoot, null);
    }

    // OnSwitchLight() {
    //     this.SendEvent(sEventArg.SwitchLight, null);
    // }

    OnUseBuff(buffId: number) {
        this.SendEvent(sEventArg.UseBuff, buffId);
    }

    CheckCanRestore(): boolean {
        if (this.mLastModel < 0 || this.mLastModel > 90) return false;
        return true;
    }

    OnLockView(isLock: boolean) {
        this.TOAST.ShowLockViewStatus(isLock);
        this.OnActionEvent(ActionEvent.OnLockCamera, isLock);
    }

    OnFreeCamra(isFree: boolean) {
        this.OnActionEvent(ActionEvent.OnFreeCamera, isFree);
    }

    OnWatchCamera(sessionId: string) {
        this.OnActionEvent(ActionEvent.OnWatchCamera, sessionId);
    }

    OnDie(data: any) {
        this.mHomeCtrl.OnDie(data);
    }

    OnChangeModelCost(modelId: number, cost: number): boolean {
        //let canChange = this.CheckCanChangeModel(cost);

        if (true) {
            this.mLastModel = modelId;
            this.SendEvent(sEventArg.ChangeModel, modelId)
            return true;
        }
        else {
            //this.TOAST.Show("星星值不够!", 1);
            return false;
        }
    }

    OnChangeModel(modelId: number): boolean {
        this.mLastModel = modelId;
        this.SendEvent(sEventArg.ChangeModel, modelId);
        return true;
    }

    OnUpdateHP(curHP: number, elasped: number) {
        let isBeAttacked = this.mHomeCtrl.UpdateUP(curHP);
        if (isBeAttacked) {
            if (curHP != 0) {
                this.TOAST.ShowHiderBeFound();
            }
        }
    }

    OnUpdateStar(curStar: number) {
        this.mCurStar = curStar;
        this.mHomeCtrl.UpdateStar(curStar);
        this.mRandomModelPanel.GetComponent<UIModelRandomPanel>().UpdateStar(curStar);
        this.mStarRewardCtrl.UpdateStar(curStar);
    }

    OnUpdateBuff(buffNum: number) {
        this.mHomeCtrl.UpdateBuff(buffNum);
    }

    OnSyncsRankReward(message: any) {
        // let index = message[0];
        // let rank = message[1];
        let rewardAmount = message[3];
        let rewardType = message[4];
        this.ShowRankRewardPanel(rewardAmount, rewardType);
    }

    OnSyncsDailyReward(message: any) {
        let rewardType = message[0];
        let rewardAmount = message[1];
        this.ShowDailyRewardPanel(rewardAmount, rewardType);
    }

    OnSyncWeekActivity(message: any) {
        let weekActivityInfo = JSON.parse(message);
        this.mDailyTaskCtrl.UpdateWeekActivity(weekActivityInfo);
    }

    OnSyncStarRewardInfo(message: any) {
        let starRewardInfo = JSON.parse(message);
        this.mStarRewardCtrl.UpdateStarRewardInfo(starRewardInfo);
    }

    OnReceiveStarReward(message: any) {
        let rewardType = message[0];
        let rewardAmount = message[1];
        this.mStarRewardCtrl.ShowReward(rewardAmount, rewardType);
    }

    OnSyncSeasonRewardInfo(message: any) {
        let seasonRewardInfo = JSON.parse(message);
        this.mSeasonRewardCtrl.UpdateSeasonReward(seasonRewardInfo);
    }


    /* Static Canvas Event */
    OnFinishLoad(userId: any) {
        console.log("OnFinishLoad!");
        if (this.mLoadingPanel != null) {
            this.mLoadingPanel.GetComponent<UILoading>().OnFinishLoad();
            this.mLoadingPanel = null;
        }
        if (this.mHomeCtrl != null) {
            this.mHomeCtrl.Init();
        }
    }

    OnUpdateDailyTaskInfo(dailyTaskInfo: any) {
    }

    //排行榜奖励
    public ShowRankRewardPanel(totalAmount: number, rewardType: RewardType) {
        if (totalAmount) {
            let tip = "";
            switch (rewardType) {
                case RewardType.COIN:
                    tip = Localization.Instance.GetLocalizedTextWithParam("Reward_rank_tips", [totalAmount.toString()]);
                    break;
                case RewardType.ZEM:
                    tip = Localization.Instance.GetLocalizedTextWithParam("Reward_rank_tips_1", [totalAmount.toString()]);
                    break;
                default:
                    break;
            }
            this.mRewardPanel.SetActive(true);
            let rewardPanel = this.mRewardPanel.GetComponent<UIRewardPanel>();
            rewardPanel.ShowReward(tip, rewardType);
        }
        else {
            console.error("排行榜奖励错误：", totalAmount);
        }
    }

    //每日任务活跃度奖励
    public ShowDailyRewardPanel(totalAmount: number, rewardType: RewardType) {
        if (totalAmount) {
            let tip = "";
            switch (rewardType) {
                case RewardType.COIN:
                    tip = Localization.Instance.GetLocalizedTextWithParam("Reward_daily_task_tips", [totalAmount.toString()]);
                    break;
                case RewardType.ZEM:
                    tip = Localization.Instance.GetLocalizedTextWithParam("Reward_daily_task_tips_1", [totalAmount.toString()]);
                    break;
                default:
                    break;
            }
            this.mRewardPanel.SetActive(true);
            let rewardPanel = this.mRewardPanel.GetComponent<UIRewardPanel>();
            rewardPanel.ShowReward(tip, rewardType);
        }
        else {
            console.error("每日活跃度奖励错误：", totalAmount);
        }
    }

    //发送快捷消息
    public SendQuickMessage(quickMessage: any) {
        this.SendEvent(sEventArg.QuickMessage, quickMessage);
    }

    //收到快捷消息
    public ReceiveQuickMessage(message: any) {
        this.mMessageCtrl.mBarrageUI.AddBarrageItem(message.type, message.id, message.name, message.group);
    }

    //兑换星星夺宝
    public SendExchangeStarReward() {
        this.SendEvent(sEventArg.ExchangeStarReward, null);
    }

    //刷新赛季积分
    public RefreshMySeasonScore(score: number) {
        this.mSeasonRewardCtrl.RefreshMySeasonScore(score);
    }
}