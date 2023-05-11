import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import * as UnityEngine from "UnityEngine"
import {
    GameObject,
    Animator,
    CharacterController,
    KeyCode,
    Mathf,
    Time,
    Vector3,
    Rigidbody,
    RigidbodyConstraints,
    Collider,
    CollisionDetectionMode
} from "UnityEngine"

// import { NavMeshAgent, NavMesh } from "UnityEngine.AI"
enum AnimatorState {
    None = 0,   // 停止移动
    Forward = 1,
    Back = 2,
    Left = 3,
    Right = 4,
}

class MoveDataPackage {
    public uiMoveDir: number;
    public angle_y: number;
    public curPos: Vector3;
    public targetPos: Vector3;
}


// 表现层
/*
  200ms 延迟内
  RenderFPS = 60 |  Logic FPS = 16, 66ms
  理论上60毫秒处理一个数据包
  移动数据包：
  动画+目标位置
 */

export default class CustomCharacterController extends ZepetoScriptBehaviour {

    private mAnimator: Animator;
    private mCharacterController: CharacterController;
    private mRigidbody: Rigidbody;
    // private mNavAgent : NavMeshAgent;
    private Animator_Param_State: string = "Move";
    public mIsLocal: boolean = false;

    private mIsMoveing: boolean;
    private mIsJumping: boolean;
    private mGravityVelocity: Vector3 = Vector3.zero;
    private mMoveDir: Vector3 = Vector3.zero;
    private mMoveTarget: Vector3;

    private mCurMoveSpeed: number = 0;
    private mMinMoveDis: number = 0.05;
    private mMaxLerpDis: number = 3;
    //private mMoveAccelerate : number = 3;

    private mTimer: number = 0;
    private mMaxMoveTime: number = 0.5;
    public mRunSpeed: number = 0.5;
    public mJumpPower: number = 8;
    public mGravity: number = 30;
    private mGravitySpeed: number = -10;

    //private  TEMP_FRAME_COUNT : number = 0;
    private mIsModel: boolean = false;
    public mTargetModel: GameObject = null;

    Awake() {
        this.mAnimator = this.gameObject.GetComponentInChildren<Animator>();
        this.mCharacterController = this.gameObject.GetComponent<CharacterController>();
        this.mGravityVelocity.y = this.mGravitySpeed;
    }

    // FixedUpdate(){
    //     this.OnFixedMove();
    // }

    Update() {
        this.OnJump();
        this.OnMove();
    }

    OnChangeModel(target: GameObject) {
        let isModel = target != null;
        this.mTargetModel = target;
        this.mIsModel = isModel;
        this.mCharacterController.enabled = !isModel;
        if (isModel) {

            this.mTargetModel.transform.eulerAngles = this.transform.eulerAngles;
            this.mRigidbody = target.AddComponent<Rigidbody>();
            this.mRigidbody.useGravity = true;
            this.mRigidbody.mass = 100;
            this.mRigidbody.drag = 0;
            this.mRigidbody.angularDrag = 0;
            this.mRigidbody.collisionDetectionMode = CollisionDetectionMode.Continuous;
            this.mRigidbody.constraints = RigidbodyConstraints.FreezeRotation;
        }
    }

    Jump() {
        if (!this.mIsJumping) {
            this.mAnimator.SetTrigger("Jump");
            this.mGravityVelocity.y = this.mJumpPower;
            this.mIsJumping = true;
            console.log("开始Jump");

        }
    }

    OnJump() {
        if (this.mIsJumping) {
            this.mGravityVelocity.y -= this.mGravity * Time.deltaTime;
            // if(this.mIsModel){
            //     this.mRigidbody.velocity = this.mGravityVelocity * 0.6;  // 限制速度
            //     this.transform.position = this.mTargetModel.transform.position;
            // }
            if (this.mGravityVelocity.y < this.mGravitySpeed) {
                this.mIsJumping = false;
                console.log("停止Jump");
                if (this.mIsModel) {
                    this.mRigidbody.velocity = Vector3.zero;
                }
            }
        }

        if (!this.mIsModel) {
            this.mCharacterController.Move(Vector3.op_Multiply(this.mGravityVelocity, Time.deltaTime));
        }
    }

    OnMove() {

        if (!this.mIsModel) {
            if (this.mIsMoveing) {
                this.mTimer += Time.deltaTime;
                if (this.mTimer > this.mMaxMoveTime) {
                    this.StopMoving();
                }
                this.mCharacterController.Move(Vector3.op_Multiply(this.mMoveDir, (this.mCurMoveSpeed * Time.deltaTime)));
            }
        }
    }

    OnFixedMove() {
        if (this.mIsModel) {
            if (this.mIsMoveing) {
                this.mTimer += Time.fixedDeltaTime;
                if (this.mTimer > this.mMaxMoveTime) {
                    this.StopMoving();
                }
                let v = Vector3.op_Multiply(this.mMoveDir, this.mCurMoveSpeed * Time.fixedDeltaTime);
                // if(this.mIsJumping){
                //     v.y = this.mRigidbody.velocity.y * Time.fixedDeltaTime;
                // }else{
                //     v.y = 0;
                // }

                let newPos = Vector3.op_Addition(this.mRigidbody.transform.position, v);
                this.mRigidbody.MovePosition(newPos);
                this.transform.position = this.mTargetModel.transform.position;
            }
        }

    }


    HandleMoveData(data: MoveDataPackage) {
        this.mAnimator.SetInteger(this.Animator_Param_State, data.uiMoveDir);
        this.PushAngelData(data.angle_y);
        this.mCurMoveSpeed = this.GetSpeed(data.uiMoveDir);

        let ddis = Vector3.Distance(this.transform.position, data.curPos);

        if (ddis >= this.mMaxLerpDis) {
            this.transform.position = data.curPos;
            console.error("发生抖动： " + ddis);
        } else if (ddis / this.mCurMoveSpeed > (this.mMaxMoveTime + 0.1)) {
            this.mCurMoveSpeed *= 1.1;  // 防止抖动
        }

        this.mIsMoveing = true;
        this.mMoveTarget = data.targetPos;
        this.mMoveDir = (data.targetPos - data.curPos).normalized;
        this.mTimer = 0;
        this.OnMove();
    }

    GetSpeed(uiMoveDir: number) {
        switch (uiMoveDir) {
            case AnimatorState.Forward:
                return this.mRunSpeed;
                break;
            case AnimatorState.Back:
                return this.mRunSpeed * 0.5;
                break;
            case AnimatorState.Left:
                return this.mRunSpeed * 0.8;
                break;
            case AnimatorState.Right:
                return this.mRunSpeed * 0.8;
                break;
        }
    }


    StopMoving() {
        this.mAnimator.SetInteger(this.Animator_Param_State, 0);
        this.mIsMoveing = false;
        this.mCurMoveSpeed = 0;
        this.mTimer = 0;
        // if(this.mIsModel) {
        //     this.mRigidbody.velocity = Vector3.zero;
        // }

        console.log("stopMoving!");
        // todo
    }

    // 处理数据
    PushMoveData(uiMoveDir: number, angle_y: number, curPos: Vector3, targetPos: Vector3) {
        if (uiMoveDir == 0) {   // 目标点
            this.PushAngelData(angle_y);
            if (this.CheckReachedTarget(targetPos)) {
                this.transform.position = targetPos;
                console.log("到达目标点");
                this.StopMoving();
            }
            else {
                this.mMoveDir = (targetPos - this.transform.position).normalized;
                let dis = Vector3.Distance(targetPos, this.transform.position);
                let tims = dis / this.mCurMoveSpeed;
                this.mTimer = this.mMaxMoveTime - tims;
                //console.warn(dis + " -- " + tims.toString() + " -- ");
            }
        }
        else {
            let data: MoveDataPackage = new MoveDataPackage();
            data.uiMoveDir = uiMoveDir;
            data.angle_y = angle_y;
            data.curPos = curPos;
            data.targetPos = targetPos;
            this.HandleMoveData(data);
            // console.log(this.TEMP_FRAME_COUNT, " 处理数据");
        }
    }

    CheckReachedTarget(target: Vector3): boolean {
        let x = Math.abs(this.transform.position.x - target.x);
        let z = Math.abs(this.transform.position.z - target.z);
        return (x + z) < this.mMinMoveDis;
    }

    private mToAngle: Vector3 = Vector3.zero;

    public PushAngelData(toAngle: number) {
        this.mToAngle.y = toAngle;
        this.transform.eulerAngles = this.mToAngle;
        // if(this.mIsModel){
        //     this.mTargetModel.transform.eulerAngles = this.mToAngle;
        //     // this.mRigidbody.angularVelocity = ?
        // }
    }

}