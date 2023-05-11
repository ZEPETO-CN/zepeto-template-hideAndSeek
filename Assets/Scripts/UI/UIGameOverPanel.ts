import { Camera, GameObject, RenderTexture, Vector3, Quaternion, Transform, LayerMask, Animator, AnimatorOverrideController, RuntimeAnimatorController } from 'UnityEngine';
import { RawImage, ScrollRect, Text, Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour, ZepetoScriptContext } from 'ZEPETO.Script'
import LeaderboardItem from './LeaderboardItem';
import { sPlayerInfo } from "ZEPETO.Multiplay.Schema";
import PlayerManager from "../GameManager/PlayerManager"
import AudioController from '../GameController/AudioController';
import ScreenshotManager from '../../CommonModules/Screenshot/Scripts/ScreenshotManager';
import UIToast from './UIToast';
import UIManager from '../GameManager/UIManager';

export default class UIGameOverPanel extends ZepetoScriptBehaviour {

    public mFirstName: Text;
    public mMyRank: Text;
    public mMyScore: Text;
    public mCoundDownTimer: Text;
    public mLeaderboardItem: GameObject
    public mScrollView: ScrollRect;
    private leaderboardItemObjs: GameObject[];
    public mRawImage: RawImage;
    public mRTCamera: Camera;
    public mCheerAnimatorController: RuntimeAnimatorController;
    public feedBtn: Button;

    private cloneContextObj: GameObject;

    Awake() {
        this.leaderboardItemObjs = [];
        this.leaderboardItemObjs.push(this.mLeaderboardItem);
        this.mLeaderboardItem.SetActive(false);
        this.feedBtn.onClick.AddListener(() => {
            this.feedBtn.interactable = false;
            ScreenshotManager.Instance.CreateFeedImmediately((result) => {
                if (result) {
                    UIManager.Instance.TOAST.ShowFeedSuccess();
                }
                else {
                    UIManager.Instance.TOAST.ShowFeedFail();
                }
            });
        });
    }

    public Show(playerInfoMap: Map<number, sPlayerInfo>) {
        this.feedBtn.interactable = true;
        // playerInfoMap.forEach((playerInfo, id) => {
        //     console.error("playerInfo:", JSON.stringify(playerInfo), "id:", id);
        // });
        AudioController.Instance.PlayGameOver();
        let playerInfoArray = [];
        playerInfoMap.forEach((playerInfo, id) => {
            if (id != 0) {        // 去除一个空数据
                playerInfoArray.push(playerInfo);
            }
        });
        playerInfoArray.sort((a, b) => {
            return b.score - a.score;
        });

        for (let i = 0; i < this.leaderboardItemObjs.length; i++) {
            const obj = this.leaderboardItemObjs[i];
            obj.SetActive(false);
        }

        let myRank = 0;
        let myScore = 0;
        for (let i = 0; i < playerInfoArray.length; i++) {
            var go: GameObject;
            if (i > this.leaderboardItemObjs.length - 1) {
                go = GameObject.Instantiate<GameObject>(this.mLeaderboardItem, this.mScrollView.content);
                this.leaderboardItemObjs.push(go);
            }
            else {
                go = this.leaderboardItemObjs[i];
            }
            let playerInfo = playerInfoArray[i];
            if (playerInfo.sessionId == PlayerManager.Instance.mSessionId) {
                myScore = playerInfo.score;
                myRank = i + 1;
            }
            let rank = i + 1;
            go.GetComponent<LeaderboardItem>().SetPlayerInfoData(playerInfo, rank);
            go.SetActive(true);
        }
        this.mFirstName.text = playerInfoArray[0].nickName;
        this.ShowPlayer(playerInfoArray[0].sessionId);
        this.mMyRank.text = myRank.toString();
        this.mMyScore.text = myScore.toString();
    }

    private ShowPlayer(sessionId: string) {
        let zepetoPlayer = PlayerManager.Instance.GetPlayer(sessionId);
        if (!zepetoPlayer) {
            return;
        }
        let zepetoContext = zepetoPlayer.character.Context;
        //克隆一个目标角色模型
        this.cloneContextObj = GameObject.Instantiate<GameObject>(zepetoContext.gameObject, zepetoContext.transform.parent);
        this.cloneContextObj.transform.parent = zepetoPlayer.character.transform.parent;

        // if (cloneContextObj.GetComponent<ZepetoContext>()) {
        //     cloneContextObj.GetComponent<ZepetoContext>().enabled = false;
        // }

        // 显示身体        
        for (var i = 0; i < this.cloneContextObj.transform.childCount; i++) {
            this.cloneContextObj.transform.GetChild(i).gameObject.SetActive(true);
        }
        let playerTransforms = this.cloneContextObj.GetComponentsInChildren<Transform>();
        playerTransforms.forEach(e => {
            e.gameObject.layer = LayerMask.NameToLayer("RTPlayer");
        });
        //设置相机挂点
        let cameraPos = new GameObject("RTCameraPos");
        cameraPos.transform.parent = this.cloneContextObj.transform;
        cameraPos.transform.localPosition = Vector3.zero;
        cameraPos.transform.localRotation = Quaternion.identity;
        this.mRTCamera.gameObject.transform.parent = cameraPos.transform;
        this.mRTCamera.gameObject.transform.localPosition = new Vector3(0, 0.62, 4.3);
        this.mRTCamera.gameObject.transform.localEulerAngles = new Vector3(0, 180, 0);
        this.PlayerCheerAnimation();
    }

    PlayerCheerAnimation() {
        let overrideController = new AnimatorOverrideController();
        overrideController.runtimeAnimatorController = this.mCheerAnimatorController;
        let animator = this.cloneContextObj.GetComponent<Animator>();
        animator.runtimeAnimatorController = overrideController;
    }

    OnEnable() {
        this.mRTCamera.targetTexture = this.mRawImage.texture as RenderTexture;
        this.mRTCamera.gameObject.SetActive(true);
    }

    OnDisable() {
        this.mRTCamera.targetTexture = null;
        this.mRTCamera.gameObject.SetActive(false);
        GameObject.DestroyImmediate(this.cloneContextObj);
    }
}
