import { Sprite } from 'UnityEngine';
import { Text, Image, ScrollRect } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization from '../Common/Localization/Scripts/Localization';
import { RankRewardData, RankType, RewardType } from '../GameManager/ConfigManager';

export default class LeaderBoardRewardItem extends ZepetoScriptBehaviour {

    public mSprites: Sprite[];
    public mRewardSprites: Sprite[];
    public mRewardIcon: Image;
    public mRankText: Text;
    public mRewardAmountText: Text;
    public mCoinIcon: Image;

    public SetItem(rewardData: RankRewardData, index: number) {
        this.mRewardIcon.sprite = this.mSprites[index];
        let rankStr = "";
        switch (rewardData.rankType) {
            case RankType.RANK:
                if (rewardData.rankValue == 1) {
                    rankStr = Localization.Instance.GetLocalizedTextWithParam("Reward_list_1", [rewardData.rankValue.toString()]);
                }
                else if (rewardData.rankValue == 2) {
                    rankStr = Localization.Instance.GetLocalizedTextWithParam("Reward_list_1", [rewardData.rankValue.toString()]);
                }
                else {
                    rankStr = Localization.Instance.GetLocalizedTextWithParam("Reward_list_2", [rewardData.rankValue.toString()]);
                }
                break;
            case RankType.RATE:
                rankStr = Localization.Instance.GetLocalizedTextWithParam("Reward_list_3", [rewardData.rankValue.toString()]);
                break;
            case RankType.ETC:
                rankStr = Localization.Instance.GetLocalizedText("Reward_list_4");
                break;
            default:
                break;
        }
        this.mRankText.text = rankStr;
        if (rewardData.rewardType == RewardType.COIN) {
            this.mCoinIcon.sprite = this.mRewardSprites[0];
        }
        else if (rewardData.rewardType == RewardType.ZEM) {
            this.mCoinIcon.sprite = this.mRewardSprites[1];
        }
        this.mRewardAmountText.text = rewardData.rewardValue.toString();
    }

}