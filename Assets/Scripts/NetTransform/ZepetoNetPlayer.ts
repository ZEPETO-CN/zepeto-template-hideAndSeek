import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import Queue, { sNetTransform, ZepetoNetTransformPackage } from "./ZepetoNetTransformPackage";
import { Animator, CharacterController, GameObject, PrimitiveType, Time, Vector2, Vector3, SphereCollider, Transform, Material, MeshRenderer } from "UnityEngine";
import NetManager, { sEventArg } from "../GameManager/NetManager";
import { RoomData } from 'ZEPETO.Multiplay';
import PlayerManager, { LightState } from '../GameManager/PlayerManager';
import IKCtrl from '../Common/IKCtrl';
import UIHunterOperation from '../UI/UIHunterOperation';
import PoolManager from '../GameManager/PoolManager';

enum MoveDirState {
    None = 0,   // 停止移动
    Forward = 1,
    Back = 2,
    Left = 3,
    Right = 4,
    Jump = 5,
}

abstract class ZepetoNetPlayerBase extends ZepetoScriptBehaviour {

    @HideInInspector()
    public MaxLightBattle: number = 10;
    public LightBattle: number = this.MaxLightBattle;
    public mId: number;
    public mIsLocal: boolean = false;
    public mMinMoveDis: number = 0.05;
    public mMaxMoveDis: number = 3;

    //superLight
    public SuperLightCDTime = 60;//60
    public SuperLightCurCDTime = this.SuperLightCDTime;
    public SuperLightMaxUseTimes = 2;//每局使用次数2
    public SuperLightCurTimes = this.SuperLightMaxUseTimes;//当前使用次数

    public MaxSuperLightBattle = 20;//使用持续时间20
    public SuperLightBattle: number = this.MaxSuperLightBattle;
    public bSuperLightOpen: bool = false;
    // 3帧发送一次， 测试包
    // @HideInInspector()
    protected readonly mSendPakRate: number = 3; // 60ms发送一次 = 16.6FPS
    protected mFrameIndex: number = 0;
    // 是否使用预判
    protected mUsePredict: boolean = true;
    // 计帧器
    protected mSendPakCount: number = 0;
    // 网络包 
    protected mSendLocalPackage: ZepetoNetTransformPackage = new ZepetoNetTransformPackage();

    // 动画控制器 角色控制器
    protected mAnimator: Animator;
    protected mCharacterController: CharacterController;
    protected mAnimatorState: number = 0;
    public objLight: GameObject;
    public objSuperLight: GameObject;
    public IKCtrl: IKCtrl;
    public weaponInRoot: Transform;
    public weaponOutRoot: Transform;
    public weaponObj: GameObject;
    public mLightTar: Transform;
    public LightState: number = LightState.OFF;
    public SuperLightState: number = LightState.OFF;

    public lightTime: number = 0;
    public lightSuperTime: number = 0;
    public HandLightObj: GameObject;
    // public TeamSignObj: GameObject;


    private readonly ANIMATOR_STATE_PARAM: string = "Move";

    /**
     * @description: 属性
     */
    public mRunSpeed: number = 0.5;

    // 假设1个参数 特殊逻辑特殊处理
    UpdateAnimatorState(state: number) {
        if (this.mAnimatorState != state) {
            this.mAnimatorState = state;
            switch (state) {
                case MoveDirState.Jump:
                    this.mAnimator.SetTrigger("Jump");
                    break;
                default:
                    this.mAnimator.SetInteger(this.ANIMATOR_STATE_PARAM, this.mAnimatorState);
                    break;
            }
        }
    }

    SendMoveData() {
        this.mSendPakCount++;
        let dataJson = this.mSendLocalPackage.mDatas.toJson(this.mId, this.mSendPakCount);
        this.mSendLocalPackage.mDatas.Clear();
        let roomData = new RoomData();
        roomData.Add("data", dataJson);

        // let lightrot = this.objLight.transform.localRotation.x + ";" +
        //     this.objLight.transform.localRotation.y + ";" +
        //     this.objLight.transform.localRotation.z;
        // let lightRotArray = [this.objLight.transform.localRotation.x, this.objLight.transform.localRotation.y, this.objLight.transform.localRotation.z];
        // let lightRotArray = [];
        // lightRotArray.push(this.objLight.transform.localEulerAngles.x);
        // lightRotArray.push(this.objLight.transform.localEulerAngles.y);
        // lightRotArray.push(this.objLight.transform.localEulerAngles.z);
        // roomData.Add("lightrot", JSON.stringify(lightRotArray));

        NetManager.Instance.SendEvent(sEventArg.PlayerMove, roomData);
    }

    /**
     * @description: 返回移动速度
     */
    protected GetMoveSpeedByDir(moveState: MoveDirState): number {
        let factor: number = 0;
        switch (moveState) {
            case MoveDirState.Forward:
                factor = 1;
                break;
            case MoveDirState.Back:
                factor = 0.5;
                break;
            case MoveDirState.Left:
                factor = 0.8;
                break;
            case MoveDirState.Right:
                factor = 0.8;
                break;
            default:
                factor = 1;
                break;

        }
        return this.mRunSpeed * factor;
    }
}

class ZepetoNetPlayerRemote extends ZepetoNetPlayerBase {
    // 当初处理帧器
    private mCurFrameIndex: number = 0;
    private mMoveCacheData: Queue<ZepetoNetTransformPackage> = new Queue<ZepetoNetTransformPackage>();
    private mCurMoveData: ZepetoNetTransformPackage = null;
    private mRemoteAngle: Vector3 = Vector3.zero;
    private mHasTarget: boolean = false;
    private mTargetData: sNetTransform = null;
    private mTargetPos: Vector3 = Vector3.zero;
    private mLastTargetPos: Vector3 = Vector3.zero;
    private mLerpSum: number = 0;
    private mLerpDis: number = 0;
    private mCurLerp: number = 1;
    private mCurPos: Vector3 = Vector3.zero;
    private mAccelearte: number = 1;
    private readonly mMaxCachaNum: number = 10;
    private readonly mAcceNum: number = 4;

    private mDataPool: Queue<ZepetoNetTransformPackage> = new Queue<ZepetoNetTransformPackage>();

    private GetPackageFromPool(): ZepetoNetTransformPackage {
        if (this.mDataPool.Size() > 0) {
            let data = this.mDataPool.Dequeue();
            return data;
        }
        return new ZepetoNetTransformPackage();
    }

    /**
     * @description: 接受服务器发送过来的数据包
     * @param 
     */

    public ReceiveMoveData(dataJson: string) {
        if (this.mIsLocal) return;
        let data = this.GetPackageFromPool();
        data.ParseJson(dataJson);
        this.AddMoveDataPackage(data);
    }

    private AddMoveDataPackage(pak: ZepetoNetTransformPackage) {
        let cacheSize = this.mMoveCacheData.Size();
        if (cacheSize > this.mMaxCachaNum) {
            console.error("[数据缓存包过多异常] receive lots move cache date!", cacheSize);
            this.mMoveCacheData.Clear();
            this.mAccelearte = 1;
        }
        else if (cacheSize > this.mAcceNum) {
            console.warn("[网络波动导致数据阻塞, 加速lerp] !", cacheSize);
            this.mAccelearte = 2;
        } else {
            this.mAccelearte = 1;
        }

        if (this.mCurFrameIndex > pak.mIndex) {
            console.error("[数据包索引异常] !");
            return;
        }
        this.mMoveCacheData.Enqueue(pak);
    }

    private GetMoveData() {
        if (this.mMoveCacheData.Size() > 0) {
            this.mCurMoveData = this.mMoveCacheData.Dequeue();
            this.mCurFrameIndex = this.mCurMoveData.mIndex;
        } else {
            this.mCurMoveData = null;
        }
    }

    protected RemotePlayerMove() {
        // 获取移动数据
        if (this.mCurMoveData == null) {
            this.GetMoveData();
        } else if (!this.mHasTarget) {
            if (this.mCurMoveData.IsEmpty()) {
                this.mDataPool.Enqueue(this.mCurMoveData);
                this.GetMoveData();
            } else if (this.mCurMoveData.IsCacheData() && this.mMoveCacheData.Size() > 0) {
                this.mDataPool.Enqueue(this.mCurMoveData);
                this.GetMoveData();
            }
        }

        // 模拟移动
        if (this.mCurMoveData != null) {
            this.SimulateMove();
        }
    }

    protected SimulateMove() {
        // 如果没有移动目标
        if (!this.mHasTarget) {
            this.mTargetData = this.mCurMoveData.GetNextPosData();
            if (this.mTargetData != null) {
                this.UpdateAnimatorState(this.mTargetData.s);
                this.GetPosition(this.mTargetData);
                this.transform.eulerAngles = this.GetAngle(this.mTargetData);
                this.mHasTarget = true;
            }
        }
        // 朝着目标点lerp 移动， 角度暂时不考虑lerp
        if (this.mHasTarget) {
            this.transform.position = Vector3.Lerp(this.mCurPos, this.mTargetPos, this.mCurLerp / this.mLerpSum);
            this.mCurLerp++;
        }
        // 如果完成
        if (this.mCurLerp > this.mLerpSum) {
            this.mHasTarget = false;
            this.mCurLerp = 1;
            this.mLerpSum = 1;
        }
    }

    private GetAngle(data: sNetTransform): Vector3 {
        this.mRemoteAngle.y = data.a;
        return this.mRemoteAngle;
    }

    /**
     * @description: 根据物理帧计算！！！
     */
    private GetPosition(data: sNetTransform) {
        this.mTargetPos.x = data.x * 0.01;
        this.mTargetPos.y = data.y * 0.01;
        this.mTargetPos.z = data.z * 0.01;

        this.mLerpDis = Vector3.Distance(this.mTargetPos, this.transform.position);
        if (this.mLerpDis > this.mMaxMoveDis || this.mLerpDis <= this.mMinMoveDis) {
            this.transform.position = this.mTargetPos;
            //console.warn("[瞬移调整位置]");
            this.mLerpSum = 1;
        } else {
            let speed = this.GetMoveSpeedByDir(this.mAnimatorState) * Time.fixedDeltaTime;
            this.mLerpSum = Math.round(this.mLerpDis / (speed * this.mAccelearte));
        }
        this.mCurPos = this.transform.position;
        this.mCurLerp = 1;
        if (this.mLerpSum < 1) this.mLerpSum = 1;
        this.mLastTargetPos = this.mTargetPos;
    }
}


export default class ZepetoNetPlayer extends ZepetoNetPlayerRemote {

    /**
     * @description: 常量
     */
    private readonly mGravity: number = 10;
    private readonly mMaxMoveTime: number = 0.5;

    /**
    * @description: 变量
    */
    @HideInInspector()
    public mJumpPower: number = 8;
    private mCurMoveSpeed: number = 0;
    private mIsMoving: boolean;
    private mIsJumping: boolean;
    private mGravityVelocity: Vector3 = Vector3.zero;
    private mMoveDir: Vector3 = Vector3.zero;
    private mTimer: number = 0;
    private mToAngle: Vector3 = Vector3.zero;

    /**
     * @description: Unity CallBack
     */
    Awake() {
        this.mAnimator = this.GetComponentInChildren<Animator>();
        if (this.mAnimator == null) {
            console.error("Missing Animator!");
        }
        this.mCharacterController = this.GetComponent<CharacterController>();
        if (this.mCharacterController == null) {
            console.error("Missing CharacterController!");
        }
        this.mGravityVelocity.y = -this.mGravity;
    }
    Start() {
        this.InitLight();
    }
    public SetLightObj(obj) {
        this.objLight = obj;
    }
    public SetIKCtrl(ikctrl) {
        this.IKCtrl = ikctrl;
    }
    public GetIKCtrl() {
        return this.IKCtrl;
    }

    InitLight() {
        this.SuperLightCurTimes = this.SuperLightMaxUseTimes;
        this.SuperLightCurCDTime = this.SuperLightCDTime;
        this.LightBattle = this.MaxLightBattle;
        this.SuperLightBattle = this.MaxSuperLightBattle;
        this.bSuperLightOpen = false;
        this.SetLightAction(LightState.OFF);
        this.SetSuperLightAction(LightState.OFF);
        UIHunterOperation.Instance.SetFlashImgOn();
        UIHunterOperation.Instance.SetSuperFlashImgOn();
        PlayerManager.Instance.ResetSuperLight();
    }
    // 逻辑帧
    FixedUpdate() {
        if (this.mIsLocal) {
            this.LockStepData();
        } else {
            this.RemotePlayerMove();
        }
        // if (this.TeamSignObj.activeSelf && this != PlayerManager.Instance.mLocalZepetoNetPlayer) {
        //     let dis = Vector3.Distance(PlayerManager.Instance.mLocalZepetoNetPlayer.transform.position, this.transform.position);
        //     // console.log(dis);
        //     dis = Math.max(dis, 3);
        //     let baseScale = 0.01;
        //     this.TeamSignObj.transform.GetChild(0).transform.localScale =
        //         new Vector3(baseScale * (dis / 4), baseScale, baseScale * (dis / 4));
        // }
    }

    // 渲染帧
    Update() {
        if (this.mIsLocal) {
            this.LocalPlayerMove();
            this.PlayerJump();
        }
        this.UpdateLight();
        this.UpdateSuperLight();
    }

    UpdateLight() {
        if (this.LightState == LightState.ON && this.mIsLocal) {
            this.objLight.transform.LookAt(this.mLightTar);
        }

        this.lightTime += Time.deltaTime;
        if (this.lightTime >= 1) {
            if (this.LightState == LightState.ON) {
                // this.LightBattle--;
                if (this.LightBattle <= 0) {
                    this.LightBattle = 0;
                    this.lightTime = 0;
                    this.SetLightAction(LightState.OFF);
                    PlayerManager.Instance.SendLightState(this.LightState);
                }
            } else {
                if (this.LightBattle < this.MaxLightBattle) {
                    // this.LightBattle += 2;
                }
            }
            this.lightTime = 0;
        }
    }
    UpdateSuperLight() {
        if (!this.bSuperLightOpen) {
            return;
        }
        if (this.SuperLightState == LightState.ON && this.mIsLocal) {
            this.objSuperLight.transform.LookAt(this.mLightTar);
        }

        this.lightSuperTime += Time.deltaTime;
        if (this.lightSuperTime >= 1) {
            if (this.SuperLightState == LightState.ON) {
                this.SuperLightBattle--;
                if (this.SuperLightBattle <= 0) {
                    this.SuperLightBattle = 0;
                    this.lightSuperTime = 0;
                    this.SetSuperLightAction(LightState.OFF);
                    // UIHunterOperation.Instance.SetFlashImgOn();
                    // PlayerManager.Instance.SendLightState(LightState.OFF);
                    PlayerManager.Instance.SendSuperLightState(this.SuperLightState);
                    // this.SetSuperLightCD();
                    // this.SuperLightCurCDTime = 0;
                }
            } else {
                PlayerManager.Instance.CloseScaneRound();
                this.SuperLightBattle = this.MaxSuperLightBattle;
                this.bSuperLightOpen = false
            }
            this.lightSuperTime = 0;
        }
    }

    /**
     * @description: Public 跳跃按钮按下时
     */
    public Jump() {
        if (!this.mIsJumping) {
            this.mGravityVelocity.y = this.mJumpPower;
            this.mIsJumping = true;
            this.UpdateAnimatorState(MoveDirState.Jump);
            this.AddPlayerCurrentData();
            console.log("开始Jump");
        }
    }

    public SetLightAction(state: LightState) {
        if (this.objLight) {
            this.LightState = state;
            this.objLight.SetActive(this.LightState == LightState.ON);
            this.IKCtrl.ikActive = this.objLight.activeSelf;
        }
    }

    public SetSuperLightAction(state: LightState) {
        // if (this.objSuperLight) {
        this.SuperLightState = state;
        //     this.objSuperLight.SetActive(this.SuperLightState == LightState.ON);
        //     this.IKCtrl.ikActive = this.objSuperLight.activeSelf;
        // }
    }

    /**
     * @description: 停止移动
     */
    public StopMoving() {
        if (this.mIsMoving) {
            this.mIsMoving = false;
            this.UpdateAnimatorState(0);
            this.mCurMoveSpeed = 0;
            this.mTimer = 0;
            this.AddPlayerCurrentData();
        }
    }

    /**
     * @description: 尝试移动
     */
    public StartMove(uiMoveDir: Vector2) {
        let moveState = this.CalMoveStateByUI(uiMoveDir);
        this.UpdateAnimatorState(moveState);
        let curForward = Vector3.op_Multiply(this.transform.forward, uiMoveDir.y);
        let curRight = Vector3.op_Multiply(this.transform.right, uiMoveDir.x);
        this.mMoveDir = Vector3.op_Addition(curForward, curRight).normalized;
        this.mCurMoveSpeed = this.GetMoveSpeedByDir(moveState);
        this.mTimer = 0;
        this.mIsMoving = true;


    }

    /**
     * @description: 更新角度
     */
    public UpdateAngel(toAngle: number) {
        this.mToAngle.y = toAngle;
        this.transform.eulerAngles = this.mToAngle;
    }

    private CalMoveStateByUI(uiDir: Vector2): MoveDirState {
        let abs_y = Math.abs(uiDir.y);
        let abs_x = Math.abs(uiDir.x);

        if (abs_y >= abs_x) {
            if (uiDir.y > 0) {
                return MoveDirState.Forward;
            } else {
                return MoveDirState.Back;
            }
        }
        else {
            if (uiDir.x > 0) {
                return MoveDirState.Left;
            } else {
                return MoveDirState.Right;
            }
        }
    }

    /********
     * @description: 物理移动逻辑
     */
    private LocalPlayerMove() {
        if (this.mIsMoving) {
            this.mTimer += Time.deltaTime;
            if (this.mTimer > this.mMaxMoveTime) {
                this.StopMoving();
            }

            if (this.mCharacterController.enabled)
                this.mCharacterController.Move(Vector3.op_Multiply(this.mMoveDir, this.mCurMoveSpeed * Time.deltaTime));
        }
    }

    /**
     * @description: 物理跳跃逻辑
     *********/
    private PlayerJump() {
        if (this.mIsJumping) {
            this.mGravityVelocity.y -= this.mGravity * 2.5 * Time.deltaTime;
            if (this.mGravityVelocity.y < -this.mGravity * 1.5) {
                this.mIsJumping = false;
                if (this.mIsMoving)
                    this.UpdateAnimatorState(MoveDirState.Forward);
                else this.UpdateAnimatorState(MoveDirState.None);
                console.log("停止Jump");
            }
        }
        if (this.mCharacterController.enabled)
            this.mCharacterController.Move(Vector3.op_Multiply(this.mGravityVelocity, Time.deltaTime));
    }

    /**
     * @description: 物理跳跃逻辑
     *********/
    private mHeartDataTimer: number = 0;
    private readonly mHeartDataConst: number = 50;
    LockStepData() {
        this.mFrameIndex++;

        if (this.mIsJumping || this.mIsMoving) {
            this.AddPlayerCurrentData();
        } else {
            this.mHeartDataTimer++;
            if (this.mHeartDataTimer > this.mHeartDataConst) {
                this.AddPlayerCurrentData();
                this.SendMoveData();
            }
        }
        if (this.mFrameIndex >= this.mSendPakRate) {
            this.mFrameIndex = 0;
            if (!this.mSendLocalPackage.IsEmpty()) {
                if (!this.mIsJumping && this.mIsMoving) this.AddPredictData();
                this.SendMoveData();
            }
        }
    }

    AddPlayerCurrentData() {
        this.mHeartDataTimer = 0;
        let data: sNetTransform = new sNetTransform();
        data.SetPosition(this.transform.position)
        data.a = Math.round(this.transform.eulerAngles.y);
        data.s = this.mAnimatorState;
        this.mSendLocalPackage.mDatas.Enqueue(data);
    }

    AddPredictData() {
        let data: sNetTransform = new sNetTransform();
        let nextPosOffset = Vector3.op_Multiply(this.mMoveDir, this.mRunSpeed * Time.fixedDeltaTime);
        let nextPos = Vector3.op_Addition(this.transform.position, nextPosOffset);
        data.SetPosition(nextPos);
        data.a = Math.round(this.transform.eulerAngles.y);
        data.s = this.mAnimatorState;
        this.mSendLocalPackage.mDatas.Enqueue(data);

        let data2: sNetTransform = new sNetTransform();
        nextPosOffset = Vector3.op_Multiply(this.mMoveDir, this.mRunSpeed * Time.fixedDeltaTime * 2);
        let nextPos2 = Vector3.op_Addition(this.transform.position, nextPosOffset);
        data2.SetPosition(nextPos2);
        data2.a = Math.round(this.transform.eulerAngles.y);
        data2.s = this.mAnimatorState;
        this.mSendLocalPackage.mDatas.Enqueue(data2);
    }
    GetLightBattle() {
        return this.LightBattle;
    }

    NetSetTeamSignVisible(b) {
        // this.TeamSignObj.SetActive(b);
        // console.log("NetSetTeamSignVisible", b);
        // if (!b) return;

        // if (this.transform.childCount <= 1) {
        //     return;
        // }

        // let matarr: Material[] = [];
        // let go = this.transform.GetChild(1).gameObject;
        // if (go) {
        //     //隐藏者结构
        //     let gosun = go.transform.GetChild(0).gameObject;
        //     matarr.push(gosun.GetComponent<MeshRenderer>().materials[0]);
        //     matarr.push(PlayerManager.Instance.wallmat);
        //     GameObject.DestroyImmediate(gosun.GetComponent<MeshRenderer>());
        //     let mr = gosun.AddComponent<MeshRenderer>();
        //     mr.materials = matarr;
        //     return;
        // }
    }


}


