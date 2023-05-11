import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import UIManager from "./GameManager/UIManager"
import MapManager from "./GameManager/MapManager"
import NetManager, { sEventArg, GameState } from "./GameManager/NetManager"
import PlayerManager, { ActionEvent } from "./GameManager/PlayerManager"
import ConfigManager from "./GameManager/ConfigManager"
import { AudioClip, AudioSource, GameObject, Vector3, Time, WaitForSeconds } from "UnityEngine";
import AudioController from './GameController/AudioController'
import { sPlayer, sVector3, State, sPlayerInfo, sGameInfo, sRoundResult } from "ZEPETO.Multiplay.Schema";
import { RoomData } from "ZEPETO.Multiplay";
import { SetScoreResponse, LeaderboardAPI } from 'ZEPETO.Script.Leaderboard'
import GameData from './GameStaticData/GameData'
import UIToast from "./UI/UIToast"

export default class GameMain extends ZepetoScriptBehaviour {

    /* Singleton */

    private static _instance: GameMain;
    public static get Instance(): GameMain {
        if (!GameMain._instance) {
            const targetObj = GameObject.Find("GameMain");
            if (targetObj) GameMain._instance = targetObj.GetComponent<GameMain>();
        }
        return GameMain._instance;
    }
    /* Mgr */
    private mUIMgr: UIManager;
    private mMapmgr: MapManager;
    private mNetMgr: NetManager;
    private mPlayerMgr: PlayerManager;
    private mConfigMgr: ConfigManager;

    private mGameInfo: sGameInfo;
    private mRoundResult: sRoundResult;
    private mPlayer: sPlayer;

    public mGameState: GameState;
    public mGameRule: GameRule;

    public get Leaderboard() { return GameData.LEADERBOARD; }

    Awake() {
        GameMain._instance = this;
    }

    Start() {
        this.mNetMgr = NetManager.Instance;
        this.mPlayerMgr = PlayerManager.Instance;
        this.mUIMgr = UIManager.Instance;
        this.mConfigMgr = ConfigManager.Instance;
        this.mMapmgr = MapManager.Instance;
        this.mGameState = GameState.None;
    }

    private heartTimer: number = 0;
    Update() {
        this.heartTimer += Time.deltaTime;
        if (this.heartTimer > GameData.GAME_HEART_RATE) {
            this.heartTimer -= GameData.GAME_HEART_RATE;
            this.OnGameHeartUpdate();
        }
    }

    public InitRoomSessionId(sessionId: string) {
        this.mPlayerMgr.SetSessionId(sessionId);
    }

    public OnGameHeartUpdate() {
        // console.log("发送游戏心跳");
        this.SendEvent(sEventArg.GameUpdate, null);
    }

    public OnStateUpdate(playerMap: any) {
        playerMap.ForEach((userId: string, player: sPlayer) => {
            console.log("[OnStateUpdate] " + userId + " -- " + player.id);
        })
    }

    /* 处理本地事件 */
    public OnActionEvent(eventName: string, message: any) {
        // console.log("OnActionEvent ", eventName);
        switch (eventName) {
            case ActionEvent.OnFinishLoad:
                let userId: string = message;
                AudioController.Instance.PlayReadyBGM();
                this.mUIMgr.OnFinishLoad(userId);
                this.OnLeaderBoardReward(userId);
                // this.SetScore(userId, 100);
                break;
            // case ActionEvent.OnUpdatePlayerNum:
            //     this.mUIMgr.OnUpdatePlayerNum(Number(message));
            //     break;
            case ActionEvent.OnUpdateHP:
                if (this.mGameState >= GameState.GameStart) {
                    this.mUIMgr.OnUpdateHP(message, this.mGameInfo.Elapsed);
                }
                break;
            case ActionEvent.OnUpdateStar:
                this.mUIMgr.OnUpdateStar(message);
                break;
            case ActionEvent.OnUpdateBuff:
                this.mUIMgr.OnUpdateBuff(message);
                break;
            case ActionEvent.OnLockCamera:
                let isLock: boolean = message;
                this.mPlayerMgr.LockCamera(isLock);
                break;
            case ActionEvent.OnFreeCamera:
                let isFree: boolean = message;
                this.mPlayerMgr.FreeCamera(isFree);
                break;
            case ActionEvent.OnWatchCamera:
                this.mPlayerMgr.WatchCamera(true, message);
                break;
            case ActionEvent.OnDie:
                this.mUIMgr.OnDie(message);
                break;
        }
    }

    /* Handle Event */
    public HandleEvent(eventName: sEventArg, message: any) {
        //console.log(`HandleEvent : [${eventName}]  !!!`);
        switch (eventName) {
            case sEventArg.DynamicMapChange:
                this.mMapmgr.OnDynamicMapChange(message);
                break;
            case sEventArg.DailyTaskInfoUpdate:
                this.mUIMgr.OnUpdateDailyTaskInfo(message);
                break;
            case sEventArg.GameRule:
                this.mGameRule = JSON.parse(message);
                break;
            case sEventArg.PlayerChange:
                this.mPlayerMgr.OnPlayerChange(message);
                break;
            case sEventArg.PlayerMove:
                this.mPlayerMgr.OnReceiveMoveData(message);
                break;
            case sEventArg.PlayerJump:
                break;
            case sEventArg.PlayerInfoSync:
                this.mPlayerMgr.UpdatePlayerInfo(message);
                break;
            case sEventArg.OnShoot:
                //this.mPlayerMgr.OnShoot(message);
                break;
            case sEventArg.BeAttacked:
                //this.mMapmgr.GetAudioCtrl().OnPlayAttackedAudio();
                break;
            case sEventArg.PlayerDie:
                this.mPlayerMgr.OnPlayerDie(message);
                break;
            case sEventArg.RandomModel:
                this.mUIMgr.OnShowRandomModel(message);
                break;
            case sEventArg.GameUpdate:
                this.mGameInfo = message;
                UIToast.Instance.UpdateElapsed(this.mGameInfo.Elapsed);
                this.GameStateChange();
                break;
            case sEventArg.SwitchLight:
                this.mPlayerMgr.SyncLightAction(message);
                break;
            case sEventArg.SwitchSuperLight:
                this.mPlayerMgr.SyncSuperLightAction(message);
                break;
            case sEventArg.BeScan:
                this.mPlayerMgr.OnPlayerScan(message);
                break;
            case sEventArg.SyncRankReward:
                this.mUIMgr.OnSyncsRankReward(message);
                break;
            case sEventArg.SyncDailyReward:
                this.mUIMgr.OnSyncsDailyReward(message);
                break;
            case sEventArg.SyncWeekActivity:
                this.mUIMgr.OnSyncWeekActivity(message);
                break;
            case sEventArg.QuickMessage:
                this.mUIMgr.ReceiveQuickMessage(message);
                break;
            case sEventArg.SyncStarRewardInfo:
                this.mUIMgr.OnSyncStarRewardInfo(message);
                break;
            case sEventArg.ReceiveStarReward:
                this.mUIMgr.OnReceiveStarReward(message);
                break;
            case sEventArg.SyncSeasonInfo:
                this.mUIMgr.OnSyncSeasonRewardInfo(message);
                break;
            case sEventArg.SyncSeasonReward:
                this.mUIMgr.OnSyncsDailyReward(message);
                break;
        }
    }

    private GameStateChange() {
        this.mPlayer = this.mPlayerMgr.GetLocalPlayer();
        this.mUIMgr.OnGameUpdate(this.mGameInfo, this.mPlayer);
        this.mPlayerMgr.UpdateCheck(this.mGameInfo.GameState);
        if (this.mGameState != this.mGameInfo.GameState) {
            console.log("GameStateChange", this.mGameInfo.GameState);
            this.mGameState = this.mGameInfo.GameState;
            this.mMapmgr.UpdateCheck();
            switch (this.mGameInfo.GameState) {
                case GameState.GameWait:
                    PlayerManager.Instance.HideAllTeamSign();
                    UIToast.Instance.ShowGameWait();
                    this.mUIMgr.OnGameWait();
                    break;
                case GameState.GameMatch:
                    PlayerManager.Instance.HideAllTeamSign();
                    AudioController.Instance.PlayTimeout();
                    this.mUIMgr.OnGameReady();
                    UIToast.Instance.ShowReadyCountDown(this.mGameInfo.GameMatchTime);
                    break;
                case GameState.GameStart:
                    this.mPlayer = this.mPlayerMgr.GetLocalPlayer();
                    this.mUIMgr.OnGameStart(this.mGameInfo, this.mGameRule, this.mPlayer);
                    AudioController.Instance.PlayStartGameBGM();
                    UIToast.Instance.ShowGameStart(this.mPlayer.isHunter, this.mGameRule.opendoorDelay);
                    this.mPlayerMgr.OnGameStart();
                    break;
                case GameState.ConfirmedModel:
                    this.mUIMgr.OnConfirmedModel();
                    break;
                case GameState.GameOver:
                    AudioController.Instance.PlayReadyBGM();
                    this.OnGameOver(this.mPlayerMgr.PlayerInfoMap);
                    break;
                case GameState.GameRoundOver:
                    AudioController.Instance.PlayReadyBGM();
                    this.mRoundResult = JSON.parse(this.mGameInfo.RoundResult);
                    this.mUIMgr.OnRoundOver(this.mRoundResult);
                    let myRoundScore = this.mPlayerMgr.GetMyRoundScore();
                    UIToast.Instance.ShowRoundResult(this.mRoundResult, this.mGameInfo.GameRound, this.mGameRule, myRoundScore);
                    this.mPlayerMgr.OnRoundOver();
                    // this.StartCoroutine(this.showTime());
                    break;
                case GameState.PeakMoment:
                    AudioController.Instance.PlayPeakBGM();
                    let isHunter = this.mPlayerMgr.GetLocalPlayer().isHunter;
                    this.mUIMgr.OnPeakMoment(this.mGameInfo.PeekHP, isHunter);
                    UIToast.Instance.ShowPeakMoment(this.mGameRule.peakMomentLength, this.mGameInfo.Elapsed);
                    this.mPlayerMgr.OnPeakMoment();
                    break;
            }
        }
    }

    // *showTime() {
    //     this.mRoundResult = JSON.parse(this.mGameInfo.RoundResult);
    //     if (!this.mRoundResult.isHunterWin) {
    //         let showtimeid = PlayerManager.Instance.GetShowTimeSessionID();
    //         if (showtimeid != "") {
    //             PlayerManager.Instance.WatchCamera(true, showtimeid);

    //             let showpanel = GameObject.Instantiate<GameObject>(PlayerManager.Instance.showTimePanel,
    //                 PlayerManager.Instance.GetCharacter(showtimeid).transform);

    //             yield new WaitForSeconds(3);
    //             GameObject.Destroy(showpanel);
    //         }
    //     }
    //     this.mUIMgr.OnRoundOver(this.mRoundResult);
    //     let myRoundScore = this.mPlayerMgr.GetMyRoundScore();
    //     UIToast.Instance.ShowRoundResult(this.mRoundResult, this.mGameInfo.GameRound, this.mGameRule, myRoundScore);
    //     this.mPlayerMgr.OnRoundOver();
    // }

    public SendEvent(eventName: sEventArg, message: any) {
        //console.log(`SendEvent : [${eventName}]  !!!`);
        if (this.mGameState == GameState.GameOver) return;
        const roomData = new RoomData();
        switch (eventName) {
            case sEventArg.BeAttacked:
                this.mNetMgr.SendEvent(eventName, message);
                break;
            case sEventArg.SwitchLight:
            case sEventArg.SwitchSuperLight:
                roomData.Add("state", message);
                roomData.Add("sid", this.mPlayerMgr.LocalPlayer.id);
                this.mNetMgr.SendEvent(eventName, roomData);
                break;

            case sEventArg.ChangeModel:
                roomData.Add("model", Number(message));
                this.mNetMgr.SendEvent(eventName, roomData);
                break;
            case sEventArg.OnShoot:
                // let data = this.mPlayerMgr.GetShootData();
                // if (data != null) {
                //     roomData.Add("shootData", data)
                //     this.mNetMgr.SendEvent(eventName, roomData);
                // }
                break;
            case sEventArg.UseBuff:
                roomData.Add("buff", message);
                this.mNetMgr.SendEvent(eventName, roomData);
                break;
            case sEventArg.PlayerJump:
                roomData.Add("sessionId", message)
                this.mNetMgr.SendEvent(eventName, roomData);
                break;
            default:
                // message = null or message = roomdata
                this.mNetMgr.SendEvent(eventName, message);
        }
    }

    /* Set LeaderBorad Score */

    OnGameOver(playerInfoMap: Map<number, sPlayerInfo>) {
        // 游戏结束后，保存游戏积分，中途退出的不得积分
        playerInfoMap.forEach((info, id) => {
            if (info.sessionId == this.mPlayerMgr.mSessionId) {
                this.SetScore(info.userId, info.score);
                console.log(`更新排行榜数据,本局找到${info.hunterSum}人,存活${info.liveSum}秒`);
            }
        })
        this.mUIMgr.OnGameOver();
        this.mPlayerMgr.OnGameOver();
        UIToast.Instance.ShowGameOver(playerInfoMap);
    }

    SetScore(userId: string, score: number) {

        LeaderboardAPI.GetRank(this.Leaderboard.WeekRank.id, [userId], this.Leaderboard.WeekRank.resetRule, false, (res) => {
            let prevScore = res.rankInfo.myRank.score;
            console.log("目前积分", prevScore, "最新积分", prevScore + score);
            this.mUIMgr.RefreshMySeasonScore(prevScore + score);
            LeaderboardAPI.SetScore(this.Leaderboard.WeekRank.id, prevScore + score, this.OnResult, this.OnError);
        });
    }

    OnResult(result: SetScoreResponse) {
        console.log(`保存排行榜功能成功: ${result.isSuccess}`);
    }

    OnError(error: string) {
        console.error("保存排行榜分数失败", error);
    }

    OnLeaderBoardReward(userId: string) {
        // LeaderboardAPI.GetRank(this.Leaderboard.WeekRank.id, [userId], this.Leaderboard.WeekRank.resetRule, true, (res) => {
        //     let rank = res.rankInfo.myRank.rank;
        //     let score = res.rankInfo.myRank.score;
        //     let totalRankCount = res.rankInfo.totalRankCount;
        //     console.log(`上赛季排名:${rank}, TotalRankCount:${totalRankCount}`);
        //     if (score > 0) {
        //         this.mNetMgr.SendReward(rank, totalRankCount);
        //     }
        //     this.mUIMgr.RefreshMySeasonScore(score);
        //     this.GetCurrentSeasonScore(userId);
        // });
    }

    GetCurrentSeasonScore(userId: string) {
        // LeaderboardAPI.GetRank(this.Leaderboard.WeekRank.id, [userId], this.Leaderboard.WeekRank.resetRule, false, (res) => {
        //     console.log("GetRank.myRank.score:", res.rankInfo.myRank.score);
        //     console.log("GetRank.myRank.rank:", res.rankInfo.myRank.rank);
        //     let score = res.rankInfo.myRank.score;
        //     this.mUIMgr.RefreshMySeasonScore(score);
        // });
    }

    /* Set LeaderBorad Score */

    public CheckGesture(gesture: number): boolean {
        return this.mPlayerMgr.CheckGesture(gesture);
    }

    // AudioController
    public PlayBGM(clip: AudioClip) {
        AudioController.Instance.PlayBGM(clip);
    }

    public PlayOneShot(clip: AudioClip) {
        AudioController.Instance.PlayOneShot(clip);
    }

    public PlayAtPoint(clip: AudioClip, point: Vector3) {
        AudioController.Instance.PlayAtPoint(clip, point);
    }

    // Config VO
    public GetStartPoint(index: number, gameState: number): any {
        return this.mConfigMgr.GetStartPoint(index, gameState);
    }

    public GetPlayerInfoVO(player: number): any {
        return this.mConfigMgr.GetPlayerInfoVO(player);
    }

    public Toast(msg: string, duration: number) {
        this.mUIMgr.Toast(msg, duration);
    }

    public GetModelInfoVO(name: string): any {
        return this.mConfigMgr.GetModelInfoVO(name);
    }

    public CheckCanChangeModel(cost: number): boolean {
        return this.mPlayerMgr.CheckCanChangeModel(cost);
    }
    public GetModelCost(): any {
        return this.mConfigMgr.GetModelCostVO();
    }

    public GetModelCostVOByCostId(costId: number): any {
        return this.mConfigMgr.GetModelCostVOByCostId(costId);
    }

}

export class GameRule {
    roundNumber: number;           // 游戏回合数  (- 表示新增）
    roundLength: number;           // 游戏时长=秒
    roundOverDelay: number;        // -回合结束等待延迟
    gameOverDelay: number;         // -游戏结束等待延迟
    peakMomentLength: number;      // 巅峰时长=秒
    minPlayer: number;             // 最低匹配人数
    maxPlayer: number;             // -最大匹配人数
    matchDelay: number;            // -匹配倒计时
    modelDelay: number;            // -道具延迟
    opendoorDelay: number;         // 开门延迟
    isTest: number;                // 自己一个人测试游戏流程，=1时，跳过gameover判断
    initHP: number;                // 初始化血量
    initBuf: number;               // 初始化Buf数量
    buffDuration: number;          // buf 持续时间
    buffCD: number;                // buf cd时间
    peekHP: number;                // 巅峰时刻 增加血量
    randomModelCost: number;       // 随机道具功能 花费星星能力数值
    addStarInerval: number;        // 躲藏者增加星星间隔
    hunterWinScore: number;        // 寻找者胜利积分
    hunterNumScore: number;        // 寻找者 找到1个人积分
    hiderWinScore: number;         // 躲藏者胜利积分
    hiderLiveScore: number;        // 躲藏着 生存秒数积分
}