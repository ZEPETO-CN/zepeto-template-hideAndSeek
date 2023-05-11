import { SpawnInfo, ZepetoCamera, ZepetoCharacter, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { AudioListener, CharacterController, GameObject, HumanBodyBones, LayerMask, Material, MeshRenderer, Quaternion, Time, Transform, Vector2, Vector3, WaitForSeconds, Camera } from "UnityEngine";
import { sGameInfo, sPlayer, sPlayerInfo, sVector3 } from "ZEPETO.Multiplay.Schema";
import { sEventArg, GameState } from "./NetManager"
import { RoomData } from "ZEPETO.Multiplay";
import BaseManager from './BaseManager'
import PoolManager from '../GameManager/PoolManager'
import { WatchGameNode } from '../UI/UIWatchGameView'
import { ZepetoWorldHelper, Users } from 'ZEPETO.World'
import ZepetoNetPlayer from '../NetTransform/ZepetoNetPlayer';
import TransformHelper from '../Common/TransformHelper';
import IKCtrl from '../Common/IKCtrl';
import UIToast from '../UI/UIToast';
import UIHunterOperation from '../UI/UIHunterOperation';
import RadarController from '../GameController/RadarController';
import { TMP_MeshInfo } from 'TMPro';

class PlayerGameStatus {
    public model: number;
    public isOnDragEnd: boolean;
    public star: number = 0;
    public HP: number = 0;
    public buff: number = 0;
    public buffNum: number = 0;
}

class ShootData {
    public id: number;
    public pos_x: number;
    public pos_y: number;
    public pos_z: number;
    public rot_y: number;
    public x: number;
    public y: number;
    public z: number;
    public move_x: number;
    public move_y: number;
    public move_z: number;
}

export enum ActionEvent {
    OnDie = "OnDie",
    // OnUpdatePlayerNum = "OnUpdatePlayerNum",
    OnUpdateHP = "OnUpdateHP",
    OnUpdateStar = "OnUpdateStar",
    OnFinishLoad = "OnFinishLoad",
    OnUpdateBuff = "OnUpdateBuff",
    OnLockCamera = "OnLockCamera",
    OnFreeCamera = "OnFreeCamera",
    OnWatchCamera = "OnWatchCamera",
}


export enum LightState {
    ON = 1,
    OFF = 2,
    // NOUSE = 3,
}

enum MoveState {
    DragEnd = 0,
    DragBegin = 1,
    DragMove = 2,
    Rotate = 3,
    Attack = 4,
}

enum PlayerRole {
    Free = 0,
    Hider = 1,
    Hunter = 2,
}

enum BuffState {
    None = 0,
    Hide = 1,
}


const mChangeModelFX: string = "FX_ChangeModel";
const mModelRunFX: string = "FX_Run";
const mDieFX: string = "FX_Die";
const mStarFX: string = "FX_Star";
const mAddHPFX: string = "FX_AddHP";
const mRadarFX: string = "FX_Radar";
const mRadarInFX: string = "FX_RadarIn";


export default class PlayerManager extends BaseManager {

    /* Singleton */

    private static _instance: PlayerManager;
    public static get Instance(): PlayerManager {
        return PlayerManager._instance;
    }

    // 物品预设
    public mGoods: GameObject[];
    public mGunPrefab: GameObject;
    public mLightPfb: GameObject;
    public TeamSign: GameObject;

    public mOutlineMat: Material;
    public mGoodMat: Material;
    public mGoodHideMat: Material;
    public mFreeCamera: Transform;
    public mHunterCamera: Camera;
    public ThrDCanvas: GameObject;
    public mHunterCameraPos: Vector3;
    public showTimePanel: GameObject;
    public mGhost: GameObject;

    /* Player Map */
    private mPlayerInfoMap: Map<number, sPlayerInfo> = new Map<number, sPlayerInfo>();
    private mPlayerSessionMap: Map<string, sPlayer> = new Map<string, sPlayer>();
    private mPlayerGameStatusMap: Map<number, PlayerGameStatus> = new Map<number, PlayerGameStatus>(); // 玩家状态

    public mSessionId: string;
    public saveSessionId: string;
    private mUserId: string;
    private mId: number;
    private mLocalPlayer: ZepetoPlayer;
    private mLocalCamera: ZepetoCamera;
    private mLocalPlayerTransform: Transform;
    private mLockMove: boolean;
    private mMaxMoveDistance: number = 1;

    private mInitCameraAngle: Vector3;
    private mPreCameraAngle: Quaternion;
    private mPreCameraPos: Vector3;

    public get LocalPlayer(): ZepetoPlayer { return this.mLocalPlayer; }
    public get LocalCamera(): ZepetoCamera { return this.mLocalCamera; }

    public get PlayerInfoMap(): Map<number, sPlayerInfo> { return this.mPlayerInfoMap; }

    /* Camera Controoler */
    //private mCameraCtrl : CameraController;

    /* sync setting */
    private mKeepMoveInterval: number = 0.05; // 持续某个方向移动，每隔x秒同步一次
    private mMoveTimer: number = 0;
    private muiMoveDir: Vector2;
    private mMoveState: MoveState = MoveState.DragEnd;
    private mZepetoNetPlayerMap: Map<string, ZepetoNetPlayer> = new Map<string, ZepetoNetPlayer>();
    public mLocalZepetoNetPlayer: ZepetoNetPlayer = null;
    /* load */
    private mLoadedPlayerNum: number = 0;

    public wallmat: Material;
    public mSuperLightPfb: GameObject;

    // public LightState: number = LightState.OFF;
    // public LightBattle: number = 500;
    // private lightTime: number = 0;
    // public IKCtrl: IKCtrl;
    // public weaponObj: GameObject;
    // public HandLightObj: GameObject;
    Awake() {
        PlayerManager._instance = this;

    }

    Start() {
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.OnAddLocalPlayer();
        });

        ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId: string) => {
            this.OnAddPlayer(sessionId);
        });


        // this.ThrDCanvas.gameObject.SetActive(true);
    }

    OnAddLocalPlayer() {
        this.mLocalPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
        this.mLocalCamera = ZepetoPlayers.instance.LocalPlayer.zepetoCamera;
        this.mLocalCamera.camera.gameObject.tag = "MainCamera";
        this.mHunterCamera.transform.SetParent(this.mLocalCamera.camera.transform);

        this.mHunterCamera.transform.localPosition = this.mHunterCameraPos;
        this.mHunterCamera.transform.localEulerAngles = Vector3.zero;
        this.mHunterCamera.transform.localScale = Vector3.one;
        // this.mLightTar = this.mHunterCamera.transform.GetChild(0).transform;
        this.SetHunterCamera(true);
        this.mLocalPlayerTransform = this.mLocalPlayer.character.transform;
        this.mLocalCamera.cameraParent.localEulerAngles = this.mInitCameraAngle;

        GameObject.Instantiate<GameObject>(
            this.ThrDCanvas, this.mLocalCamera.camera.transform
        );
    }

    private mIsFirstFinishLoad: bool = false;

    OnAddPlayer(sessionId: string) {
        this.mLoadedPlayerNum++;
        if (this.mLoadedPlayerNum == (this.mPlayerInfoMap.size - 1)) {
            if (!this.mIsFirstFinishLoad) {
                this.OnActionEvent(ActionEvent.OnFinishLoad, this.mUserId);
                let ids: string[] = [this.mUserId];
                ZepetoWorldHelper.GetUserInfo(ids, (info: Users[]) => {
                    const data = new RoomData();
                    data.Add("nickName", info[0].name);
                    this.SendEvent(sEventArg.ClientReady, data);
                }, (error) => {
                    console.log(error);
                });
                this.mIsFirstFinishLoad = true;
            }

        }
        const player = this.mPlayerSessionMap.get(sessionId);
        player.OnChange += (changeValues) => this.OnStateSync(sessionId, player);
        let character = this.GetCharacter(sessionId);
        character.name = player.id.toString();
        character.gameObject.layer = LayerMask.NameToLayer("Player");
        character.gameObject.tag = "Player";

        character.enabled = false;
        let isLocal = this.mSessionId == sessionId;
        let zepetoNetPlayer = character.gameObject.AddComponent<ZepetoNetPlayer>();

        ////////////////////////////加手电
        let IKCmp = character.gameObject.transform.GetChild(0).gameObject;
        let ikboj = new GameObject("WeaponRoot");
        zepetoNetPlayer.weaponInRoot = character.ZepetoAnimator.GetBoneTransform(HumanBodyBones.RightHand);
        zepetoNetPlayer.weaponOutRoot = IKCmp.transform;

        ikboj.transform.parent = zepetoNetPlayer.weaponOutRoot;
        ikboj.transform.localPosition = new Vector3(0.158, 0.591, 0.066);
        ikboj.transform.localEulerAngles = new Vector3(55.7, 48.45, -36.5);

        zepetoNetPlayer.SetIKCtrl(IKCmp.AddComponent<IKCtrl>());
        zepetoNetPlayer.GetIKCtrl().ikActive = false;

        zepetoNetPlayer.weaponObj = GameObject.Instantiate<GameObject>(this.mGunPrefab, zepetoNetPlayer.weaponInRoot);
        zepetoNetPlayer.weaponObj.name = "Weapon";
        zepetoNetPlayer.HandLightObj = zepetoNetPlayer.weaponObj.transform.GetChild(0).gameObject;
        zepetoNetPlayer.IKCtrl.ikObj = ikboj.transform;

        zepetoNetPlayer.mLightTar = this.mHunterCamera.transform.GetChild(0).transform;

        //加一个扫描光住
        zepetoNetPlayer.objLight = GameObject.Instantiate<GameObject>(
            this.mLightPfb, zepetoNetPlayer.weaponObj.transform);
        zepetoNetPlayer.objLight.name = "Light";
        zepetoNetPlayer.objLight.SetActive(false);

        //超级光柱
        zepetoNetPlayer.objSuperLight = GameObject.Instantiate<GameObject>(
            this.mSuperLightPfb, zepetoNetPlayer.weaponObj.transform);
        zepetoNetPlayer.objSuperLight.name = "SuperLight";
        zepetoNetPlayer.objSuperLight.SetActive(false);

        //三角标
        // zepetoNetPlayer.TeamSignObj = GameObject.Instantiate<GameObject>(
        //     this.TeamSign, character.transform.GetChild(0).transform);
        // zepetoNetPlayer.TeamSignObj.name = character.name + "_teamSign";
        // zepetoNetPlayer.TeamSignObj.SetActive(false);
        // zepetoNetPlayer.mIsLocal = isLocal;

        this.mZepetoNetPlayerMap.set(sessionId, zepetoNetPlayer);
        if (isLocal) {
            this.mLocalZepetoNetPlayer = zepetoNetPlayer;
            this.mLocalZepetoNetPlayer.mId = player.id;
            this.mLocalZepetoNetPlayer.mIsLocal = true;
            character.gameObject.AddComponent<AudioListener>();
        }


        this.OnSetPlayerInfoByVO(sessionId, 0);
        // 需要延迟一会初始化用户状态
        if (!isLocal) {
            this.StartCoroutine(this.CoDealyOnSyncRomotePlayer(sessionId, player));
        }
    }

    SyncLightAction(msg: string) {
        var d = msg.split("|");
        let netPlayer = this.GetZepetoNetPlayer(d[0]);
        let sta = (Number)(d[1]);
        netPlayer.SetLightAction(sta);
    }



    SendLightState(sta: LightState) {
        this.SendEvent(sEventArg.SwitchLight, sta);
    }
    SendSuperLightState(sta: LightState) {
        this.SendEvent(sEventArg.SwitchSuperLight, sta);
    }

    OnSetPlayerInfoByVO(sessionId: string, playerLevel: number) {
        if (sessionId != null) {
            let playerInfoVO = this.GetPlayerInfoVO(playerLevel);
            let player = this.GetZepetoNetPlayer(sessionId);

            if (player != null) {
                player.mRunSpeed = playerInfoVO.runSpeed;
                player.mJumpPower = playerInfoVO.jumpPower;
            }

            if (sessionId == this.mSessionId) {
                ZepetoPlayers.instance.cameraData.minZoomDistance = playerInfoVO.zoomMin;
                ZepetoPlayers.instance.cameraData.maxZoomDistance = playerInfoVO.zoomMax;
                console.log("设置摄像头, 距离为：" + playerInfoVO.zoomMax);
            }

            // ZepetoPlayers.instance.cameraData.offset = new Vector3(playerInfoVO.offsetx, 0, 0);
        }
    }

    Update() {
        if (this.mLocalPlayer == null) return;
        this.UpdateCamera();
    }

    FixedUpdate() {
        if (this.mLocalPlayer == null) return;
        this.OnUpdateDragMove();
    }

    SetTeamSignVisible() {
        // let isHunter = this.mPlayerSessionMap.get(this.mSessionId).isHunter;
        // this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
        //     if (!player.isHunter) {
        //         this.saveSessionId = sessionId;
        //     }

        //     let netplayer = this.GetZepetoNetPlayer(sessionId);
        //     netplayer.NetSetTeamSignVisible(player.isHunter == isHunter && this.mSessionId != sessionId);
        // });
    }

    HideAllTeamSign() {
        // this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
        //     let netplayer = this.GetZepetoNetPlayer(sessionId);
        //     netplayer?.TeamSignObj.SetActive(false);
        // });
    }

    ResetCamera() {
        this.mIsWatchCamera = false;
        this.mIsFreeCamera = false;
        this.mIsLockCamera = false;
        this.mFreeCamera.gameObject.SetActive(false);
        this.ShowGhost(false);
    }

    UpdateCamera() {
        if (this.mIsWatchCamera) {
            this.OnWatchCameraUpdate();
        } else if (this.mIsFreeCamera) {
            this.OnFreeCameraUpdate();
        } else if (!this.mIsLockCamera) {
            this.OnUpdateCharacterAngle();
        }
    }

    // 心跳
    OnGameUpdate(gameInfo: sGameInfo) {
        // todo 发送位置
    }

    /* 玩家摄像头控制 Start */
    private mIsLockCamera: boolean = false;
    private mIsFreeCamera: boolean = false;
    private mIsWatchCamera: boolean = false;
    private mWatchTarget: Transform = null;
    private mWatchOffsetPos: Vector3 = new Vector3(0, 3, -2);
    private mWatchOffsetRot: Vector3 = new Vector3(45, 0, 0);
    private mIsFollowCamera: boolean = false;
    private mFollowCamera: Transform = null;
    private mFreeCameraTarget: Vector3;
    private mLockAngle: Vector3 = Vector3.zero;

    public LockCamera(isLock: boolean) {
        console.log("锁定视角", isLock);
        this.mIsLockCamera = isLock;
        if (isLock) {
            this.mLockAngle = this.mLocalCamera.cameraParent.eulerAngles;
            this.mLocalZepetoNetPlayer.StopMoving();
        }
        else {
            this.mLocalCamera.cameraParent.eulerAngles = this.mLockAngle;
        }
    }

    public FreeCamera(isOn: boolean) {
        console.log("自由视角", isOn);
        this.mIsFreeCamera = isOn;
        this.mFreeCamera.gameObject.SetActive(isOn);
        if (isOn) {
            this.mFreeCameraTarget = Vector3.zero;
            this.mFreeCamera.position = this.mLocalCamera.cameraParent.position;
            // this.mFreeCamera.LookAt(this.mLocalCamera.cameraParent.position);
            this.mFreeCamera.eulerAngles = this.mLocalCamera.cameraParent.eulerAngles;
        }
    }

    public DieFreeCamera() {
        this.FreeCamera(true);
        this.ShowGhost(true);
    }

    private ShowGhost(visiable: boolean) {
        this.mGhost.SetActive(visiable);
    }

    public OnFreeCameraUpdate() {
        this.mFreeCamera.position += this.mFreeCameraTarget * Time.deltaTime * 2;
        this.mFreeCamera.transform.eulerAngles = this.mLocalCamera.cameraParent.eulerAngles;
    }

    public WatchCamera(isWatch: boolean, sessionId: string) {
        console.log("观战视觉", isWatch);
        this.mIsWatchCamera = isWatch;
        this.mFreeCamera.gameObject.SetActive(isWatch);
        if (isWatch) {
            this.mWatchTarget = this.GetZepetoNetPlayer(sessionId).transform;

        } else {
            this.mWatchTarget = null;
        }
        // if (isWatch) {
        //     // this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
        //     //     if (!player.isHunter && player.HP > 0) {
        //             this.mWatchTarget = this.GetZepetoNetPlayer(sessionId).transform;
        //             this.saveSessionId = sessionId;
        //             return;
        //     //     }
        //     // });
        //     // this.mWatchTarget = this.GetZepetoNetPlayer(sessionId).transform;
        // } else {
        //     this.mWatchTarget = null;
        // }
        // this.saveSessionId = sessionId;
    }

    public GetShowTimeSessionID(): string {
        let id = "";
        this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
            if (!player.isHunter) {
                id = sessionId;
                return;
            }
        });
        return id;
    }


    // public CancleWaterCamera() {
    //     this.mIsWatchCamera = false;
    //     // this.mWatchTarget = null;
    // }

    public OnWatchCameraUpdate() {
        if (this.mWatchTarget != null) {
            TransformHelper.SetCameraFlower(this.mFreeCamera, this.mWatchTarget, 2.5, 2.5, 3);
            // this.mFreeCamera.position = this.mWatchTarget.position + this.mWatchOffsetPos;
            // this.mFreeCamera.eulerAngles = this.mWatchOffsetRot;

        }
    }

    public SetHunterCamera(isOn: boolean) {
        this.mLocalCamera.camera.enabled = true;
        this.mHunterCamera.enabled = false;
        if (isOn) {
            this.mHunterCamera.gameObject.SetActive(true);
        } else {
            this.mHunterCamera.gameObject.SetActive(false);
        }
    }

    /* 玩家摄像头控制 end */


    /* 跳跃 start */
    Jump() {
        if (this.mLockMove || this.mIsLockCamera) return;
        //this.SendEvent(sEventArg.PlayerJump, this.mSessionId);
        this.mLocalZepetoNetPlayer.Jump();
    }

    /* 跳跃 end */

    /* 玩家角色控制 Start */

    private mPreCameraAngleY: number = 0;
    private mPreSendAngleY: number;
    private mAngleBlance: number = 100; //  1度误差

    private mPreMoveForward: Vector3;
    private mPreMoveRight: Vector3;
    private mPreAngleSendTime: number = 0;
    private mAngleInterval: number = 0.1; // 角度同步间隔
    private mFrameIndex: number = 0;

    OnUpdateCharacterAngle() {
        // 1度误差
        let angle_y = Math.round(this.mLocalCamera.cameraParent.eulerAngles.y * 100);
        let angle_dis = Math.abs(angle_y - this.mPreCameraAngleY);
        if (angle_dis > this.mAngleBlance) {
            this.mPreCameraAngleY = angle_y;
            this.mLocalZepetoNetPlayer.UpdateAngel(this.mPreCameraAngleY * 0.01)
        }
    }

    OnDragBegin() {
        if (this.mLockMove || this.mIsLockCamera) return;
        this.mMoveState = MoveState.DragBegin;
    }

    OnDragEnd() {
        this.mFreeCameraTarget = Vector3.zero;
        this.mMoveState = MoveState.DragEnd;
        this.mLocalZepetoNetPlayer.StopMoving();
    }


    OnDragMove(moveDir: Vector2) {
        // 控制摄像机移动
        if (this.mIsFreeCamera) {
            this.mFreeCameraTarget = (this.mFreeCamera.transform.forward * moveDir.y + this.mFreeCamera.transform.right * moveDir.x);
            return;
        }
        if (this.mLockMove || this.mIsLockCamera) return;


        this.mMoveState = MoveState.DragMove;
        this.mLocalZepetoNetPlayer.StartMove(moveDir);
        this.muiMoveDir = moveDir;
        this.mMoveTimer = 0;
    }

    OnUpdateDragMove() {
        if (this.mMoveState == MoveState.DragMove && !this.mLockMove && !this.mIsLockCamera) {
            this.mMoveTimer += Time.fixedDeltaTime;
            if (this.mMoveTimer > this.mKeepMoveInterval) {
                this.OnDragMove(this.muiMoveDir);
                this.mMoveTimer = 0;
            }
        }
    }

    /**
     * @description: 同步玩家 其实没必要
     */
    public OnPlayerChange(players: any) {
        players.ForEach((sessionId: string, player: sPlayer) => {
            if (!this.mPlayerSessionMap.has(sessionId)) {
                this.mPlayerSessionMap.set(sessionId, player);
                if (!this.mPlayerInfoMap.has(player.id)) {
                    // Update playerInfo
                    this.SendEvent(sEventArg.PlayerInfoSync, new RoomData());
                }
            }
        });
    }


    /**
     * @description: 接受玩家移动数据
     * 
     * @param: id -> id
     * @param: index -> packageIndex
     * @param: data : moveDataJson
     */
    OnReceiveMoveData(message: any) {
        let result = JSON.parse(message.data);
        let id = result.id;
        if (this.mPlayerInfoMap.has(id)) {
            let userInfo = this.mPlayerInfoMap.get(id);
            let netPlayer = this.mZepetoNetPlayerMap.get(userInfo.sessionId);
            if (netPlayer != null) netPlayer.ReceiveMoveData(message.data);
        }
        // let lightrot = JSON.parse(message.lightrot);
        // let rotx = lightrot[0];
        // let roty = lightrot[1];
        // let rotz = lightrot[2];
        // netPlayer.objLight.transform.localEulerAngles = new Vector3(rotx, roty, rotz);
        // if (!netPlayer.mIsLocal) {
        //     netPlayer.objLight.transform.localPosition = new Vector3(0.147, -0.001, 0.048);
        //     netPlayer.objLight.transform.localEulerAngles = new Vector3(136.48, -83.203, 45.28);
        // }
    }

    /**
     * @description: 同步玩家状态
     */
    OnStateSync(sessionId: string, player: sPlayer) {
        // console.error(`[${"OnSyncRomotePlayer"}] ${player.moveState}`);
        const zepetoCharacter = this.GetCharacter(sessionId);
        let playerStatus = this.mPlayerGameStatusMap.get(player.id);
        if (player.model != playerStatus.model) {
            playerStatus.model = player.model;
            this.OnChangeModel(zepetoCharacter, player.model);
            if (sessionId == this.mSessionId) {
                this.OnChangeModelCamera(player.model);
            } else if (this.mGameState >= GameState.GameStart) {        // 游戏开始后， 寻找者身份下， 同步增加outline
                let isOk = this.mPlayerSessionMap.get(this.mSessionId).isHunter;
                if (!isOk && !player.isHunter) {
                    this.OnAddModelOutline(zepetoCharacter);
                }
            }
        }

        if (player.buff != playerStatus.buff) {
            playerStatus.buff = player.buff;
            this.OnChangeBuff(zepetoCharacter, player.buff);
        }

        if (sessionId == this.mSessionId) {
            if (player.star != playerStatus.star) {
                // 增加星星UI特效
                if (player.star > playerStatus.star && playerStatus.star != 0) {
                    // let starFX = PoolManager.Instance.Spawn(mStarFX);
                    // starFX.transform.SetParent(zepetoCharacter.transform);
                    // starFX.transform.localPosition = Vector3.zero;
                    console.log("播放星星增加特效");
                }
                playerStatus.star = player.star;
                console.log("同步星值 ", player.star);
                this.OnActionEvent(ActionEvent.OnUpdateStar, player.star);
            }

            if (player.HP != playerStatus.HP) {
                playerStatus.HP = player.HP;
                this.OnActionEvent(ActionEvent.OnUpdateHP, player.HP);
            }

            if (player.buffNum != playerStatus.buffNum) {
                playerStatus.buffNum = player.buffNum;
                this.OnActionEvent(ActionEvent.OnUpdateBuff, player.buffNum);
            }
        }
    }

    OnAddModelOutline(character: ZepetoCharacter) {
        if (character.transform.childCount <= 1) {
            return;
        }
        let model = character.transform.GetChild(1).gameObject;
        if (model == null) {
            console.error("model is null!!!!");
            return;
        }
        let meshs = model.GetComponentsInChildren<MeshRenderer>();
        for (let i = 0; i < meshs.length; i++) {
            let count = meshs[i].sharedMaterials.length;
            let tempMats: Material[] = new Array(count);
            for (let j = 0; j < count; j++) {
                tempMats[j] = meshs[i].sharedMaterials[j];
            }
            tempMats[count] = this.mOutlineMat;
            meshs[i].sharedMaterials = tempMats;
        }
    }

    OnPlayerDie(message: string) {
        let deadData = JSON.parse(message);
        let sessionId = deadData.deadId;
        let killerId = deadData.killerId;
        const zepetoCharacter = this.GetCharacter(sessionId);
        let dieFX = PoolManager.Instance.Spawn(mDieFX);
        dieFX.transform.position = zepetoCharacter.transform.position;
        if (sessionId == this.mSessionId || this.mIsWatchCamera) {
            this.mLockMove = true;
            let watchData: Map<string, WatchGameNode> = new Map<string, WatchGameNode>();
            this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
                if (!player.isHunter) {
                    let node: WatchGameNode = new WatchGameNode();
                    node.sessionId = sessionId;
                    let playerInfo = this.mPlayerInfoMap.get(player.id);
                    node.name = playerInfo.nickName;
                    node.isLive = player.HP > 0 && playerInfo.liveTime == this.mGameRule.roundLength;
                    // node.isLive = true;
                    watchData.set(sessionId, node);
                    console.log("玩家昵称：", node.name);
                    // this.saveSessionId = sessionId;
                }
            });
            let data = { watchData: watchData, isSelf: sessionId == this.mSessionId };
            this.OnActionEvent(ActionEvent.OnDie, data);
        }

        if (killerId == this.mSessionId) {
            UIToast.Instance.ShowHunterKill();
        }
    }

    //玩家被扫描到
    OnPlayerScan(message) {
        let beScanIds: string[] = JSON.parse(message.beScanIds);
        for (let i = 0; i < beScanIds.length; i++) {
            if (beScanIds[i] == this.mSessionId) {
                UIToast.Instance.ShowHiderBeScan();
                break;
            }
        }
    }

    /* 玩家角色控制 End */


    /* start 游戏逻辑 */
    OnPeakMoment() {
        try {
            this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
                let character = this.GetZepetoNetPlayer(sessionId);
                if (character != null && player.isHunter) {
                    if(character.transform.Find(mRadarFX) == null){
                        character.mRunSpeed *= 1.5;
                        let radar = PoolManager.Instance.Spawn(mRadarFX);
                        radar.name = mRadarFX;
                        radar.transform.SetParent(character.transform);
                        radar.transform.localPosition = Vector3.zero;
                        radar.GetComponent<RadarController>().mSessionId = sessionId;
                        console.log("OnPeakMoment, update hunter radar");
                    }
                }
                let isHunter = this.mPlayerSessionMap.get(this.mSessionId).isHunter;
                if (character != null && !player.isHunter && !isHunter) {
                    let addHP = PoolManager.Instance.Spawn(mAddHPFX);
                    addHP.transform.SetParent(character.transform);
                    addHP.transform.localPosition = Vector3.zero;
                }
            });
        } catch (err) {
            console.error(err);
        }
    }



    OnRoundOver() {
        this.mLockMove = false;
        if (this.mIsLockCamera) {
            this.LockCamera(false);
        }
        this.FreeCamera(false);

        try {
            this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
                let character = this.GetZepetoNetPlayer(sessionId);
                character.InitLight();

                // character.TeamSignObj.SetActive(false);
                if (character != null) {
                    character.StopMoving();
                    //this.OnChangeBuff(this.GetCharacter(sessionId), BuffState.None);
                    let rader = character.transform.Find(mRadarFX);
                    if (rader != null) PoolManager.Instance.UnSpawn(rader.gameObject);
                }
            });
        } catch (err) {
            console.error(err);
        }
        this.HideAllTeamSign();
    }

    GetLocalPlayer(): sPlayer {
        try {
            let playerInfo = this.mPlayerSessionMap.get(this.mSessionId);
            //console.log("start game 身份是" + playerInfo.isHunter);
            return playerInfo;
        } catch (err) {
            console.error(err);
        }
        return null;
    }

    OnGameStart() {
        this.ResetCamera();
        try {
            this.SetTeamSignVisible();
            this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
                let character = this.GetZepetoNetPlayer(sessionId);
                character.InitLight();
                if (this.GetCharacter(sessionId) != null) {
                    this.OnChangeModel(this.GetCharacter(sessionId), this.DEF_MODEL);
                }
                this.OnSetPlayerInfoByVO(sessionId, player.isHunter ? PlayerRole.Hunter : PlayerRole.Hider);

                if (this.mSessionId == sessionId) {
                    this.SetHunterCamera(player.isHunter);
                }
            });
            UIHunterOperation.Instance.ObjSuperLight.SetActive(true);
        } catch (err) {
            console.error(err);
        }
    }

    OnGameOver() {
        this.OnRoundOver();
        this.ResetCamera();

        try {
            this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
                let character = this.GetZepetoNetPlayer(sessionId);
                character.InitLight();
                if (this.GetCharacter(sessionId) != null) {
                    if (player.model === this.DEF_DIE_MODEL) {     // 死亡的躲藏者，重新变成原先模型
                        this.OnChangeModel(this.GetCharacter(sessionId), player.targetModel);
                    }

                }
            });
        } catch (err) {
            console.error(err);
        }
    }

    * IE_DelaySetPosition(character: ZepetoNetPlayer, pos: Vector3, rot: Vector3) {
        this.mMoveState = MoveState.DragEnd;
        this.mLockMove = true;
        character.StopMoving();
        character.enabled = false;
        yield null;
        yield null;
        //yield new WaitForSeconds(0.2);
        character.transform.position = pos;
        character.transform.eulerAngles = rot;
        console.log("移动位置", pos.x, pos.z);
        yield new WaitForSeconds(0.2);
        character.enabled = true;
        this.mLockMove = false;

    }
    
    private mIsCheckedHunterPos : boolean = false;
    private mIsCheckedrader : boolean = false;
    UpdateCheck(gameState : GameState){
        
        if(gameState >= GameState.GameStart && gameState <= GameState.OpenDoor){
            if(!this.mIsCheckedHunterPos && this.mLocalZepetoNetPlayer != null){
                let player = this.mPlayerSessionMap.get(this.mSessionId);
                this.mIsCheckedHunterPos = true;
                console.log("player UpdateCheck, 更新hunter pos");
                let sp = this.GetStartPoint(player.id - 1, player.isHunter ? PlayerRole.Hunter : PlayerRole.Hider);
                let pos = this.DecodeVector3(sp.pos);
                let rot = this.DecodeVector3(sp.rot);
                this.mLocalZepetoNetPlayer.transform.position = pos;
                this.mLocalZepetoNetPlayer.transform.eulerAngles = rot;
                this.StartCoroutine(this.IE_DelaySetPosition(this.mLocalZepetoNetPlayer, pos, rot));
            }
        }else if(gameState == GameState.PeakMoment){
            if(!this.mIsCheckedrader){
                let character = this.GetZepetoNetPlayer(this.mSessionId);
                let player = this.mPlayerSessionMap.get(this.mSessionId);
                this.mIsCheckedrader = true;
                if(player.isHunter){
                    if(character.transform.Find(mRadarFX) == null){
                        character.mRunSpeed *= 1.5;
                        let radar = PoolManager.Instance.Spawn(mRadarFX);
                        radar.name = mRadarFX;
                        radar.transform.SetParent(character.transform);
                        radar.transform.localPosition = Vector3.zero;
                        radar.GetComponent<RadarController>().mSessionId = this.mSessionId;
                        console.log("player UpdateCheck, update hunter radar");
                    }
                }
            }
        }
        else {
            this.mIsCheckedHunterPos = false;
            this.mIsCheckedrader = false;
        }

    }

    private hasShowTip: boolean = false;
    public CheckRadar(pos: Vector3, dis: number, sessionId: string): boolean {
        let result = false;
        let beScanIds = [];
        this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
            if (!player.isHunter) {
                if (player.HP > 0) {
                    var character = this.GetZepetoNetPlayer(sessionId);
                    let d = Vector3.Distance(pos, character.transform.position);
                    if (d <= dis) {
                        result = true;
                        beScanIds.push(sessionId);
                    }
                }
            }
        })

        if (result) {
            if (sessionId == this.mSessionId) {
                const data = new RoomData();
                data.Add("scanId", this.mSessionId);
                data.Add("beScanIds", JSON.stringify(beScanIds));
                this.SendEvent(sEventArg.BeScan, data);
                let isHunter = this.mPlayerSessionMap.get(this.mSessionId).isHunter;
                if (isHunter) {
                    if (!this.hasShowTip) {
                        this.hasShowTip = true;
                        UIToast.Instance.ShowHunterScan();
                    }
                }
            }
        }
        else {
            this.hasShowTip = false;
        }
        return result;
    }

    /* 游戏逻辑 end */
    * CoDealyOnSyncRomotePlayer(sessionId: string, player: sPlayer) {
        yield new WaitForSeconds(0.1);
        const zepetoCharacter = this.GetCharacter(sessionId);
        this.SetPosition(zepetoCharacter, this.ParseVector3(player.position));
        yield new WaitForSeconds(0.4);
        this.OnStateSync(sessionId, player);
    }

    CheckCanChangeModel(cost: number) {
        let player = this.mPlayerSessionMap.get(this.mSessionId);
        return player.star >= cost;
    }

    OnChangeBuff(character: ZepetoCharacter, buffId: number) {
        // 只有隐藏者可以隐藏buf
        if (character.transform.childCount <= 1) return;
        if (character.transform.GetChild(1) == null) return;

        console.log("OnChangeBuff!!!!" + buffId);

        var model = character.transform.GetChild(1).gameObject;
        if (model == null) {
            console.error("model is null!!!!");
            return;
        }

        let go = PoolManager.Instance.Spawn(mChangeModelFX);
        go.transform.position = character.transform.position;
        switch (buffId) {
            case BuffState.None:
                // 恢复
                model.SetActive(true);
                this.TryHideModel(model, false);
                break;
            case BuffState.Hide:
                let isHunter = this.mPlayerSessionMap.get(this.mSessionId).isHunter;
                if (isHunter) {
                    model.SetActive(false);
                } else {
                    this.TryHideModel(model, true);
                }
                break;
        }
    }

    private mHideBuffMatCache: Map<string, Material> = new Map<string, Material>();

    TryHideModel(model: GameObject, isHide: boolean) {
        let meshs = model.GetComponentsInChildren<MeshRenderer>();
        if (isHide) {
            for (var i = 0; i < meshs.length; i++) {
                if (meshs[i].sharedMaterial.name === this.mGoodMat.name) {
                    meshs[i].sharedMaterial = this.mGoodHideMat;
                } else if (meshs[i].gameObject.tag === "Player") {
                    if (!this.mHideBuffMatCache.has(meshs[i].gameObject.name)) {
                        this.mHideBuffMatCache.set(meshs[i].gameObject.name, meshs[i].sharedMaterial);
                    }
                    meshs[i].sharedMaterial = this.mGoodHideMat;
                }
            }
        } else {
            for (var i = 0; i < meshs.length; i++) {
                if (meshs[i].sharedMaterial.name === this.mGoodHideMat.name) {
                    meshs[i].sharedMaterial = this.mGoodMat;
                } else if (meshs[i].gameObject.tag === "Player") {
                    if (this.mHideBuffMatCache.has(meshs[i].gameObject.name)) {
                        meshs[i].sharedMaterial = this.mHideBuffMatCache.get(meshs[i].gameObject.name);
                    }
                }

            }
        }
    }


    // 更换模型
    readonly DEF_MODEL: number = 99;
    readonly DEF_DIE_MODEL: number = 100;

    OnChangeModelCamera(modelId: number) {
        if (this.mGameState < GameState.GameStart) {
            if (modelId != this.DEF_MODEL) {  // 物品视角
                this.mHunterCamera.transform.localPosition = new Vector3(0, 0, -0.5);
                this.SetHunterCamera(false);
                this.OnSetPlayerInfoByVO(this.mSessionId, PlayerRole.Hider);
            } else {
                this.mHunterCamera.transform.localPosition = this.mHunterCameraPos;
                this.SetHunterCamera(true);
                this.OnSetPlayerInfoByVO(this.mSessionId, PlayerRole.Free);
            }
        }
    }


    OnChangeModel(character: ZepetoCharacter, modelId: number) {
        var body = character.transform.GetChild(0);
        // 显示身体
        for (var i = 0; i < body.childCount; i++) {
            body.GetChild(i).gameObject.SetActive(true);
        }
        this.HideAllTeamSign();
        this.SetTeamSignVisible();

        // 变身特效
        if (this.DEF_MODEL != modelId) {
            let go = PoolManager.Instance.Spawn(mChangeModelFX);
            go.transform.position = character.transform.position;
        }

        // console.log("OnChangeModel", modelId, character.transform.childCount);
        // 删除模型/移动特效
        if (character.transform.childCount > 1) {
            let model = character.transform.GetChild(1).gameObject;
            let fx = model.transform.Find(mModelRunFX);
            if (fx != null) {
                //PoolManager.Instance.UnSpawn(fx.gameObject);
                GameObject.Destroy(fx.gameObject);
            }
            if (model != null) GameObject.Destroy(model);
        }
        let cc = character.GetComponent<CharacterController>();
        cc.enabled = true;
        let modelInfo: any;
        switch (modelId) {
            case this.DEF_DIE_MODEL:
                for (let i = 0; i < body.childCount; i++) {
                    body.GetChild(i).gameObject.SetActive(false);
                }
                if (character != this.GetCharacter(this.mSessionId)) {        //增加限制，防止本地玩家角色控制器卡死
                    cc.enabled = false;
                }
                console.log("死亡隐身");
                return;
            case this.DEF_MODEL:
                modelInfo = this.GetModelInfoVO(this.DEF_MODEL.toString());
                break;
            default:
                for (let i = 0; i < body.childCount; i++) {
                    body.GetChild(i).gameObject.SetActive(false);
                }
                let modelPrefab = this.mGoods[modelId];
                let model = GameObject.Instantiate<GameObject>(modelPrefab, character.transform);
                model.SetActive(true);
                model.transform.localPosition = Vector3.zero;
                modelInfo = this.GetModelInfoVO(modelPrefab.name);
                let fx_run = PoolManager.Instance.CreatePrefab(mModelRunFX);
                if (fx_run != null) {
                    fx_run.transform.SetParent(model.transform);
                    fx_run.transform.localPosition = Vector3.zero;
                    fx_run.transform.localEulerAngles = Vector3.zero;
                }
                break;
        }
        cc.skinWidth = modelInfo.radius * 0.1;
        cc.center = new Vector3(0, modelInfo.centerY, 0);
        cc.radius = modelInfo.radius;
        cc.height = modelInfo.height;
        console.log(`更改模型 ID = ${modelId}, height = ${cc.height}, radius = ${cc.radius}, center = ${cc.center}`);


    }

    /* UpdatePlayerInfo */

    Obj2Map(obj) {
        let strMap = new Map<number, sPlayerInfo>();

        for (let k of Object.keys(obj)) {
            strMap.set(Number(k), obj[k]);
        }
        return strMap;
    }

    public SetSessionId(sessionId: string) {
        this.mSessionId = sessionId;
    }

    // 实例化玩家
    public UpdatePlayerInfo(playerMapJson: string) {
        let playerObj = JSON.parse(playerMapJson);
        let playerMap = this.Obj2Map(playerObj);

        let join = new Map<number, sPlayerInfo>();
        let leave = new Map<number, sPlayerInfo>(this.mPlayerInfoMap);
        //console.error(playerMapJson);
        playerMap.forEach((_player: sPlayerInfo, _id: number) => {
            if (_id > 0) {
                if (!this.mPlayerInfoMap.has(_id)) {
                    join.set(_id, _player);
                }
                // if(this.mId == _id){
                //     this.OnActionEvent(ActionEvent.OnUpdateHP, _player.HP);
                // }
            }
            leave.delete(_id);
        })
        this.mPlayerInfoMap = playerMap;
        join.forEach((_player: sPlayerInfo, _id: number) => {
            this.CreatePlayer(_player.sessionId, _player.userId, _id);
            this.mPlayerGameStatusMap.set(_id, new PlayerGameStatus());
        });
        leave.forEach((_player: sPlayerInfo, _id: number) => {
            this.RemovePlayer(_player.sessionId, _id);
            this.mPlayerGameStatusMap.delete(_id);
        });

        // this.OnActionEvent(ActionEvent.OnUpdatePlayerNum, this.mPlayerInfoMap.size - 1);
    }

    /* CreatePlayer */

    CreatePlayer(sessionId: string, userId: string, id: number) {
        let spawnInfo: SpawnInfo = new SpawnInfo();
        let player = this.mPlayerSessionMap.get(sessionId);
        if (player == null) {
            this.mPlayerInfoMap.delete(id);
            console.log("no session info");
        }
        else {
            // id 从1开始，0被占用
            let sp = this.GetStartPoint(id - 1, PlayerRole.Free);
            let pos = this.ParseVector3(player.position);
            spawnInfo.position = pos;   // 位置从服务器同步
            sp.rot = this.DecodeVector3(sp.rot);
            spawnInfo.rotation = Quaternion.Euler(sp.rot.x, sp.rot.y, sp.rot.z);
            ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, userId, spawnInfo, sessionId == this.mSessionId);
            if (sessionId == this.mSessionId) {
                this.mInitCameraAngle = this.DecodeVector3(sp.camAngle);
                this.mId = player.id;
                this.mUserId = userId;
            }
        }

    }

    RemovePlayer(sessionId: string, id: number) {
        ZepetoPlayers.instance.RemovePlayer(sessionId);
        if (this.mPlayerSessionMap.has(sessionId)) {
            this.mPlayerSessionMap.delete(sessionId);
        }
        if (this.mPlayerInfoMap.has(id)) {
            this.mPlayerInfoMap.delete(id);
        }
        if (this.mZepetoNetPlayerMap.has(sessionId)) {
            this.mZepetoNetPlayerMap.delete(sessionId);
            this.mLoadedPlayerNum--;
        }
    }

    GetPlayer(sessionId: string): ZepetoPlayer {
        if (ZepetoPlayers.instance.HasPlayer(sessionId)) {
            return ZepetoPlayers.instance.GetPlayer(sessionId);
        }
        return null;
    }

    GetCharacter(sessionId: string): ZepetoCharacter {
        if (ZepetoPlayers.instance.HasPlayer(sessionId)) {
            return ZepetoPlayers.instance.GetPlayer(sessionId).character;
        }
        return null;
    }

    GetZepetoNetPlayer(sessionId: string): ZepetoNetPlayer {
        if (this.mZepetoNetPlayerMap.has(sessionId)) {
            return this.mZepetoNetPlayerMap.get(sessionId);
        }
        return null;
    }

    SetPosition(character: ZepetoCharacter, position: Vector3) {
        character.transform.position = position;
    }

    private EncodeVector3(v3: Vector3): Vector3 {
        return new Vector3
            (
                Math.round(v3.x * 100),
                Math.round(v3.y * 100),
                Math.round(v3.z * 100)
            );
    }

    private DecodeVector3(v3: Vector3): Vector3 {
        return new Vector3
            (
                v3.x * 0.01,
                v3.y * 0.01,
                v3.z * 0.01
            );
    }

    private ParseVector3(vector3: sVector3): Vector3 {
        return new Vector3
            (
                vector3.x * 0.01,
                vector3.y * 0.01,
                vector3.z * 0.01
            );
    }

    public CheckPlayerInSectorArea(aHunterblood: number, aAngle: number, aDis: number) {
        let distance = aDis;
        let angle = aAngle;
        let localply = this.LocalPlayer.character.gameObject;
        // let ply = GameObject.Find("aaron");//test
        for (let entry of this.mPlayerSessionMap.entries()) {
            let ply = this.GetPlayer(entry[0]).character.gameObject;

            let b = TransformHelper.SectorCheck(localply, ply, distance, angle);

            // let ref = $ref<RaycastHit>();
            // let hitInfo: RaycastHit[];
            // Debug.DrawLine(this.mLocalZepetoNetPlayer.objLight.transform.position, ply.transform.position, Color.red);

            if (b && localply.name != ply.name) {
                console.log("扇形检测到");
                // let direction = ply.transform.position - this.mLocalZepetoNetPlayer.objLight.transform.position;
                // let direction = this.mLocalZepetoNetPlayer.objLight.transform.forward;
                // hitInfo = Physics.RaycastAll(this.mLocalZepetoNetPlayer.objLight.transform.position,
                //     direction, distance);

                // if (hitInfo.length > 0) {
                //     // hitInfo = $unref(ref);
                //     let minLoop = Math.min(5, hitInfo.length);
                //     for (let i = 0; i < minLoop; i++) {
                //         console.log("射线检测到====" + i + "  " + hitInfo[i].transform.name + "|| tag:" + hitInfo[i].transform.tag);
                //         // if (hitInfo[i].transform.parent && hitInfo[i].transform.parent.tag == "DMMItem") {
                //         //扫描到人后，反推之前是不是有墙
                //         if (hitInfo[i].transform.tag == "Wall") {
                //             return;
                //         }
                //     }
                // }
                console.log("触发伤害");
                this.OnShootExplosion(ply, localply, aHunterblood);
            }

        }
    }

    OnShootExplosion(target: GameObject, Killer: GameObject, hunterBlood: number) {
        console.log("攻击爆炸到玩家: ", target.name);
        if (this.mGameState >= GameState.OpenDoor) {
            let targetId: number = Number(target.name);
            let killerId: number = Number(Killer.name)
            let playerInfo = this.mPlayerInfoMap.get(targetId);
            let player = this.mPlayerSessionMap.get(playerInfo.sessionId);
            if (!player.isHunter) {
                const data = new RoomData();
                data.Add("targetId", targetId);
                data.Add("killerId", killerId);
                data.Add("huntblood", hunterBlood);
                data.Add("id", this.mId);
                this.SendEvent(sEventArg.BeAttacked, data);
            }
        }
    }

    GetMyRoundScore(): number {
        let player = this.GetLocalPlayer();
        if (this.mPlayerInfoMap.has(player.id)) {
            let playerInfo = this.mPlayerInfoMap.get(player.id);
            return playerInfo.roundScore;
        }
        return 0;
    }
    showScaneRound(zptPlayer: ZepetoNetPlayer) {
        try {
            let character = this.GetZepetoNetPlayer(this.mSessionId);
            let radar = PoolManager.Instance.Spawn(mRadarInFX);
            radar.name = mRadarInFX;
            radar.transform.SetParent(character.transform);
            radar.transform.localPosition = Vector3.zero;
            radar.GetComponent<RadarController>().mSessionId = this.mSessionId;
            // let isHunter = this.mPlayerSessionMap.get(this.mSessionId).isHunter;
        } catch (err) {
            console.error(err);
        }
    }
    SyncSuperLightAction(msg: string) {
        var d = msg.split("|");
        if (d[0] != this.mSessionId) {
            // let netPlayer = this.GetZepetoNetPlayer(d[0]);
            let sta = Number(d[1]);
            let sid = d[0];
            // netPlayer.SetSuperLightAction(sta);
            let character = this.GetZepetoNetPlayer(sid);
            if (sta == LightState.OFF) {
                PoolManager.Instance.UnSpawn(character.transform.Find(mRadarInFX).gameObject);
            } else {
                let radar = PoolManager.Instance.Spawn(mRadarInFX);
                radar.name = mRadarInFX;
                radar.transform.SetParent(character.transform);
                radar.transform.localPosition = Vector3.zero;
                radar.GetComponent<RadarController>().mSessionId = sid;
            }
        }

    }

    CloseScaneRound() {
        let character = PlayerManager.Instance.GetZepetoNetPlayer(PlayerManager.Instance.mSessionId);

        if (character != null) {
            character.StopMoving();
            let rader = character.transform.Find(mRadarInFX);
            if (rader != null) PoolManager.Instance.UnSpawn(rader.gameObject);
        }
    }
    ResetSuperLight() {

        this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
            let character = this.GetZepetoNetPlayer(sessionId);
            if (character.transform.Find(mRadarInFX))
                PoolManager.Instance.UnSpawn(character.transform.Find(mRadarInFX).gameObject);
        });


    }
}