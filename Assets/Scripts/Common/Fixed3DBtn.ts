import { Camera, Coroutine, GameObject, Vector3, WaitForSeconds } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoCamera, ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';

export default class Fixed3DBtn extends ZepetoScriptBehaviour {

    public offset: Vector3;
    private ZepetoCamera: GameObject;

    private mEuler: Vector3 = Vector3.zero;
    private mUpdateUICoroutine: Coroutine;

    Start() {
        this.transform.position = this.offset + this.transform.position;
    }

    Update() {
        // this.transform.LookAt(StarDanceLogic.Instance.ZepetoCamear.transform);
        // this.ZepetoCamear = ZepetoPlayers.instance.LocalPlayer.zepetoCamera;

        if (this.ZepetoCamera == null) {
            this.ZepetoCamera = GameObject.Find("ZepetoCamera/CameraParent/ZepetoCamera");
        } else {
            var direction = this.ZepetoCamera.transform.position - this.transform.position;
            direction.y = 0; //如果不考虑y轴，水平跑走的话
            this.transform.forward = direction.normalized * -1;
        }
    }

    // OnEnable() {
    //     this.mUpdateUICoroutine = this.StartCoroutine(this.UpdateUI());
    // }

    // // 修改为监听
    // //todo
    // private *UpdateUI() {
    //     while (true) {
    //         if (Camera.main) {
    //             let cam = Camera.main;
    //             this.mEuler.x = cam.transform.eulerAngles.x;
    //             this.mEuler.y = cam.transform.eulerAngles.y;
    //             this.transform.localEulerAngles = this.mEuler;
    //         }
    //         yield new WaitForSeconds(0.1);
    //     }
    // }

    // OnDisable() {
    //     if (this.mUpdateUICoroutine != null || this.mUpdateUICoroutine != undefined) {
    //         this.StopCoroutine(this.mUpdateUICoroutine);
    //         console.log("Stop Coroutine");
    //     }

    // }
}