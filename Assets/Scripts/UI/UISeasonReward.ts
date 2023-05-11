import { GameObject } from 'UnityEngine';
import { Slider, Text } from 'UnityEngine.UI'
import { RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization from '../Common/Localization/Scripts/Localization';
import ConfigManager, { SeasonReward } from '../GameManager/ConfigManager';
import NetManager, { sEventArg } from '../GameManager/NetManager';
import GameData from '../GameStaticData/GameData';
import SeasonRewardItem from './SeasonRewardItem';

export default class UISeasonReward extends ZepetoScriptBehaviour {

    public mMyScoreNumText: Text;
    public mEndTime: Text;
    public mRuleText: Text;
    public mSlider: Slider;
    public mSeasonRewardObjArray: GameObject[];
    public get Leaderboard() { return GameData.LEADERBOARD; }

    private _seasonRewardItems: SeasonRewardItem[];
    private _seasonRewardArray: SeasonReward[];
    private _seasonRewardInfo: number[] = [];
    private _myScore: number = 0;
    private _maxScore: number = 0;
    private _nextResetTime: number = 0;
    private _intervalId: number = 0;


    Start() {
        let date = new Date();
        let hours = -date.getTimezoneOffset() / 60;
        this.mRuleText.text = Localization.Instance.GetLocalizedTextWithParam("Season_Reward_Rule", [hours + ""]);
    }

    OnEnable() {
        const roomData = new RoomData();
        NetManager.Instance.SendEvent(sEventArg.SyncSeasonInfo, roomData);
        this._nextResetTime = this.GetNextResetTime();
        let countdown = this._nextResetTime - Date.now();
        let colorStr = "<color=#FFDF58FF>" + this.formatCountdown(countdown) + "</color>";
        this.mEndTime.text = Localization.Instance.GetLocalizedTextWithParam("Season_End_Time", [colorStr]);
        this.StartCountDown(countdown);
    }

    OnDisable() {
        if (this._intervalId && this._intervalId != 0) {
            clearInterval(this._intervalId);
        }
    }

    public Init() {
        this._seasonRewardArray = ConfigManager.SEASON_REWARD_ARRAY;
        this.InitSeasonReward();
    }

    private InitSeasonReward() {
        this._seasonRewardItems = [];
        this._maxScore = this._seasonRewardArray[this._seasonRewardArray.length - 1].score;
        for (let i = 0; i < this._seasonRewardArray.length; i++) {
            let seasonReward = this._seasonRewardArray[i];
            let seasonRewardItem = this.mSeasonRewardObjArray[i].GetComponent<SeasonRewardItem>();
            seasonRewardItem.InitComponent(seasonReward, this.ClickSeasonRewardItem.bind(this));
            seasonRewardItem.SetStatus(0, 0);
            this._seasonRewardItems.push(seasonRewardItem);
        }
    }

    private ClickSeasonRewardItem(id: number) {
        const roomData = new RoomData();
        roomData.Add("id", id);
        roomData.Add("score", this._myScore);
        NetManager.Instance.SendEvent(sEventArg.ClaimSeasonReward, roomData)
        console.log("请求赛季奖励:", id);
    }

    public RefreshMySeasonScore(score: number) {
        this._myScore = score;
        this.RefreshView();
    }

    private RefreshView() {
        this.mMyScoreNumText.text = this._myScore + "";

        for (let i = 0; i < this._seasonRewardItems.length; i++) {
            let item = this._seasonRewardItems[i];
            let status = 0;
            if (item.seasonReward.score <= this._myScore) {
                status = 1;
                if (this.CheckClaimReward(item.seasonReward.id)) {
                    status = 2;
                }
            }
            item.SetStatus(this._myScore, status);
        }
        if (this._myScore >= this._maxScore) {
            this.mSlider.maxValue = 1;
            this.mSlider.value = 1;
        }
        else {
            this.mSlider.maxValue = this._maxScore;
            this.mSlider.value = this._myScore;
        }
    }

    private CheckClaimReward(id: number): boolean {
        let isReward = false;
        for (let i = 0; i < this._seasonRewardInfo.length; i++) {
            if (id == this._seasonRewardInfo[i]) {
                isReward = true;
                break;
            }
        }
        return isReward;
    }

    UpdateSeasonReward(seasonRewardInfo: number[]) {
        this._seasonRewardInfo = seasonRewardInfo;
        this.RefreshView();
    }

    private GetNextResetTime(): number {
        let today = new Date();
        let resetTime = this.GetFirstDayOfWeek(today, this.Leaderboard.WeekRank.resetDay, this.Leaderboard.WeekRank.resetHour, this.Leaderboard.WeekRank.resetMin, this.Leaderboard.WeekRank.resetSec);
        console.log("赛季上次重置时间：", resetTime.toString());
        resetTime.setUTCDate(resetTime.getUTCDate() + 7);
        console.log("赛季重置时间：", resetTime.toString());
        return resetTime.getTime();
    }


    private GetFirstDayOfWeek(date: Date, startDay: number, hours: number, min: number, sec: number, ms: number = 0): Date {
        let firstDay = new Date(date.setUTCDate(date.getUTCDate() - (7 + date.getUTCDay() - startDay) % 7));
        firstDay.setUTCHours(hours, min, sec, ms);
        return firstDay;
    }

    private formatCountdown(milliseconds: number): string {
        let s = Math.round(milliseconds / 1000);
        let time = s + " " + Localization.Instance.GetLocalizedText("TIME_TEXT_4");
        if (s >= 60) {
            let min = Math.floor(s / 60);
            let second = s - 60 * min;
            time = min + " " + Localization.Instance.GetLocalizedText("TIME_TEXT_3") + " " + second + " " + Localization.Instance.GetLocalizedText("TIME_TEXT_4");
            if (min >= 60) {
                let hour = Math.floor(s / 60 / 60);
                min = Math.floor((s - hour * 60 * 60) / 60);
                time = hour + " " + Localization.Instance.GetLocalizedText("TIME_TEXT_2") + " " + min + " " + Localization.Instance.GetLocalizedText("TIME_TEXT_3");
                if (hour >= 24) {
                    let day = Math.floor(s / 60 / 60 / 24);
                    hour = Math.floor((s - day * 60 * 60 * 24) / 60 / 60)
                    time = day + " " + Localization.Instance.GetLocalizedText("TIME_TEXT_1") + " " + hour + " " + Localization.Instance.GetLocalizedText("TIME_TEXT_2");
                }
            }
        }
        return time;
    }

    private StartCountDown(countdown: number) {
        this._intervalId = setInterval(() => {
            countdown = countdown - 1000;
            if (countdown > 0) {
                let colorStr = "<color=#FFDF58FF>" + this.formatCountdown(countdown) + "</color>";
                this.mEndTime.text = Localization.Instance.GetLocalizedTextWithParam("Season_End_Time", [colorStr]);
            } else {
                let colorStr = "<color=#FFDF58FF>" + this.formatCountdown(countdown) + "</color>";
                this.mEndTime.text = Localization.Instance.GetLocalizedTextWithParam("Season_End_Time", [colorStr]);
                clearInterval(this._intervalId);
                this._intervalId = 0;
                this.ResetSeason();
            }
        }, 1000);
    }

    private ResetSeason() {
        this._seasonRewardInfo = [];
        this._myScore = 0;
        this._nextResetTime = this.GetNextResetTime();
        this.RefreshView();
        let countdown = this._nextResetTime - Date.now();
        this.StartCountDown(countdown);
    }

}