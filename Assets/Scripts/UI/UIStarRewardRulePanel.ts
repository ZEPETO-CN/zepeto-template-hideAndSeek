import { Button, Text } from 'UnityEngine.UI'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization from '../Common/Localization/Scripts/Localization';

export default class UIStarRewardRulePanel extends ZepetoScriptBehaviour {

    public mCloseBtn: Button;
    public mOKBtn: Button;
    public mTitleText: Text;
    public mRuleText: Text;
    public mOKText: Text;

    Awake() {

        this.mCloseBtn.onClick.AddListener(() => {
            this.Close();
        });
        this.mOKBtn.onClick.AddListener(() => {
            this.Close();
        });

        this.mTitleText.text = Localization.Instance.GetLocalizedText("Star_Reward_Rule_1");
        this.mRuleText.text = Localization.Instance.GetLocalizedText("Star_Reward_Rule_2");
        this.mOKText.text = Localization.Instance.GetLocalizedText("Star_Reward_Rule_3");
    }

    Start() {

    }

    private Close() {
        this.gameObject.SetActive(false);
    }

}