import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";
import { sPlayer, sPlayerInfo, sGameInfo, sRoundResult } from "ZEPETO.Multiplay.Schema";
import { DataStorage } from "ZEPETO.Multiplay.DataStorage";
import ServerData, { sEventArg, GameState, PlayerRole, GameRule } from "./ServerData";
import { ItemWeight, ItemWeightMap } from "./ItemWeight";
import ServerMap from "./ServerMap";

export default class extends Sandbox {

    // 用来保存数据
    private mSandboxPlayerMap: Map<string, SandboxPlayer> = new Map<string, SandboxPlayer>();
    // 保存玩家信息数据
    private mPlayerInfoMap: Map<number, sPlayerInfo> = new Map<number, sPlayerInfo>();
    // 保存玩家buf数据
    private mBuffSeesionMap: Map<number, number> = new Map<number, number>();
    // Id Pool
    private mCount: boolean[] = new Array(100);
    private mGameHeartTimer: number = 0;

    private mGameRule: GameRule;
    private mSpawnVO: any;         // 查看 serverData GAME_START_POINT_JSON
    private mRoundResult: sRoundResult = new sRoundResult();

    private PLAYER_STAR: string = ServerData.DATA_STORAGE_PLAYER_STAR;
    private DEF_MODEL: number = ServerData.DEF_MODEL;
    private GAME_HEART_RATE: number = ServerData.GAME_HEART_RATE;
    private GAME_HEART_MAX_WAIT: number = ServerData.GAME_HEART_MAX_WAIT;
    // private readonly SuccessCode : number = ServerData.SUCCESS_CODE;

    /* gameInfo */
    private mGameInfo: sGameInfo = null;
    private TotalWeight: number = 0;
    private itemWeightMapData: ItemWeightMap;

    private TotalWeight_star: number = 0;
    private itemWeightMapData_star: Map<number, ItemWeight> = new Map<number, ItemWeight>();

    private mMaps: ServerMap;

    onCreate(options: SandboxOptions) {

        // 移动 帧同步 
        this.onMessage(sEventArg.PlayerMove, (client: SandboxPlayer, message) => {
            this.broadcast(sEventArg.PlayerMove, message);
        });

        // 跳跃
        this.onMessage(sEventArg.PlayerJump, (client: SandboxPlayer, message) => {
            this.broadcast(sEventArg.PlayerJump, message.sessionId);
        });

        // 玩家信息
        this.onMessage(sEventArg.PlayerInfoSync, (client: SandboxPlayer, message) => {
            this.BroadcastPlayerInfoMap();
        })

        // 心跳
        this.onMessage(sEventArg.GameUpdate, (client: SandboxPlayer, message) => {
            const player = this.state.players.get(client.sessionId);
            player.heartCount -= 1;
        })

        // 客户端准备就绪
        this.onMessage(sEventArg.ClientReady, (client: SandboxPlayer, message) => {
            const player = this.state.players.get(client.sessionId);
            const playerInfo = this.mPlayerInfoMap.get(player.id);
            playerInfo.isReady = true;
            playerInfo.nickName = message.nickName;
            console.log("ClientReady!!!!", playerInfo.nickName);
            this.BroadcastPlayerInfoMap();
            this.onMatch();
        })

        // 模型变身
        this.onMessage(sEventArg.ChangeModel, (client: SandboxPlayer, message) => {
            const player = this.state.players.get(client.sessionId);
            switch (this.mGameInfo.GameState) {
                case GameState.GameWait:
                    player.model = message.model;
                    console.log("ChangeModel " + message.model, " -- GameWait");
                    break;
                case GameState.GameMatch:
                    if (this.mGameInfo.GameMatchTime > 1) {
                        player.model = message.model;
                        console.log("ChangeModel", " -- GameMatch");
                    }
                    break;
                case GameState.GameStart:
                case GameState.ConfirmedModel:
                    if (!player.isHunter) {
                        player.model = player.targetModel;
                        console.log("ChangeModel", " -- ConfirmedModel");
                    }
                    break;
            }
        })

        // 随机模型
        this.onMessage(sEventArg.RandomModel, (client: SandboxPlayer, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player.star > this.mGameRule.randomModelCost) {
                player.star -= this.mGameRule.randomModelCost;
                player.targetModel = this.GetRandomItemIDWithStar();  // call API- renyi

                client.send(sEventArg.RandomModel, player.targetModel) // 200 = success
            }
        })

        // 射击
        this.onMessage(sEventArg.OnShoot, (client: SandboxPlayer, message) => {
            //console.log("OnShoot!" + message.shootData);
            this.broadcast(sEventArg.OnShoot, message.shootData);
        })
        // Buff
        this.onMessage(sEventArg.UseBuff, (client: SandboxPlayer, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player.buffNum > 0 && player.buff == 0) {
                player.buffNum--;
                player.buff = message.buff;
                this.mBuffSeesionMap.set(player.id, this.mGameRule.buffDuration);
            }
        })

        // 受伤
        this.onMessage(sEventArg.BeAttacked, (client: SandboxPlayer, message) => {
            this.onBeAttacked(message);
        })
        //手电开关
        this.onMessage(sEventArg.SwitchLight, (client: SandboxPlayer, message) => {
            this.broadcast(sEventArg.SwitchLight, message.sid + "|" + message.state);
        })
        this.onMessage(sEventArg.SwitchSuperLight, (client: SandboxPlayer, message) => {
            this.broadcast(sEventArg.SwitchSuperLight, message.sid + "|" + message.state);
        })
        //被扫描到
        this.onMessage(sEventArg.BeScan, (client: SandboxPlayer, message) => {
            this.broadcast(sEventArg.BeScan, message, { except: client });
        })
        //发送快捷消息
        this.onMessage(sEventArg.QuickMessage, (client: SandboxPlayer, message) => {
            let data = { name: message.name, type: message.type, id: message.id, group: message.group };
            this.broadcast(sEventArg.QuickMessage, data);
        })

        this.onInitGame();

        this.mMaps = new ServerMap();
        this.mMaps.onCreate(this);

    }

    //从ItemWeight中随机出具体ITEM id
    GetRandomItemID(): number {
        let ranVel = Math.round((this.TotalWeight - 1) * Math.random());
        for (let entry of this.itemWeightMapData.data.entries()) {
            ranVel -= entry[1].weight;
            if (ranVel <= 0) {
                return entry[0];
            }
        }
        return -1;//出错，不存在的ID
    }
    GetRandomItemIDWithStar(): number {
        let ranVel = Math.round((this.TotalWeight_star - 1) * Math.random());
        for (let entry of this.itemWeightMapData_star.entries()) {
            ranVel -= entry[1].weight;
            if (ranVel <= 0) {
                return entry[0];
            }
        }
        return -1;//出错，不存在的ID
    }

    // 游戏初始化操作
    onInitGame() {
        this.mGameInfo = this.state.gameInfo;
        this.mGameInfo.GameState = GameState.GameWait;
        this.mGameInfo.PeekHP = 0;
        this.mGameInfo.Elapsed = 0;
        this.mGameInfo.GameLeftTime = 0;
        this.mGameInfo.HunterNum = 0;
        this.mGameInfo.HiderNum = 0;
        this.mGameInfo.GameRound = 0;

        this.state.playerChange.playerNumber = 0;

        for (var i = 0; i < this.mCount.length; i++) this.mCount[i] = true;

        // 暂时不支持 JSON文件加载，所以无法分离成文件
        // this.mGameRule = require("./GameRuleJson.json");
        // this.mSpawnVO = require("./GameStartPointJson.json");
        this.mGameRule = JSON.parse(ServerData.GAME_RULE_JSON);
        this.mSpawnVO = JSON.parse(ServerData.GAME_START_POINT_JSON);
        console.log("游戏最少人数：", this.mGameRule.minPlayer);

        //数据表格加载
        this.TotalWeight = 0;
        this.itemWeightMapData = new ItemWeightMap();
        this.TotalWeight_star = 0;

        for (let entry of this.itemWeightMapData.data.entries()) {
            this.TotalWeight += entry[1].weight;
            if (entry[1].star > 0) {
                this.TotalWeight_star += entry[1].weight;
                this.itemWeightMapData_star.set(entry[0], entry[1]);
            }
        }
    }

    // 广播用户信息
    BroadcastPlayerInfoMap() {
        let mapJson = JSON.stringify(this.Map2Obj(this.mPlayerInfoMap));
        //console.warn(mapJson);
        // 广播给所有用户
        this.broadcast(sEventArg.PlayerInfoSync, mapJson);
    }

    // ！！！ 需要特别注意，添加一个空对象
    Map2Obj(strMap: Map<number, sPlayerInfo>): Object {
        let temp = new sPlayerInfo();
        const obj = { 0: temp };
        strMap.forEach((item, key, strMap) => {
            obj[key as keyof typeof obj] = item;
        })
        return obj;
    }

    // 获取索引
    GetIndex(): number {
        for (var i = 1; i < this.mCount.length; i++) {
            if (this.mCount[i]) {
                this.mCount[i] = false;
                return i;
                break;
            }
        }
    }

    createPlayer(): sPlayer {
        const player: sPlayer = new sPlayer();
        player.id = this.GetIndex();
        this.initPlayer(player);
        return player;
    }

    initPlayer(player: sPlayer) {
        player.targetModel = this.DEF_MODEL;
        player.model = this.DEF_MODEL;
        player.buffNum = 0;
        player.buff = 0;
        player.isHunter = false;
        player.HP = 0;
        player.heartCount = 0;
    }

    createPlayerInfo(): sPlayerInfo {
        const playerInfo = new sPlayerInfo();
        this.initPlayerInfo(playerInfo);
        return playerInfo;
    }

    initPlayerInfo(playerInfo: sPlayerInfo) {
        playerInfo.hunterNum = 0;
        playerInfo.hunterSum = 0;
        playerInfo.liveTime = 0;
        playerInfo.liveSum = 0;
        playerInfo.score = 0;
        playerInfo.playTimeSum = 0;
        playerInfo.hiderWinSum = 0;
        playerInfo.hunterWinSum = 0;
    }

    // 初始化玩家位置
    onSetPostion(player: sPlayer, playerRole: PlayerRole) {
        let index = (player.id - 1);
        console.log(this.mSpawnVO.idle.length, this.mSpawnVO.hunter.length, this.mSpawnVO.hider.length)
        let pos = null;
        switch (playerRole) {
            case PlayerRole.Free:
                index %= this.mSpawnVO.idle.length;
                pos = this.mSpawnVO.idle[index].pos;
                break;
            case PlayerRole.Hunter:
                index %= this.mSpawnVO.hunter.length;
                pos = this.mSpawnVO.hunter[index].pos;
                break;
            case PlayerRole.Hider:
                index %= this.mSpawnVO.hider.length;
                pos = this.mSpawnVO.hider[index].pos;
                break;
        }
        player.position.x = pos.x;
        player.position.y = pos.y;
        player.position.z = pos.z;
    }

    // 玩家加入房间
    async onJoin(client: SandboxPlayer) {
        let player = this.createPlayer();
        // 获取星值
        const playerStorage: DataStorage = client.loadDataStorage();
        let playerStar = await playerStorage.get<number>(this.PLAYER_STAR);
        if (playerStar == null) {
            playerStar = 0;
            await playerStorage.set<number>(this.PLAYER_STAR, 0);
        }

        if (playerStar < 0) playerStar = 0;
        player.star = playerStar;

        let playerInfo = this.createPlayerInfo();
        playerInfo.userId = client.userId;
        playerInfo.sessionId = client.sessionId;

        this.onSetPostion(player, PlayerRole.Free);

        this.state.players.set(client.sessionId, player);

        this.mPlayerInfoMap.set(player.id, playerInfo);
        this.mSandboxPlayerMap.set(client.sessionId, client);

        this.BroadcastPlayerInfoMap();

        console.log("OnJoin!!!!!" + " - " + player.id + " - " + client.userId);
        console.log("玩家初始星星值", player.star);
        this.state.playerChange.playerNumber++;
        client.send(sEventArg.GameRule, ServerData.GAME_RULE_JSON);
    }

    // 玩家离开
    onLeave(client: SandboxPlayer, consented?: boolean) {
        this.onTimeoutLeave(client.sessionId);
    }

    // 获取时间
    getSandboxTime() {
        return Date.now();
    }

    // 帧检测 每秒10次
    // deltaTime -> 110ms , FPS -> 10
    onTick(deltaTime: number) {
        this.onUpdateElapsed(deltaTime);
        this.onUpdateGame(deltaTime);
        this.onGameHeartUpdate(deltaTime);
    }

    async SavePlayerStar(sessionId: string) {
        let player = this.state.players.get(sessionId);
        let client = this.mSandboxPlayerMap.get(sessionId);

        const playerStorage: DataStorage = client.loadDataStorage();
        await playerStorage.set<number>(this.PLAYER_STAR, player.star);

        console.log("保存星星数值成功", player.star, sessionId);
    }

    // 心跳超时
    async onTimeoutLeave(sessionId: string) {
        if (this.state.players.has(sessionId)) {

            let player = this.state.players.get(sessionId);
            this.SavePlayerStar(sessionId);

            console.log("player leave", player.id);

            if (this.mGameInfo.GameState >= GameState.GameStart) {
                // 游戏玩家退出
                if (player.isHunter) {
                    this.mGameInfo.HunterNum--;
                } else {
                    if (player.HP > 0) {
                        this.mGameInfo.HiderNum--;
                    }
                }
            }

            this.state.players.delete(sessionId);
            this.mPlayerInfoMap.delete(player.id);
            this.mSandboxPlayerMap.delete(sessionId);
            if (this.mBuffSeesionMap.get(player.id)) this.mBuffSeesionMap.delete(player.id);

            this.BroadcastPlayerInfoMap();
            this.mCount[player.id] = true;
            this.state.playerChange.playerNumber--;
        }
    }

    /**
     * @description: 匹配条件检测， 玩家准备好后触发
     */
    onMatch() {
        // 1. 人数 > 最小游戏人数 立即开始
        if (this.mGameInfo.GameState >= GameState.GameStart) return;

        var readyNumber = 0;
        this.mPlayerInfoMap.forEach((v: sPlayerInfo, k: number) => {
            if (v.isReady) {
                readyNumber++;
            }
        });

        if (this.mGameInfo.GameState != GameState.GameMatch) {
            if (readyNumber >= this.mGameRule.minPlayer) {
                this.mTimer = 0;
                this.mGameInfo.GameMatchTime = this.mGameRule.matchDelay;
                this.mGameInfo.GameState = GameState.GameMatch;
                console.log("进入游戏匹配等待");
            }
        } else {
            if (readyNumber >= this.mGameRule.maxPlayer) {
                this.onMatchConfirm();
            } else if (readyNumber < this.mGameRule.minPlayer) {
                this.onMatchConfirm();
            }
        }
    }

    async onMatchConfirm() {
        var readyNumber = this.mPlayerInfoMap.size;
        if (readyNumber >= this.mGameRule.minPlayer) {
            this.onStartGame();
            await this.lock();
        } else {
            this.mGameInfo.GameState = GameState.GameWait;
        }
    }

    // 开始游戏
    onStartGame() {
        this.mRoundResult.isHunterWin = false;
        this.mRoundResult.hiderId = "";
        this.mRoundResult.hunterId = "";
        this.mRoundResult.liveTime = -1;
        this.mRoundResult.hunterNum = -1;
        this.mRoundResult.bestScore = 0;

        this.mGameInfo.GameRound++;

        this.mGameInfo.GameLeftTime = this.mGameRule.roundLength;
        this.mGameInfo.PeekHP = this.mGameRule.peekHP;
        this.mGameInfo.RoundResult = "";

        this.onMatchTeam();
        this.mGameInfo.GameState = GameState.GameStart;
    }

    // 匹配阵营
    onMatchTeam() {
        console.log("阵营匹配!!!!");
        let isHiderArray = this.onRandomHiderArray();
        let i = 0;

        // todo
        this.state.players.forEach((player: sPlayer, k: string) => {
            this.initPlayer(player);
            let playerInfo = this.mPlayerInfoMap.get(player.id);
            playerInfo.hunterNum = 0;
            playerInfo.liveTime = this.mGameRule.roundLength;

            if (!isHiderArray[i]) {
                player.isHunter = true;
            } else {
                player.HP = this.mGameRule.initHP;
                player.buffNum = this.mGameRule.initBuf;
                player.buff = 0;
            }
            player.model = this.DEF_MODEL;
            player.targetModel = this.GetRandomItemID();         // call api - renyi
            this.onSetPostion(player, player.isHunter ? PlayerRole.Hunter : PlayerRole.Hider);
            i++;
        })
    }
    // 算法，随机一个index, 后面x个为寻找者
    onRandomHiderArray(): boolean[] {
        let playerSize: number = this.mPlayerInfoMap.size;
        let hiderNumber: number = ServerData.GetHinderNum(playerSize);
        let hunterNumber: number = playerSize - hiderNumber;

        // if (hunterNumber < 0) hunterNumber = 1;    // 至少一个hunter

        console.log("hiderNumber", hiderNumber, "||hunterNubmer", hunterNumber);

        let value_a = Math.random() * (playerSize) + "";
        let random_index = parseInt(value_a);

        this.mGameInfo.HunterNum = hunterNumber;
        this.mGameInfo.HiderNum = hiderNumber;

        let isHiderArray: boolean[] = new Array(playerSize);
        for (var i = 0; i < playerSize; i++) {
            isHiderArray[i] = true;
        }

        for (var i = 0; i < hunterNumber; i++) {
            let index = (random_index + i) % playerSize;
            isHiderArray[index] = false;
        }

        for (var i = 0; i < playerSize; i++) {
            console.log(isHiderArray[i]);
        }
        return isHiderArray;
    }

    // 游戏更新
    onUpdateGame(deltaTime: number) {
        deltaTime = deltaTime * 0.001; // 转秒

        switch (this.mGameInfo.GameState) {
            case GameState.GameRoundOver:
            case GameState.GameOver:
                this.onCheckGameOver(deltaTime);
                break;
            case GameState.GameMatch:
                this.onUpdateMatch(deltaTime);
                break;
            case GameState.GameStart:
                this.onUpdateTargetModel(deltaTime);
                this.onCheckOpenDoor();
                break;
            case GameState.ConfirmedModel:
                this.onCheckOpenDoor();
                break;
        }

        if (this.mGameInfo.GameState >= GameState.GameStart) {

            this.onUpdateBuf(deltaTime);

            this.onAddStar(deltaTime);

            this.onCheckPeakMoment();

            this.onCheckRoundOver();
        }
    }

    private mTimer: number = 0;
    onUpdateMatch(deltaTime: number) {
        this.mTimer += deltaTime;
        if (this.mTimer > 1) {
            this.mGameInfo.GameMatchTime--;
            this.mTimer--;
            if (this.mGameInfo.GameMatchTime <= 0) {
                this.onMatchConfirm();
            }
        }
    }

    onUpdateTargetModel(deltaTime: number) {
        this.mTimer += deltaTime;
        if (this.mTimer > this.mGameRule.modelDelay) {
            this.mTimer = 0;
            this.mGameInfo.GameState = GameState.ConfirmedModel;
            this.state.players.forEach((player: sPlayer, k: string) => {
                if (!player.isHunter) {
                    player.model = player.targetModel;
                }
            })
        }
    }

    private mElapsed: number = 0;
    onUpdateElapsed(deltaTime: number) {
        this.mElapsed += deltaTime * 0.001;
        if (this.mElapsed > 1) {
            this.mGameInfo.Elapsed++;
            this.mElapsed--;

            if (this.mGameInfo.GameState >= GameState.GameStart) {
                this.mGameInfo.GameLeftTime--;
            }
        }
    }

    onGameHeartUpdate(deltaTime: number) {
        this.mGameHeartTimer += deltaTime * 0.001;
        if (this.mGameHeartTimer > this.GAME_HEART_RATE) {
            this.mGameHeartTimer -= this.GAME_HEART_RATE;

            this.state.players.forEach((player: sPlayer, k: string) => {
                player.heartCount++;
                if (player.heartCount > this.GAME_HEART_MAX_WAIT) {
                    this.onTimeoutLeave(k);
                    console.log("心跳超时 剔除玩家", k);
                }
            })
        }
    }

    private mStarTime: number = 0;
    onAddStar(deltaTime: number) {
        this.mStarTime += deltaTime;
        if (this.mStarTime >= this.mGameRule.addStarInerval) {
            console.log("增加星星数值", this.mGameRule.addStarInerval);
            this.mStarTime = 0;
            this.state.players.forEach((v: sPlayer, k: string) => {
                if (!v.isHunter && v.HP > 0) {
                    v.star++;
                }
            });
        }
    }

    onUpdateBuf(deltaTime: number) {
        this.state.players.forEach((v: sPlayer, k: string) => {
            if (v.buff != 0) {
                let duration = this.mBuffSeesionMap.get(v.id);
                duration -= deltaTime;
                this.mBuffSeesionMap.set(v.id, duration);
                if (duration <= 0) {
                    v.buff = 0;
                    this.mBuffSeesionMap.delete(v.id);
                }
            }
        });
    }

    onCheckPeakMoment() {
        if (this.mGameInfo.GameState != GameState.PeakMoment) {
            if (this.mGameInfo.GameLeftTime <= this.mGameRule.peakMomentLength) {
                console.log("进入巅峰时刻", this.mGameRule.peakMomentLength);
                this.state.players.forEach((v: sPlayer, k: string) => {
                    if (!v.isHunter && v.HP > 0) {
                        v.HP += this.mGameRule.peekHP;
                    }
                });
                this.mGameInfo.GameState = GameState.PeakMoment;
            }
        }
    }

    onCheckOpenDoor() {
        if (this.mGameRule.roundLength - this.mGameInfo.GameLeftTime > this.mGameRule.opendoorDelay) {
            this.mGameInfo.GameState = GameState.OpenDoor;
        }

    }
    private mGameRoundOverTimer: number = 0;
    private mGameOverTimer: number = 0;

    // 检查游戏结束
    onCheckRoundOver() {
        // 1. 游戏时间到
        // 2. B阵营玩家全部找到 
        // 3. A、B 阵营玩家全部离开
        if (this.mGameInfo.GameState >= GameState.GameStart) {
            let result = false;
            if (this.mGameInfo.GameLeftTime <= 0) {
                result = true;
                // 时间到  躲藏者赢
                this.mRoundResult.isHunterWin = false;
            }
            // 测试环境不处理
            if (this.mGameRule.isTest == 0) {
                if (this.mGameInfo.HunterNum == 0) {
                    result = true;
                    this.mRoundResult.isHunterWin = false;
                }
                if (this.mGameInfo.HiderNum == 0) {
                    result = true;
                    this.mRoundResult.isHunterWin = true;
                }
            }
            if (result) {
                // todo
                console.error("回合结束！");
                this.onCalRoundResult();
            }
        }
    }

    onCalRoundResult() {
        this.mPlayerInfoMap.forEach((playerInfo: sPlayerInfo, id: number) => {
            let player = this.state.players.get(playerInfo.sessionId);
            if (this.mBuffSeesionMap.get(player.id)) {
                this.mBuffSeesionMap.delete(player.id);
                player.buff = 0;
            }

            if (player != null) {
                //player.model = this.DEF_MODEL;
                let _score: number = 0;
                let playerInfo = this.mPlayerInfoMap.get(player.id);
                if (this.mGameInfo.GameLeftTime < 0) this.mGameInfo.GameLeftTime = 0;
                playerInfo.playTimeSum += this.mGameRule.roundLength - this.mGameInfo.GameLeftTime;
                if (player.isHunter) {
                    playerInfo.hunterSum += playerInfo.hunterNum;
                    playerInfo.score += playerInfo.hunterNum * this.mGameRule.hunterNumScore;
                    _score += playerInfo.hunterNum * this.mGameRule.hunterNumScore;
                    //player.star += this.mGameRule.hunterNumStar * playerInfo.hunterNum;

                    if (this.mRoundResult.isHunterWin) {
                        playerInfo.score += this.mGameRule.hunterWinScore;
                        playerInfo.hunterWinSum++;
                        _score += this.mGameRule.hunterWinScore;
                        if (playerInfo.hunterNum >= this.mRoundResult.hunterNum) {
                            this.mRoundResult.hunterNum = playerInfo.hunterNum;
                            this.mRoundResult.hunterId = playerInfo.userId;
                            this.mRoundResult.bestScore = _score;
                        }
                    }

                } else {
                    if (playerInfo.liveTime > (this.mGameRule.roundLength - this.mGameInfo.GameLeftTime)) {
                        playerInfo.liveTime = this.mGameRule.roundLength - this.mGameInfo.GameLeftTime;
                    }
                    playerInfo.liveSum += playerInfo.liveTime;
                    playerInfo.score += playerInfo.liveTime * this.mGameRule.hiderLiveScore;
                    _score += playerInfo.liveTime * this.mGameRule.hiderLiveScore;
                    if (!this.mRoundResult.isHunterWin) {
                        playerInfo.score += this.mGameRule.hiderWinScore;
                        playerInfo.hiderWinSum++;
                        _score += this.mGameRule.hiderWinScore;
                        if (playerInfo.liveTime >= this.mRoundResult.liveTime) {
                            this.mRoundResult.liveTime = playerInfo.liveTime;
                            this.mRoundResult.hiderId = playerInfo.userId;
                            this.mRoundResult.bestScore = _score;
                        }
                    }
                }
                playerInfo.roundScore = _score;
            }
            this.SavePlayerStar(playerInfo.sessionId);
        });
        this.BroadcastPlayerInfoMap();
        this.mGameRoundOverTimer = 0;
        if (this.state.players.size < this.mGameRule.minPlayer) {
            this.mGameInfo.GameRound = this.mGameRule.roundNumber;
        }
        this.mGameInfo.GameState = GameState.GameRoundOver;

        let roundResultJson = JSON.stringify(this.mRoundResult);
        this.mGameInfo.RoundResult = roundResultJson;
        console.log("回合结果：" + roundResultJson);
    }


    onCheckGameOver(t: number) {
        if (this.mGameInfo.GameState == GameState.GameRoundOver) {
            if (this.mGameInfo.GameRound >= this.mGameRule.roundNumber) {
                this.onGameOver();
                return;
            }
            this.mGameRoundOverTimer += t;
            if (this.mGameRoundOverTimer >= this.mGameRule.roundOverDelay) {
                this.mGameRoundOverTimer = 0;
                if (this.state.players.size < this.mGameRule.minPlayer) {
                    this.onGameOver();
                    return;
                } else {
                    console.log("新回合");
                    this.onStartGame();
                }
            }
        }
        if (this.mGameInfo.GameState == GameState.GameOver) {
            this.mGameOverTimer += t;
            if (this.mGameOverTimer >= this.mGameRule.gameOverDelay) {
                this.unLockGame();
                this.onResetNewGame();
            }
        }
    }

    onGameOver() {
        console.log("游戏结束");
        this.mGameOverTimer = 0;
        this.mGameInfo.GameState = GameState.GameOver;

        this.mMaps.onGameOver();
    }

    async unLockGame() {
        await this.unlock();
    }

    onResetNewGame() {
        console.log("新游戏");
        this.mGameInfo.GameState = GameState.GameWait;
        this.mGameInfo.GameRound = 0;
        this.mPlayerInfoMap.forEach((playerInfo, id) => {
            this.initPlayerInfo(playerInfo);
        })
        this.onMatch();
    }

    onBeAttacked(message: any) {
        let hider = this.mPlayerInfoMap.get(message.targetId);
        let player = this.state.players.get(hider.sessionId);
        let blood = message.huntblood;
        let killerId = message.killerId;
        if (player.HP > 0 && !player.isHunter) {
            // 血量减少1
            player.HP -= blood;
            console.log(message.targetId, "玩家收到攻击", message.id, player.HP);
            if (player.HP <= 0) {
                let playerInfo = this.mPlayerInfoMap.get(player.id);
                let deadId = hider.sessionId;
                let deadData = { deadId, killerId };
                player.model = ServerData.DEF_DIE_MODEL;
                // 存活时间
                playerInfo.liveTime -= this.mGameInfo.GameLeftTime;
                // 取整数秒
                playerInfo.liveTime = Math.round(playerInfo.liveTime);

                this.BroadcastPlayerInfoMap();
                this.broadcast(sEventArg.PlayerDie, JSON.stringify(deadData));

                let hunterInfo = this.mPlayerInfoMap.get(message.id);
                hunterInfo.hunterNum += 1;
                if (this.state.players.get(hunterInfo.sessionId)) {
                    this.state.players.get(hunterInfo.sessionId).star += this.mGameRule.hunterNumStar;
                }
                this.mGameInfo.HiderNum -= 1;
                this.onCheckRoundOver();
            }
            console.log(player.HP + " -- " + player.isHunter);
        } else {
            console.log("hider is died!!!");
        }
    }

}