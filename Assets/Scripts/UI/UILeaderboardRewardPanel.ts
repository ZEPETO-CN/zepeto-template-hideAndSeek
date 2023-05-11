import { GameObject, Vector3 } from 'UnityEngine';
import { Text, Button, ScrollRect } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization from '../Common/Localization/Scripts/Localization';
import ConfigManager from '../GameManager/ConfigManager';
import UIManager from '../GameManager/UIManager';
import LeaderBoardRewardItem from './LeaderBoardRewardItem';

export default class UILeaderboardRewardPanel extends ZepetoScriptBehaviour {

    public mTitleText: Text;
    public mEndText: Text;
    public mCloseBtn: Button;
    public mScrollView: ScrollRect;
    public mRewardItemObj: GameObject;
    public mLeaderboardBtn: Button;
    private rewardItemObjs: GameObject[];

    Awake() {
        this.Localization();
        this.rewardItemObjs = [];
        this.rewardItemObjs.push(this.mRewardItemObj);
        this.mCloseBtn.onClick.AddListener(() => {
            this.gameObject.SetActive(false);
        });
        this.mLeaderboardBtn.onClick.AddListener(() => {
            UIManager.Instance.mLeaderboardPanel.SetActive(true);
        });
        this.CreateRewardList();
    }

    private Localization() {
        this.mTitleText.text = Localization.Instance.GetLocalizedText("Reward_title");
        this.mEndText.text = Localization.Instance.GetLocalizedText("Reward_tips");
    }

    private CreateRewardList() {
        let rewardListData = ConfigManager.Instance.GetRankRewardTable();
        for (var i = 0; i < rewardListData.length; i++) {
            var item: GameObject;
            if (i > this.rewardItemObjs.length - 1) {
                item = GameObject.Instantiate<GameObject>(this.mRewardItemObj, this.mScrollView.content);
                this.rewardItemObjs.push(item);
            }
            else {
                item = this.rewardItemObjs[i];
            }
            item.transform.localScale = Vector3.one;
            item.GetComponent<LeaderBoardRewardItem>().SetItem(rewardListData[i], i);
            item.SetActive(true);
        }

    }

}