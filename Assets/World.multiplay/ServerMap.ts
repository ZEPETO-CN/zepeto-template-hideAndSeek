import { Sandbox } from "ZEPETO.Multiplay";

export default class ServerMap {


    private readonly mDynamicModelTotal: number = 215;         // 总数
    private readonly mRandomModelTotal: number = 60;           // 随机数

    private mMapDynamicArray: number[] = new Array(this.mDynamicModelTotal);

    private mSandbox: Sandbox;

    onCreate(sandbox: Sandbox) {

        this.mSandbox = sandbox;

        for (var i = 0; i < this.mDynamicModelTotal; i++) {
            this.mMapDynamicArray[i] = i;
        }

        this.onRandomDynamicModel();
    }

    private onRandomDynamicModel() {
        for (var i = this.mDynamicModelTotal - 1; i > 1; i--) {
            let r = Math.random() * i + "";         // 随机一个数
            let index = parseInt(r);
            if (index >= 0 && index < this.mDynamicModelTotal) {
                let temp = this.mMapDynamicArray[i];
                this.mMapDynamicArray[i] = this.mMapDynamicArray[index];
                this.mMapDynamicArray[index] = temp;
            }
        }

        let dMaps = this.mSandbox.state.dynamicMaps;

        dMaps.models = this.mMapDynamicArray[0].toString();
        for (var i = 1; i < this.mRandomModelTotal; i++) {
            dMaps.models += "," + this.mMapDynamicArray[i].toString();
        }

        console.log("onRandomDynamicModel", dMaps.models);
    }

    onGameOver() {
        this.onRandomDynamicModel();
    }


}