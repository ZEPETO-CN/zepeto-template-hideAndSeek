import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World'
import { Room, RoomData, RoomErrorEvent, RoomLeaveEvent } from 'ZEPETO.Multiplay'
import GameMain from '../GameMain'

export enum sEventArg {
    GameRule = "GameRule",
    PlayerChange = "PlayerChange",
    PlayerMove = "PlayerMove",
    PlayerJump = "PlayerJump",
    PlayerInfoSync = "PlayerInfoSync",
    ClientReady = "ClientReady",
    GameUpdate = "GameUpdate",  // 心跳 5秒
    ChangeModel = "ChangeModel", // 躲藏着更换模型：桌椅等
    BeAttacked = "BeAttacked",
    BeScan = "BeScan", //被扫描到
    OnShoot = "OnShoot",
    UseBuff = "UseBuff",
    PlayerDie = "PlayerDie",
    RandomModel = "RandomModel",
    SwitchLight = "SwitchLight",
    SwitchSuperLight = "SwitchSuperLight",
    RoomStateDelayTest = "RoomStateDelayTest",
    MessageDelayTest = "MessageDelayTest",
    SyncRankReward = "SyncRankReward",
    RequestRankRewardEvent = "RequestRankReward",
    DailyTaskInfoUpdate = "DailyTaskInfoUpdate",
    RequestDailyTaskReward = "RequestDailyTaskReward",
    RequestDailyReward = "RequestDailyReward",
    SyncDailyReward = "SyncDailyReward",
    SyncWeekActivity = "SyncWeekActivity",
    ClaimWeekActivityReward = "ClaimWeekActivityReward",
    DynamicMapChange = "DynamicMapChange",
    QuickMessage = "QuickMessage",
    SyncStarRewardInfo = "SyncStarRewardInfo",
    ExchangeStarReward = "ExchangeStarReward",
    ReceiveStarReward = "ReceiveStarReward",
    ClaimSeasonReward = "ClaimSeasonReward",
    SyncSeasonInfo = "SyncSeasonInfo",
    SyncSeasonReward = "SyncSeasonReward",
}

export enum GameState {
    None = -1,
    GameWait = 0,                   // 刚进入游戏等待状态
    GameOver = 1,                   // 本局游戏结束状态
    GameRoundOver = 2,              // 小回合结束状态
    GameMatch = 3,                  // 游戏匹配状态
    GameStart = 4,                  // 游戏开始状态
    ConfirmedModel = 5,             // 确定模型
    OpenDoor = 6,                   // 游戏开门状态
    PeakMoment = 7,                 // 巅峰时刻状态
}

// NetManager 负责管理网络数据，仅负责数据的发送和接受，不负责处理业务逻辑
// 当收到信息后，上报给上级
// 定义所有服务器事件， 通过Room发送给server

export default class NetManager extends ZepetoScriptBehaviour {



    private mMultiplay: ZepetoWorldMultiplay;
    private mRoom: Room;

    private mElapsedTime: number;

    /* Singleton */

    private static _instance: NetManager;
    public static get Instance(): NetManager {
        return NetManager._instance;
    }


    Awake() {
        NetManager._instance = this;
        this.mMultiplay = this.gameObject.GetComponent<ZepetoWorldMultiplay>();
        if (this.mMultiplay == null) {
            this.mMultiplay = this.gameObject.AddComponent<ZepetoWorldMultiplay>();
        }
    }

    Start() {
        this.mMultiplay.RoomCreated += this.OnRoomCreated;
        this.mMultiplay.RoomJoined += this.OnRoomJoined;
        this.mMultiplay.RoomError += this.OnRoomError;
        this.mMultiplay.RoomLeave += this.OnRoomLeave;
    }

    OnDestroy() {
        if (this.mRoom.IsConnected) {
            this.mRoom.Leave(true);
            console.error("room Leave!");
        }
    }

    private OnRoomCreated(room: Room) {
        this.mRoom = room;
        this.BindServerEvent();
        console.log("OnRoomCreated!");
    }

    private OnRoomJoined(room: Room) {

        let gameInfo = this.mRoom.State.gameInfo;
        gameInfo.OnChange += (changeValues) => {
            this.OnReceiveEvent(sEventArg.GameUpdate, this.mRoom.State.gameInfo);
        }

        let playerChange = this.mRoom.State.playerChange;
        playerChange.OnChange += (changeValues) => {
            console.log("PlayerChange!");
            this.OnReceiveEvent(sEventArg.PlayerChange, this.mRoom.State.players);

        }

        this.mRoom.State.dynamicMaps.OnChange += (changeValues) => {
            this.OnReceiveEvent(sEventArg.DynamicMapChange, this.mRoom.State.dynamicMaps);
        }

        this.OnReceiveEvent(sEventArg.DynamicMapChange, this.mRoom.State.dynamicMaps);

        GameMain.Instance.InitRoomSessionId(this.mRoom.SessionId);
        console.log(`OnRoomJoined! , sessionId = ${this.mRoom.SessionId}`);
    }

    private OnRoomError(error: RoomErrorEvent) {
        // todo 
        console.error(error.Message);
    }

    private OnRoomLeave(leave: RoomLeaveEvent) {
        // todo
        // 离开房间后停止发送数据
        this.mRoom = null;
        console.warn("OnRoomLeave!")
    }



    /* 绑定事件 */
    private BindServerEvent() {

        // this.mRoom.AddMessageHandler<string>(sEventArg.MessageDelayTest, message => {
        //     this.OnMsgDelayTest();
        // });

        this.mRoom.AddMessageHandler<string>(sEventArg.GameRule, message => {
            this.OnReceiveEvent(sEventArg.GameRule, message);
        });

        this.mRoom.AddMessageHandler(sEventArg.PlayerMove, message => {
            this.OnReceiveEvent(sEventArg.PlayerMove, message);
        });

        this.mRoom.AddMessageHandler<string>(sEventArg.PlayerInfoSync, message => {
            this.OnReceiveEvent(sEventArg.PlayerInfoSync, message);
        });

        this.mRoom.AddMessageHandler<string>(sEventArg.PlayerJump, message => {
            this.OnReceiveEvent(sEventArg.PlayerJump, message);
        });

        this.mRoom.AddMessageHandler<string>(sEventArg.OnShoot, message => {
            this.OnReceiveEvent(sEventArg.OnShoot, message);
        });
        this.mRoom.AddMessageHandler<string>(sEventArg.SwitchLight, message => {
            this.OnReceiveEvent(sEventArg.SwitchLight, message);
        });
        this.mRoom.AddMessageHandler<string>(sEventArg.SwitchSuperLight, message => {
            this.OnReceiveEvent(sEventArg.SwitchSuperLight, message);
        });
        this.mRoom.AddMessageHandler<string>(sEventArg.BeAttacked, message => {
            this.OnReceiveEvent(sEventArg.BeAttacked, message);
        });

        this.mRoom.AddMessageHandler<number>(sEventArg.RandomModel, message => {
            this.OnReceiveEvent(sEventArg.RandomModel, message);
        });

        this.mRoom.AddMessageHandler<string>(sEventArg.PlayerDie, message => {
            this.OnReceiveEvent(sEventArg.PlayerDie, message);
        });

        this.mRoom.AddMessageHandler(sEventArg.BeScan, message => {
            this.OnReceiveEvent(sEventArg.BeScan, message);
        });

        this.mRoom.AddMessageHandler(sEventArg.SyncRankReward, message => {
            this.OnReceiveEvent(sEventArg.SyncRankReward, message);
        });

        this.mRoom.AddMessageHandler(sEventArg.SyncDailyReward, message => {
            this.OnReceiveEvent(sEventArg.SyncDailyReward, message);
        });

        this.mRoom.AddMessageHandler(sEventArg.SyncWeekActivity, message => {
            this.OnReceiveEvent(sEventArg.SyncWeekActivity, message);
        });

        this.mRoom.AddMessageHandler(sEventArg.QuickMessage, message => {
            this.OnReceiveEvent(sEventArg.QuickMessage, message);
        });

        this.mRoom.AddMessageHandler(sEventArg.SyncStarRewardInfo, message => {
            this.OnReceiveEvent(sEventArg.SyncStarRewardInfo, message);
        });

        this.mRoom.AddMessageHandler(sEventArg.ReceiveStarReward, message => {
            this.OnReceiveEvent(sEventArg.ReceiveStarReward, message);
        });

        this.mRoom.AddMessageHandler(sEventArg.SyncSeasonInfo, message => {
            this.OnReceiveEvent(sEventArg.SyncSeasonInfo, message);
        });

        this.mRoom.AddMessageHandler(sEventArg.SyncSeasonReward, message => {
            this.OnReceiveEvent(sEventArg.SyncSeasonReward, message);
        });
    }

    private OnReceiveEvent(eventName: sEventArg, message: any) {
        GameMain.Instance.HandleEvent(eventName, message);
    }


    /* public API */
    public GetRoomElapsedTime(): number {
        return this.mElapsedTime;
    }

    private mEmptyData = new RoomData();
    public SendEvent(eventName: string, data: RoomData) {

        if (data == null) {
            data = this.mEmptyData;
        }

        if (this.mRoom && this.mRoom.IsConnected) {
            this.mRoom.Send(eventName, data.GetObject());
        }
        else {
            console.error("[SendEvent] room unconnected");
            // todo  缓存data ， some event 恢复网络后重发
        }
    }

    public SendReward(rank: number, totalRank) {
        if (this.mRoom && this.mRoom.IsConnected) {
            this.mRoom.Send(sEventArg.RequestRankRewardEvent, [rank, totalRank]);
        }
        else {
            console.error("[requestRankReward] room unconnected");
        }
    }
}