import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Text, Slider, Button } from "UnityEngine.UI";
import { Color, GameObject, Mathf, Vector3 } from 'UnityEngine';
import { RoomData } from 'ZEPETO.Multiplay';
import NetManager, { sEventArg } from "../../GameManager/NetManager";
import Localization from '../../Common/Localization/Scripts/Localization';
import ConfigManager from '../../GameManager/ConfigManager';

// const enum DailyTaskType {
//     EnterGameTask = 1,
//     PlayGameNumTask = 2,
//     HunterNumTask = 4,
//     HiderWinTask = 8,
//     PlayTimeTask = 16
// }


// const enum DailyRewardType {
//     One = 1,
//     Two = 2,
//     Three = 4,
//     Four = 8,
// }

// 坑了4小时在UI上，最后没办法重新做了一遍UI

export default class UIDailyTaskPanel extends ZepetoScriptBehaviour {


    private mDailyTaskInfo: any = null;

    private mFullActivityNum: number = 130;

    public mActivityTxt: Text;
    public mActivitySlider: Slider;
    public mRewardRedPoint: GameObject;
    public mTaskPointEffect: GameObject;

    public mRewardGet: GameObject[];               // 待领取UI
    public mRewardCompleted: GameObject[];          // 已领取UI
    public mRewardBtns: Button[];
    public mRewardPoints: GameObject[];

    public mTaskBtns: Button[];
    public mTaskFinishTxt: Text[];
    public mTaskTxt: Text[];

    public mZemClaimBtn: Button;
    public mZemGet: GameObject;
    public mZemCompleted: GameObject;
    public mWeekActivityAmountText: Text;
    public mWeekStatusDesText: Text;
    public mWeekNeedAmountText: Text;
    public mZemAmountText: Text;
    public mWeekActivityEndText: Text;

    private _isClaimingTask = false;

    private _weekNeedAmount: number;

    Awake() {
        this.mZemClaimBtn.onClick.AddListener(() => {
            this.ClickZemClaimBtn();
        });
        let date = new Date();
        let hours = -date.getTimezoneOffset() / 60;
        this.mWeekActivityEndText.text = Localization.Instance.GetLocalizedTextWithParam("Week_activity_1", [hours + ""]);
    }

    UpdateData(dailyTaskInfo: any) {
        if (this.mDailyTaskInfo == null) {

            //console.error(this.mRewardBtns.length, this.mTaskBtns.length);

            for (let i = 0; i < this.mRewardBtns.length; i++) {
                this.mRewardBtns[i].onClick.AddListener(() => {
                    const roomData = new RoomData();
                    roomData.Add("rewardId", this.mDailyRewardType[i]);
                    NetManager.Instance.SendEvent(sEventArg.RequestDailyReward, roomData)
                    console.log("请求获取活跃度奖励", this.mDailyRewardType[i]);
                });
            }

            for (let i = 0; i < this.mTaskBtns.length; i++) {
                this.mTaskBtns[i].onClick.AddListener(() => {
                    this._isClaimingTask = true;
                    const roomData = new RoomData();
                    roomData.Add("taskId", this.mDailyTaskType[i]);
                    NetManager.Instance.SendEvent(sEventArg.RequestDailyTaskReward, roomData)
                    console.log("请求获取任务奖励", this.mDailyTaskType[i]);
                });
            }

            this.mDailyTaskInfo = dailyTaskInfo;
            //console.error(this.mDailyTaskInfo.activity, this.mDailyTaskInfo.dailyRewardState);
            this.mDailyTaskInfo.OnChange += (changeValues) => this.UpdateUI();
            this.UpdateUI();
        }

    }

    UpdateUI() {

        console.log("刷新每日活跃度UI");
        if (this._isClaimingTask) {
            this._isClaimingTask = false;
            if (this.mActivityTxt.text != this.mDailyTaskInfo.activity.toString()) {
                this.PlayActivityEffect();
            }
        }
        this.mActivityTxt.text = this.mDailyTaskInfo.activity.toString();
        this.mActivitySlider.value = this.mDailyTaskInfo.activity / this.mFullActivityNum;

        this.UpdateDailyRewardBtn();
    }

    private PlayActivityEffect() {
        this.mTaskPointEffect.SetActive(false);
        this.mTaskPointEffect.SetActive(true);
    }

    private mDailyRewardType: number[] = [1, 2, 4, 8];         // 奖励enum 值
    private mDailyTaskType: number[] = [1, 2, 4, 8, 16];       // 任务枚举 值
    private mPartActivityArray: number[] = [30, 60, 80, 130];  // 活跃度
    private mDailyTaskProgress: number[] = [1, 4, 8, 8, 30];  // 任务数值

    UpdateDailyRewardBtn() {

        // 如果领取日常奖励1， 显示“Get"
        for (let i = 0; i < this.mDailyRewardType.length; i++) {
            let isReward = (this.mDailyTaskInfo.dailyRewardState & this.mDailyRewardType[i]) > 0;
            this.mRewardCompleted[i].SetActive(isReward);        // 显示 已领取UI
            this.mRewardGet[i].SetActive(false);                // 隐藏 待领取UI
            this.mRewardBtns[i].interactable = !isReward;       // 领取后禁用
        }

        // point 
        let isShowRedPoint: boolean = false;
        for (let i = 0; i < this.mRewardPoints.length; i++) {
            // 显示进度红点
            let isOk = this.mDailyTaskInfo.activity >= this.mPartActivityArray[i];
            this.mRewardPoints[i].SetActive(isOk);
            if (isOk && this.mRewardBtns[i].interactable) {
                isShowRedPoint = true;                       // 显示 红点
                this.mRewardGet[i].SetActive(true);          // 显示 待领取UI
            }
            if (!isOk && this.mRewardBtns[i].interactable) {
                this.mRewardBtns[i].interactable = false;       // 不满足领取条件 按钮禁用
            }

        }


        // 如果不满足条件 ， 任务按钮不可点击
        let curTaskProgress: number[] = [this.mDailyTaskInfo.enterGameNum, this.mDailyTaskInfo.playGameNum,
        this.mDailyTaskInfo.hunterWinNum, this.mDailyTaskInfo.hiderWinNum, Mathf.Floor(this.mDailyTaskInfo.playTimeNum / 60)];

        for (let i = 0; i < this.mDailyTaskProgress.length; i++) {
            let isFinish = (curTaskProgress[i] >= this.mDailyTaskProgress[i]);

            this.mTaskBtns[i].gameObject.SetActive(isFinish);  // 控制显示和隐藏
            this.mTaskFinishTxt[i].text = Localization.Instance.GetLocalizedText("Daily_task_claim");
            let s = this.mDailyTaskProgress[i].toString();
            if (isFinish) {

                this.mTaskTxt[i].text = s + "/" + s;
            } else {
                this.mTaskTxt[i].text = curTaskProgress[i] + "/" + s;
            }
        }

        // 任务按钮 领取后隐藏, 文字显示 "已完成" 
        for (let i = 0; i < this.mDailyTaskType.length; i++) {
            let isReward = (this.mDailyTaskInfo.taskRewardState & this.mDailyTaskType[i]) > 0;
            if (isReward) {
                this.mTaskBtns[i].gameObject.SetActive(!isReward);  // 领奖后隐藏                                
                this.mTaskFinishTxt[i].text = Localization.Instance.GetLocalizedText("Daily_task_completed");
            }
            if (!isReward && this.mTaskBtns[i].gameObject.activeSelf) {
                isShowRedPoint = true;
            }
        }
        this.mRewardRedPoint.SetActive(isShowRedPoint);
    }

    private ClickZemClaimBtn() {
        const roomData = new RoomData();
        NetManager.Instance.SendEvent(sEventArg.ClaimWeekActivityReward, roomData)
        console.log("请求每周活跃度奖励");
    }

    UpdateWeekActivity(weekActivityInfo: any) {
        console.log("刷新每周活跃度UI");
        this._weekNeedAmount = ConfigManager.WEEK_NEED_ACTIVITY.activityValue;
        this.mWeekNeedAmountText.text = this._weekNeedAmount + "";
        this.mZemAmountText.text = ConfigManager.WEEK_NEED_ACTIVITY.rewardValue + "";
        this.mWeekStatusDesText.text = "可领取";
        this.mWeekActivityAmountText.text = weekActivityInfo.activity + "";
        this.RefreshWeekRewardStatus(weekActivityInfo.activity, weekActivityInfo.claimCount);
    }

    private RefreshWeekRewardStatus(activity: number, claimCount: number) {
        let status = 0; //0：不可领取 1：可领取 2：已领取        
        if (activity >= this._weekNeedAmount * (claimCount + 1)) {
            status = 1;
        }
        else {
            if (claimCount > 0) {
                status = 2;
            }
            else {
                status = 0;
            }
        }
        this.mZemGet.SetActive(false);
        this.mZemCompleted.SetActive(false);
        this.mZemClaimBtn.interactable = false;
        if (status == 0) {
            // this.mWeekStatusDesText.text = "未达到";
            // this.mZemAmountText.color = new Color(0.6, 0.6, 0.6, 1);
        }
        else if (status == 1) {
            this.mZemGet.SetActive(true);
            // this.mWeekStatusDesText.text = "可领取";
            // this.mZemAmountText.color = new Color(0.98, 0.42, 0.3, 1);
            this.mZemClaimBtn.interactable = true;
        }
        else if (status == 2) {
            this.mZemCompleted.SetActive(true);
            // this.mWeekStatusDesText.text = "已领取";
            // this.mZemAmountText.color = new Color(0.98, 0.42, 0.3, 1);
        }
    }

    OnEnable() {
        this.mTaskPointEffect.SetActive(false);
    }
}