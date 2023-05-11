export const enum sEventArg {
    GameRule = "GameRule",
    PlayerMove = "PlayerMove",
    PlayerJump = "PlayerJump",
    PlayerChange = "PlayerChange",
    PlayerInfoSync = "PlayerInfoSync",
    ClientReady = "ClientReady",
    GameUpdate = "GameUpdate",
    ChangeModel = "ChangeModel",
    BeAttacked = "BeAttacked",
    OnShoot = "OnShoot",
    UseBuff = "UseBuff",
    PlayerDie = "PlayerDie",
    RandomModel = "RandomModel",
    SwitchLight = "SwitchLight",
    SwitchSuperLight = "SwitchSuperLight",
    RoomStateDelayTest = "RoomStateDelayTest",
    MessageDelayTest = "MessageDelayTest",
    BeScan = "BeScan",
    QuickMessage = "QuickMessage"
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
    peekHP: number;                // 巅峰时刻 增加血量
    randomModelCost: number;       // 随机道具功能 花费星星能力数值 
    addStarInerval: number;        // 躲藏者增加星星间隔
    hunterNumStar: number;         // 寻找者找到人增加星星数值
    hunterWinScore: number;        // 寻找者胜利积分
    hunterNumScore: number;        // 寻找者 找到1个人积分
    hiderWinScore: number;         // 躲藏者胜利积分
    hiderLiveScore: number;        // 躲藏着 生存秒数积分
}

export const enum GameState {
    GameWait = 0,                   // 刚进入游戏等待状态
    GameOver = 1,                   // 本局游戏结束状态
    GameRoundOver = 2,              // 小回合结束状态
    GameMatch = 3,                  // 游戏匹配状态
    GameStart = 4,                  // 游戏开始状态
    ConfirmedModel = 5,             // 确定模型
    OpenDoor = 6,                   // 游戏开门状态
    PeakMoment = 7,                 // 巅峰时刻状态
}

export const enum PlayerRole {
    Free = 1,
    Hunter = 2,
    Hider = 3
}

export default class ServerData {

    static DATA_STORAGE_PLAYER_STAR = "STAR"

    static DEF_MODEL = 99;              // 默认模型ID
    static DEF_DIE_MODEL = 100;              // 默认模型ID

    static SUCCESS_CODE = 200;

    static GAME_HEART_RATE = 5;         // 心跳间隔

    static GAME_HEART_MAX_WAIT = 10;    // 心跳超时 50秒

    // 阵营分配
    static GetHinderNum(playerNum: number): number {
        let hiderNum: number = 3;
        switch (playerNum) {
            case 2:
                hiderNum = 1;
                break;
            case 6:
                hiderNum = 4;
                break;
            case 7:
            case 8:
                hiderNum = 5;
                break;
            case 9:
                hiderNum = 6;
                break;
            case 10:
            case 11:
                hiderNum = 7;
                break;
            case 12:
                hiderNum = 8;
                break;
            case 13:
            case 14:
                hiderNum = 9
                break;
            case 15:
            case 16:
                hiderNum = 10;
                break;
        }
        return hiderNum;
    }


    static GAME_RULE_JSON = "{\n" +
        "    \"roundNumber\":3,\n" +
        "    \"roundLength\":300,\n" +
        "    \"roundOverDelay\":8,\n" +
        "    \"gameOverDelay\":10,\n" +
        "    \"peakMomentLength\":60,\n" +
        "    \"minPlayer\":4,\n" +
        "    \"maxPlayer\":12,\n" +
        "    \"isTest\":0,\n" +
        "    \"matchDelay\":30,\n" +
        "    \"modelDelay\":30,\n" +
        "    \"opendoorDelay\":30,\n" +
        "    \"initHP\":150,\n" +
        "    \"initBuf\":2,\n" +
        "    \"buffCD\":20,\n" +
        "    \"peekHP\":100,\n" +
        "    \"randomModelCost\":30,\n" +
        "    \"buffDuration\":5,\n" +
        "    \"hunterWinScore\":200,\n" +
        "    \"hunterNumScore\":300,\n" +
        "    \"hiderLiveScore\":2,\n" +
        "    \"hiderWinScore\":100,\n" +
        "    \"hunterNumStar\":1,\n" +
        "    \"addStarInerval\":120\n" +
        "}";

    static GAME_START_POINT_JSON = "{\"idle\":[{\"pos\":{\"x\":-709,\"y\":-229,\"z\":1453}},{\"pos\":{\"x\":-831,\"y\":-229,\"z\":1447}},{\"pos\":{\"x\":-1089,\"y\":-229,\"z\":1433}},{\"pos\":{\"x\":-1093,\"y\":-229,\"z\":1154}},{\"pos\":{\"x\":-814,\"y\":-229,\"z\":1147}},{\"pos\":{\"x\":-629,\"y\":-229,\"z\":1142}},{\"pos\":{\"x\":-937,\"y\":-229,\"z\":722}},{\"pos\":{\"x\":-1451,\"y\":-229,\"z\":976}},{\"pos\":{\"x\":-808,\"y\":3,\"z\":-581}},{\"pos\":{\"x\":-504,\"y\":3,\"z\":-576}},{\"pos\":{\"x\":-263,\"y\":3,\"z\":-575}},{\"pos\":{\"x\":12,\"y\":3,\"z\":-575}},{\"pos\":{\"x\":233,\"y\":3,\"z\":-573}},{\"pos\":{\"x\":333,\"y\":3,\"z\":-572}},{\"pos\":{\"x\":622,\"y\":3,\"z\":-569}},{\"pos\":{\"x\":892,\"y\":3,\"z\":-565}},{\"pos\":{\"x\":1195,\"y\":3,\"z\":-562}},{\"pos\":{\"x\":1494,\"y\":3,\"z\":-559}}],\"hunter\":[{\"pos\":{\"x\":-1036,\"y\":-229,\"z\":1911}},{\"pos\":{\"x\":-739,\"y\":-229,\"z\":1930}},{\"pos\":{\"x\":-603,\"y\":-229,\"z\":2086}},{\"pos\":{\"x\":-742,\"y\":-229,\"z\":2087}},{\"pos\":{\"x\":-1025,\"y\":-229,\"z\":2103}},{\"pos\":{\"x\":-1019,\"y\":-229,\"z\":2223}}],\"hider\":[{\"pos\":{\"x\":-1081,\"y\":-229,\"z\":1126}},{\"pos\":{\"x\":-818,\"y\":-229,\"z\":1121}},{\"pos\":{\"x\":-620,\"y\":-229,\"z\":1118}},{\"pos\":{\"x\":-699,\"y\":-229,\"z\":1473}},{\"pos\":{\"x\":-885,\"y\":-229,\"z\":1480}},{\"pos\":{\"x\":-938,\"y\":3,\"z\":-513}},{\"pos\":{\"x\":-678,\"y\":3,\"z\":-589}},{\"pos\":{\"x\":-344,\"y\":3,\"z\":-579}},{\"pos\":{\"x\":558,\"y\":3,\"z\":-585}},{\"pos\":{\"x\":1022,\"y\":3,\"z\":-612}}]}"
}