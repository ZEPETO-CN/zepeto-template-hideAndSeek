import { Color, Debug, GameObject, LayerMask, Physics, Ray, RaycastHit, Vector2, Vector3 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class CameraFix extends ZepetoScriptBehaviour {

    private zepetocamera: GameObject;
    Start() {
        this.zepetocamera = this.transform.gameObject;
    }

    // FixedUpdate() {
    //     let ref = $ref<RaycastHit>();
    //     let dist = 1;
    //     let hitInfo_l: RaycastHit[];
    //     let hitInfo_r: RaycastHit[];

    //     // Debug.DrawLine(this.mLocalZepetoNetPlayer.objLight.transform.position, ply.transform.position, Color.red);


    //     // let direction = ply.transform.position - this.mLocalZepetoNetPlayer.objLight.transform.position;
    //     // let direction = this.mLocalZepetoNetPlayer.objLight.transform.forward;
    //     // let dir_l = this.zepetocamera.transform.right * new Vector3(-1, 0, 0);
    //     let v3l = this.zepetocamera.transform.right;
    //     v3l = new Vector3(v3l.x * -1, v3l.y, v3l.z);
    //     hitInfo_l = Physics.RaycastAll(this.zepetocamera.transform.position,
    //         v3l, dist);
    //     hitInfo_r = Physics.RaycastAll(this.zepetocamera.transform.position,
    //         this.zepetocamera.transform.right, dist);

    //     Debug.DrawRay(this.zepetocamera.transform.position,
    //         v3l, Color.red, dist);
    //     Debug.DrawRay(this.zepetocamera.transform.position,
    //         this.zepetocamera.transform.right, Color.green, dist);
    //     for (let i = 0; i < hitInfo_l.length; i++) {
    //         console.log("射线检测到llll====" + i + hitInfo_l[i].transform.name + "|| tag:" + hitInfo_l[i].transform.tag);
    //     }
    //     for (let i = 0; i < hitInfo_r.length; i++) {

    //         console.log("射线检测到rrrr====" + i + hitInfo_r[i].transform.name + "|| tag:" + hitInfo_r[i].transform.tag);
    //     }
    // }
}