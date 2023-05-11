import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Text ,Button} from 'UnityEngine.UI'
import { UnityEvent$1 } from 'UnityEngine.Events';
export default class UIObserverItem extends ZepetoScriptBehaviour {

    public mText: Text;
    public mBtn: Button;
    public mObserverShowName: Text;

    SetData(name: string)
    {
        this.mText.text = name;
        this.mBtn.onClick.AddListener(() =>
        {
            this.mObserverShowName.text = name;
        });
    }

}