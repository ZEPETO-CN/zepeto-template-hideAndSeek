import { GameObject, Input, KeyCode, Transform } from 'UnityEngine';
import { Toggle, Text } from 'UnityEngine.UI'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import UIObserverItem from './UIObserverItem';

export default class UIObserverPanel extends ZepetoScriptBehaviour {

    public mFreeCameraToggle: Toggle;
    public mChangeViewBtn: Toggle;
    public mObserverName: Text;

    public mChangeView: GameObject;
    public mChangeViewItem: GameObject;
    public mChangeViewContent: Transform;


    private mObserverList: GameObject[] = [];
    Start() {
        this.mFreeCameraToggle.onValueChanged.AddListener((isOn) =>
        {
            if (isOn) {
                console.log("exit free");
            }
            else {
                console.log("free");

            }
        });
        this.mChangeViewBtn.onValueChanged.AddListener((isOn) => 
        {
            this.mChangeView.SetActive(isOn);
        });

    }
    Update() {
        if (Input.GetKeyDown(KeyCode.Z)) {
            //test
            var test = ["11", "22", "33"];
            this.UpdateGameUser(test);
        }
        if (Input.GetKeyDown(KeyCode.X)) {
            //test
            var test = ["33", "44", "55"];
            this.UpdateGameUser(test);
        }
    }

    public UpdateGameUser(users : string[])
    {
        if (this.mObserverList.length > 0) {
            for (var i = 0; i < this.mObserverList.length; i++) {
                GameObject.Destroy(this.mObserverList[i]);
            }
        }

        for (var i = 0; i < users.length; i++) {
            var item = GameObject.Instantiate<GameObject>(this.mChangeViewItem, this.mChangeViewContent);
            var uiItem = item.transform.GetComponent<UIObserverItem>();
            uiItem.SetData(users[i]);
            this.mObserverList.push(item);  
            item.SetActive(true);
        }
    }

}