import { GameObject, RectTransform, WaitForSeconds, Vector3, Time } from 'UnityEngine';
import { Text, Button, ScrollRect } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

import { GetRangeRankResponse, GetRankResponse, LeaderboardAPI, Rank, RankInfo, SetScoreResponse } from 'ZEPETO.Script.Leaderboard';
import GameData from "../GameStaticData/GameData"
import GameMain from "../GameMain"
import LeaderboardItem from './LeaderboardItem';
import UIToast from './UIToast';
import Localization from '../Common/Localization/Scripts/Localization';

export default class UILeaderboardPanel extends ZepetoScriptBehaviour {

    public mTitleText: Text;
    public mEndText: Text;
    public mTipText: Text;
    public mMyRankTip: Text;
    public mMyRank: Text;
    public mMyScoreTip: Text;
    public mMyScore: Text;

    public mRewardBtn: Button;
    public mCloseBtn: Button;

    public mScrollView: ScrollRect;
    public mLeaderboardItem: GameObject;
    public mLeaderboardReward: GameObject;
    private leaderboardItemObjs: GameObject[];

    private readonly GET_RANK_START: number = 1;
    private readonly GET_RANK_END: number = 50;

    private get Leaderboard() { return GameData.LEADERBOARD; }

    Awake() {
        this.leaderboardItemObjs = [];
        this.leaderboardItemObjs.push(this.mLeaderboardItem);
        this.mCloseBtn.onClick.AddListener(this.clickClose.bind(this));
        this.mRewardBtn.onClick.AddListener(this.clickReward.bind(this));
        let date = new Date();
        let hours = -date.getTimezoneOffset() / 60;
        this.mEndText.text = Localization.Instance.GetLocalizedTextWithParam("Rank_tips", [hours + ""]);
    }

    private clickClose() {
        this.gameObject.SetActive(false);
    }

    private clickReward() {
        this.mLeaderboardReward.SetActive(true);
    }


    Start() {
        this.mScrollView.content.gameObject.SetActive(false);
        this.mMyRank.text = "--";
        this.mMyScore.text = "--";
        this.StartCoroutine(this.IE_DealyShow());
    }

    *IE_DealyShow() {
        console.log("加载排行榜");
        yield new WaitForSeconds(0.1);
        this.GetRangeRank(this.GET_RANK_START, this.GET_RANK_END, false);
    }


    GetRangeRank(startRank: number, endRank: number, prevRanking: boolean) {
        LeaderboardAPI.GetRangeRank(this.Leaderboard.WeekRank.id, startRank, endRank, this.Leaderboard.WeekRank.resetRule, prevRanking,
            (x) => this.OnResultWeekRank(x),
            (x) => this.OnErrorGetRangeRank(x)
        );
        console.log(`GetRangeRank...`);
    }

    OnResultWeekRank(result: GetRangeRankResponse) {
        if (result.rankInfo.rankList == null) {
            console.log('rankInfo is empty!');
            return;
        }
        console.log(`GetRank success!} `);
        let rankList = result.rankInfo.rankList;

        for (let i = 0; i < this.leaderboardItemObjs.length; i++) {
            const obj = this.leaderboardItemObjs[i];
            obj.SetActive(false);
        }

        for (var i = 0; i < rankList.length; i++) {
            // console.log(rankList[i].rank, rankList[i].name, rankList[i].score, rankList[i].member);
            var item: GameObject;
            if (i > this.leaderboardItemObjs.length - 1) {
                item = GameObject.Instantiate<GameObject>(this.mLeaderboardItem, this.mScrollView.content);
                this.leaderboardItemObjs.push(item);
            }
            else {
                item = this.leaderboardItemObjs[i];
            }
            item.transform.localScale = Vector3.one;
            item.GetComponent<LeaderboardItem>().SetRankData(rankList[i]);
            item.SetActive(true);
        }
        this.mScrollView.content.gameObject.SetActive(true);
        let myRankInfo = result.rankInfo.myRank;
        console.log("GetRangeRank.myRank.score:", result.rankInfo.myRank.score);
        console.log("GetRangeRank.myRank.rank:", result.rankInfo.myRank.rank);
        if (myRankInfo) {
            this.mMyRank.text = myRankInfo.rank.toString();
            this.mMyScore.text = myRankInfo.score.toString();
        }
        else {
            this.mMyRank.text = "--";
            this.mMyScore.text = "--";
        }
    }

    OnErrorGetRangeRank(error) {
        console.log(error);
    }


}
