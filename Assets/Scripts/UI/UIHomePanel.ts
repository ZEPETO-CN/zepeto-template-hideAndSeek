import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Button, Image, Text, Toggle } from "UnityEngine.UI"
import { Color, GameObject, Input, KeyCode, Time } from 'UnityEngine'
// import ActionItem from "./ActionBar/ActionItem"
import UIManager from "../GameManager/UIManager";
import { sGameInfo, sPlayer } from "ZEPETO.Multiplay.Schema";
import UIHPBar from "../UI/UIHPBar"
import UIRandomModelPanel from "../UI/UIModelRandomPanel"
import UIWatchGameView, { WatchGameNode } from "../UI/UIWatchGameView"
import { GameRule } from '../GameMain';
import UIToast from './UIToast';
import { GameState } from '../GameManager/NetManager';
import PlayerManager from '../GameManager/PlayerManager';
import ScreenshotManager from '../../CommonModules/Screenshot/Scripts/ScreenshotManager';

export default class UIHomePanel extends ZepetoScriptBehaviour {

    public mHunterOptionPanel: GameObject;
    public mHiderOptionPanel: GameObject;
    public mRandomModelPanel: GameObject;
    //public mTutorialPanel: GameObject;
    public mMiddleGameInfo: GameObject;
    public mWatchPanel: GameObject;


    public mChangeModelBtn: GameObject;
    public mChangeModelPanel: GameObject;

    public mShootBtn: Button;
    public mBuffBtn: Button;
    public mTimerText: Text;
    public mHP: GameObject;
    public mHiderNumText: Text;
    public mStarText: Text;

    public mLockViewToggle: Toggle;
    public mFreeCameraToggle: Toggle;
    // public mDieFreeCameraToggle: Toggle;
    public mZemBtn: Button;
    public mTestBtn: Button;

    private mGameLeftTime: number;
    private mCurHP: number;
    private mIsHunter: boolean;
    private mHPBar: UIHPBar;
    public mImgBuffCD: Image;
    private mCurBufCDTime: number;
    private mTargetBufCDTime: number;
    private mBuffCD: number = 20;
    private mIsBuffCD: boolean;
    private readonly BUF_HIDE: number = 1;

    Awake() {
        this.mLockViewToggle.onValueChanged.AddListener((v) => {
            UIManager.Instance.OnLockView(v);
        });

        this.mFreeCameraToggle.onValueChanged.AddListener((v) => {
            UIManager.Instance.OnFreeCamra(v);
            // 自由视角下 隐藏 锁定按钮
            this.mLockViewToggle.gameObject.SetActive(!v);
        });

        // this.mDieFreeCameraToggle.onValueChanged.AddListener((v) => {
        //     console.log("mDeadFreeCameraToggle", v);
        //     UIManager.Instance.OnFreeCamra(v);
        //     if (v) {
        //         PlayerManager.Instance.CancleWaterCamera();
        //     } else {
        //         PlayerManager.Instance.WatchCamera(true, PlayerManager.Instance.saveSessionId);
        //     }
        // });

        this.mHPBar = this.mHP.GetComponent<UIHPBar>();

        // this.mShootBtn.onClick.AddListener(() => {
        //     UIManager.Instance.OnShoot();
        // });

        this.mBuffBtn.onClick.AddListener(() => {
            this.OnBuffCD();
            UIManager.Instance.OnUseBuff(this.BUF_HIDE);
        });

        this.mTestBtn.onClick.AddListener(() => {
            // UIManager.Instance.ShowDailyRewardPanel(100);
            // ScreenshotManager.Instance.CreateFeedImmediately();
        })

        this.mZemBtn.onClick.AddListener(() => {
            UIManager.Instance.mZemPanel.SetActive(true);
        });
    }

    private TestDieWatchView() {
        let data = new Map<string, WatchGameNode>();
        let node = new WatchGameNode();
        node.sessionId = "test1";
        node.name = "test1";
        node.isLive = true;
        data.set(node.sessionId, node);
        node = new WatchGameNode();
        node.sessionId = "test2";
        node.name = "test2";
        node.isLive = true;
        data.set(node.sessionId, node);
        node = new WatchGameNode();
        node.sessionId = "test3";
        node.name = "test3";
        node.isLive = true;
        data.set(node.sessionId, node);

        this.OnDie(data);
    }

    Update() {
        if (Input.GetKeyDown(KeyCode.Q)) {
            this.mHunterOptionPanel.SetActive(true);
        }
        this.UpdateBuffCD();
    }

    public Init() {
        this.mHunterOptionPanel.SetActive(false);
        this.mHiderOptionPanel.SetActive(false);
        this.mMiddleGameInfo.SetActive(false);
        this.mFreeCameraToggle.gameObject.SetActive(false);
        this.mShootBtn.gameObject.SetActive(true);
        this.mStarText.transform.parent.gameObject.SetActive(true);
        this.mBuffBtn.gameObject.SetActive(false);
        this.mHiderNumText.text = "0";
        this.mBuffBtn.interactable = true;
        this.mHP.SetActive(false);

        this.mWatchPanel.SetActive(false);
        // this.mDieFreeCameraToggle.gameObject.SetActive(false);
    }

    public OnDie(data: any) {
        // this.mFreeCameraToggle.gameObject.SetActive(true);
        // this.mDieFreeCameraToggle.gameObject.SetActive(true);
        // this.mDieFreeCameraToggle.isOn = true;        
        let watchData = data.watchData;
        let isSelf = data.isSelf;
        if (isSelf) {
            // this.mWatchPanel.SetActive(true); //观战列表隐藏不显示了
            this.mHiderOptionPanel.SetActive(false);
            UIToast.Instance.ShowHiderDead();
            PlayerManager.Instance.DieFreeCamera();
        }
        // this.mWatchPanel.GetComponent<UIWatchGameView>().UpdateContentData(watchData);
    }

    public UpdateStar(curStar: number) {
        if (curStar == null) return;
        this.mStarText.text = curStar.toString();
    }

    public UpdateBuff(buffNum: number) {
        console.log("更新隐身buff数量", buffNum);

        if (buffNum <= 0) {
            this.mBuffBtn.interactable = false;
            this.mBuffBtn.gameObject.SetActive(false);
            this.mIsBuffCD = false;
        } else {
            if (!this.mIsBuffCD) {
                this.mBuffBtn.interactable = true;
                this.mBuffBtn.gameObject.SetActive(true);
                this.mImgBuffCD.fillAmount = 1;
            }
        }
    }

    private OnBuffCD() {
        this.mImgBuffCD.fillAmount = 0;
        this.mIsBuffCD = true;
        this.mCurBufCDTime = 0;
        this.mBuffBtn.interactable = false;
        this.mTargetBufCDTime = this.mGameLeftTime - this.mBuffCD;
    }

    public UpdateBuffCD() {
        if (this.mIsBuffCD && this.mBuffBtn.enabled) {
            this.mCurBufCDTime += Time.deltaTime;
            this.mImgBuffCD.fillAmount = this.mCurBufCDTime / this.mBuffCD;
            if (this.mCurBufCDTime >= this.mBuffCD || this.mGameLeftTime <= this.mTargetBufCDTime - 1) {
                this.mImgBuffCD.fillAmount = 1;
                this.mIsBuffCD = false;
                this.mCurBufCDTime = 0;
                this.mBuffBtn.interactable = true;
            }
        }
    }


    public InitMaxHP(maxHP: number, peakHP: number) {
        this.mHPBar.InitHPBar(maxHP, peakHP);
    }

    public UpdateUP(curHP: number): boolean {
        let isBeAttacked: boolean = false;
        if (!this.mHP.activeSelf) {
            this.mHP.SetActive(true);
        }
        if (curHP < this.mCurHP) {
            isBeAttacked = true;
        }
        this.mCurHP = curHP;
        this.mHPBar.SetValue(curHP);
        return isBeAttacked;
    }

    public UpdateUI(findNumber: number, hideNumber: number) {
        let showNumber = hideNumber.toString();
        if (hideNumber < 10 && hideNumber > 0) {
            showNumber = "0" + showNumber;
        }
        this.mHiderNumText.text = showNumber;
    }

    public OnGameWait() {
        this.mChangeModelBtn.SetActive(true);
    }

    public OnGameReady() {
        this.Init();
    }

    private OnUpdateOperatePanel(gameInfo: sGameInfo, player: sPlayer) {
        if (gameInfo == null) return;

        //console.log("OnUpdateOperatePanel");

        if (gameInfo.GameState >= GameState.GameStart) {
            this.mMiddleGameInfo.SetActive(true);
            this.mChangeModelBtn.SetActive(false);
            this.mChangeModelPanel.SetActive(false);

            if (player == null) return;

            if (!player.isHunter) {
                this.mHunterOptionPanel.SetActive(false);
                let isDie = player.HP <= 0;
                this.mHiderOptionPanel.SetActive(!isDie);
                // this.mWatchPanel.SetActive(isDie);
                // this.mDieFreeCameraToggle.gameObject.SetActive(isDie);
                this.UpdateBuff(player.buffNum);
            }
            else {
                this.mHunterOptionPanel.SetActive(true);
                this.mHiderOptionPanel.SetActive(false);
            }
        }
    }


    public OnGameStart(gameInfo: sGameInfo, gameRule: GameRule, player: sPlayer) {
        this.mBuffCD = gameRule.buffCD;

        //this.mTutorialPanel.SetActive(false);
        this.mMiddleGameInfo.SetActive(true);
        this.mChangeModelBtn.SetActive(false);
        this.mChangeModelPanel.SetActive(false);
        this.mLockViewToggle.isOn = false;
        this.mFreeCameraToggle.isOn = false;

        this.mIsHunter = player.isHunter;
        if (!this.mIsHunter) {
            this.mHunterOptionPanel.SetActive(false);
            this.mHiderOptionPanel.SetActive(true);
            this.UpdateBuff(player.buffNum);
            // console.error("当前血量：", player.HP, "目标模型", player.targetModel);
            //this.UpdateUP(player.HP);
            this.OpenRandomModelPanel(player.targetModel);
            this.mLockViewToggle.gameObject.SetActive(true);
            this.InitMaxHP(gameRule.initHP, gameRule.peekHP);
        }
        else {
            this.mHunterOptionPanel.SetActive(true);
            this.mHiderOptionPanel.SetActive(false);
        }
        this.OnGameUpdate(gameInfo, player);
        this.StopAllCoroutines();
    }

    public OnGameUpdate(gameInfo: sGameInfo, player: sPlayer) {
        //console.log("游戏回合时间" + gameInfo.GameLeftTime);
        this.OnUpdateOperatePanel(gameInfo, player);
        if (gameInfo.GameLeftTime != null) {
            this.UpdateGameLeftTime(gameInfo.GameLeftTime);
            this.UpdateUI(gameInfo.HunterNum, gameInfo.HiderNum);
        }
    }

    public OnPeakMoment(addHP: number) {
        this.mCurHP += addHP;
        this.mHPBar.SetValue(this.mCurHP);
        // 开启隐身buf
        this.mBuffBtn.gameObject.SetActive(true);
    }

    public OpenRandomModelPanel(targetModelId: number) {
        this.mRandomModelPanel.GetComponent<UIRandomModelPanel>().Show(targetModelId);
    }

    public HideRandomModelPanel() {
        this.mRandomModelPanel.GetComponent<UIRandomModelPanel>().Hide();
    }

    private UpdateGameLeftTime(time: number) {
        this.mGameLeftTime = time;
        var min = Math.floor(time / 60);
        var sec = time % 60;
        this.mTimerText.text = (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
    }

    public OnGameOver() {
        this.StopAllCoroutines();
        this.Init();
        this.mHunterOptionPanel.SetActive(false);
        this.mHiderOptionPanel.SetActive(false);
    }

    public OnRoundOver() {
        this.StopAllCoroutines();
        this.Init();
        this.SetTimerColor(false);
    }

    //巅峰时刻倒计时变红
    public SetTimerColor(isPeak: boolean) {
        this.mTimerText.color = isPeak ? new Color(255, 0, 0) : new Color(255, 255, 255);
    }

}