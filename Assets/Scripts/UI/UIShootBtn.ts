import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { EventTrigger, } from 'UnityEngine.EventSystems'
import PlayerManager, { LightState } from '../GameManager/PlayerManager'
import { Mathf, Vector2, Time, GameObject } from "UnityEngine";
import { ZepetoCamera } from 'ZEPETO.Character.Controller';
import TransformHelper from '../Common/TransformHelper';
import { Button, Image, Slider } from 'UnityEngine.UI';
import AudioController from '../GameController/AudioController';
import UIHunterOperation from './UIHunterOperation';
import GameMain from '../GameMain'
import NetManager, { sEventArg, GameState } from "../GameManager/NetManager"
export default class UIShootBtn extends ZepetoScriptBehaviour {

    // private mEventTrigger: EventTrigger;
    // private mOffSet: Vector2;
    // private mSpeed: number = 1;
    // private mCamera: ZepetoCamera = null;
    // private mLastPos: Vector2 = Vector2.zero;
    public mCooldownImg: Slider;
    public mTimer: number;
    public ImgHandLine_on: GameObject;
    public ImgHandLine_off: GameObject;
    public Progress: Image;
    public scaneTime: number = 0;
    Start() {
        // this.mEventTrigger = this.gameObject.GetComponent<EventTrigger>();
        // let _PotClick = new Entry();
        // _PotClick.eventID = EventTriggerType.PointerClick;
        // _PotClick.callback.AddListener((eventData: PointerEventData) => {
        this.GetComponent<Button>().onClick.AddListener(() => {
            console.log("_PotClick", this.name);
            let locPlay = PlayerManager.Instance.mLocalZepetoNetPlayer;
            if (this.name == "Flashlight") {
                if (locPlay.LightState == LightState.OFF && locPlay.GetLightBattle() > 0) {
                    AudioController.Instance.PlayOpenLight();

                    locPlay.SetLightAction(LightState.ON);

                    this.ImgHandLine_off.SetActive(false);
                    this.ImgHandLine_on.SetActive(true);
                } else {
                    locPlay.SetLightAction(LightState.OFF);
                    this.ImgHandLine_off.SetActive(true);
                    this.ImgHandLine_on.SetActive(false);
                }
                PlayerManager.Instance.SendLightState(locPlay.LightState);
                this.mCooldownImg.value = (locPlay.LightBattle / locPlay.MaxLightBattle);
                // this.StopCoroutine(this.RunRay());
                // this.StartCoroutine(this.RunRay());
            } else if (this.name == "SuperFlashlight") {//强手电
                if (locPlay.SuperLightCurTimes > 0) {
                    if (locPlay.SuperLightState == LightState.OFF) {
                        // AudioController.Instance.PlayOpenLight();
                        locPlay.SetSuperLightAction(LightState.ON);
                        locPlay.bSuperLightOpen = true;
                        locPlay.SuperLightBattle = locPlay.MaxSuperLightBattle;
                        this.ImgHandLine_off.SetActive(false);
                        this.ImgHandLine_on.SetActive(true);
                        //设置普通手电关闭

                        UIHunterOperation.Instance.SetSuperFlashImgOff();
                        this.mCooldownImg.value = (locPlay.LightBattle / locPlay.MaxLightBattle);
                        PlayerManager.Instance.SendSuperLightState(locPlay.SuperLightState);
                        this.Progress.fillAmount = 1;
                        locPlay.SuperLightCurTimes--;
                        //    if( locPlay.SuperLightCurTimes<=0){
                        //     UIHunterOperation.Instance.ObjSuperLight.SetActive(false);
                        //    }
                        locPlay.SuperLightCurCDTime = 0;
                        PlayerManager.Instance.showScaneRound(PlayerManager.Instance.mLocalZepetoNetPlayer);
                    }
                }
            }
        })
        // this.mEventTrigger.triggers.Add(_PotClick);


        // let _startDragEntry = new Entry();
        // _startDragEntry.eventID = EventTriggerType.EndDrag;
        // _startDragEntry.callback.AddListener((eventData: PointerEventData) => {
        //     this.mLastPos = eventData.position;
        // })
        // this.mEventTrigger.triggers.Add(_startDragEntry);
        // if (!Application.isEditor) this.mSpeed = 0.2;

        // let _endDragEntry = new Entry();
        // _endDragEntry.eventID = EventTriggerType.EndDrag;
        // _endDragEntry.callback.AddListener((eventData: PointerEventData) => {
        //     console.log("拖拽结束 射击");
        //     // UIManager.Instance.OnShoot();
        // })
        // this.mEventTrigger.triggers.Add(_endDragEntry);

        // let _dragEntry = new Entry();
        // _dragEntry.eventID = EventTriggerType.Drag;
        // _dragEntry.callback.AddListener((eventData: PointerEventData) => {
        //     this.mOffSet = (eventData.position - this.mLastPos).normalized;
        //     this.mLastPos = eventData.position;
        //     if (this.mCamera == null) {
        //         this.mCamera = PlayerManager.Instance.LocalCamera;
        //     }
        //     this.mOffSet.y = -this.mOffSet.y;
        //     this.mCamera.Rotate(this.mOffSet * Time.deltaTime * this.mSpeed);
        // })
        // this.mEventTrigger.triggers.Add(_dragEntry);
    }




    Update() {

        if (GameMain.Instance.mGameState == GameState.GameStart && this.name == "SuperFlashlight") {
            this.Progress.fillAmount = 1;
        }

        if (PlayerManager.Instance.mLocalZepetoNetPlayer) {
            if (this.name == "Flashlight") {
                if (PlayerManager.Instance.mLocalZepetoNetPlayer.LightState == LightState.OFF) {
                    if (this.mCooldownImg.value < PlayerManager.Instance.mLocalZepetoNetPlayer.MaxLightBattle) {
                        this.mCooldownImg.value += (Time.deltaTime / (PlayerManager.Instance.mLocalZepetoNetPlayer.MaxLightBattle / 2));
                    }
                } else if (PlayerManager.Instance.mLocalZepetoNetPlayer.LightState == LightState.ON) {
                    if (this.mCooldownImg.value > 0) {
                        this.mCooldownImg.value -= (Time.deltaTime / PlayerManager.Instance.mLocalZepetoNetPlayer.MaxLightBattle);
                    }
                }
                PlayerManager.Instance.mLocalZepetoNetPlayer.LightBattle = this.mCooldownImg.value * PlayerManager.Instance.mLocalZepetoNetPlayer.MaxLightBattle;
                this.mTimer += Time.deltaTime;
                if (this.mTimer >= 1) {
                    this.mTimer = 0;
                    this.ImgHandLine_off.SetActive(
                        PlayerManager.Instance.mLocalZepetoNetPlayer.LightState == LightState.OFF);
                    this.ImgHandLine_on.SetActive(
                        PlayerManager.Instance.mLocalZepetoNetPlayer.LightState == LightState.ON);
                }



                //在此重写扫描逻辑
                this.scaneTime += Time.deltaTime;
                if (PlayerManager.Instance.mLocalZepetoNetPlayer.LightState == LightState.ON && this.scaneTime > 0.2) {
                    this.scaneTime = 0;
                    PlayerManager.Instance.CheckPlayerInSectorArea(20, 20, 3);
                }
            } else {
                if (PlayerManager.Instance.mLocalZepetoNetPlayer.bSuperLightOpen && this.Progress) {
                    if (PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCurTimes <= 0) {
                        this.gameObject.SetActive(false);
                    }
                    if (PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightBattle <= 0) {
                        PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightBattle = PlayerManager.Instance.mLocalZepetoNetPlayer.MaxSuperLightBattle;
                        PlayerManager.Instance.mLocalZepetoNetPlayer.SetSuperLightAction(LightState.OFF);
                    }
                }
                if (PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCurCDTime < PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCDTime) {
                    UIHunterOperation.Instance.SetSuperFlashImgOff();

                    PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCurCDTime += Time.deltaTime;
                    this.Progress.fillAmount = PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCurCDTime / PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCDTime;
                    if (this.Progress.fillAmount == 1) {
                        UIHunterOperation.Instance.SetSuperFlashImgOn();
                        PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCurCDTime = PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCDTime;
                    }
                }
            }
        }
    }

    // * RunRay() {
    //     while (LightState.OFF != PlayerManager.Instance.mLocalZepetoNetPlayer.LightState) {
    //         if (PlayerManager.Instance.mLocalZepetoNetPlayer.LightState == LightState.ON) {
    //             PlayerManager.Instance.CheckPlayerInSectorArea(30, 20, 3);
    //             yield new WaitForSeconds(0.2);
    //         }
    //     }
    // }



    private Vector2ToAngle(input: Vector2): number {
        if (input.x < 0) {
            return 360 - (Mathf.Atan2(input.x, input.y) * Mathf.Rad2Deg * -1);
        } else {
            return (Mathf.Atan2(input.x, input.y) * Mathf.Rad2Deg);
        }
    }


    // public *IE_DoCooldown() {
    //     // this.mBtn.interactable = false;
    //     let timer: number = 0;
    //     // this.mCooldownImg.enabled = true;
    //     while (timer < PlayerManager.Instance.mLocalZepetoNetPlayer.MaxLightBattle) {
    //         this.mCooldownImg.value = (PlayerManager.Instance.mLocalZepetoNetPlayer.LightBattle / PlayerManager.Instance.mLocalZepetoNetPlayer.MaxLightBattle);
    //         timer += Time.deltaTime;
    //         yield null;
    //     }
    //     // this.mCooldownImg.enabled = false;
    //     // this.mIsCooling = false;
    //     // this.mBtn.interactable = true;
    // }
}