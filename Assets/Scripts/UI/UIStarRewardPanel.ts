import { GameObject, LightmapSettings, Time, WaitForSeconds, WaitUntil } from 'UnityEngine';
import { Button, Text } from 'UnityEngine.UI'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization from '../Common/Localization/Scripts/Localization';
import ConfigManager, { RewardType } from '../GameManager/ConfigManager';
import UIManager from '../GameManager/UIManager';
import StarRewardItem from './StarRewardItem';
export default class UIStarRewardPanel extends ZepetoScriptBehaviour {

    public mStarAmountText: Text;
    public mLuckDesText: Text;
    public mCurrentLuckDesText: Text;
    public mCurrentLuckAmountText: Text;
    public mMaxLuckAmountText: Text;
    public mExchangeCostText: Text;
    public mDailyCountText: Text;
    public mHelpBtn: Button;
    public mExchangeBtn: Button;
    public mRewardContainer: GameObject;
    public mRulePanelObj: GameObject;
    public mStarRewardMask: GameObject;

    private _maxCount: number;
    private _luckMax: number;
    private _costStar: number;
    private _curStar: number = 0;
    private _remainCount: number = 0;
    private _starRewardItemArray: StarRewardItem[];

    Awake() {
        this.mHelpBtn.onClick.AddListener(() => {
            this.mRulePanelObj.SetActive(true);
        });

        this.mExchangeBtn.onClick.AddListener(() => {
            this.ClickExchange();
        });
    }

    public Init() {
        this._maxCount = ConfigManager.STAR_REWARD.exchangeMax;
        this._luckMax = ConfigManager.STAR_REWARD.luckMax;
        this._costStar = ConfigManager.STAR_REWARD.cost;
        this.mMaxLuckAmountText.text = "/" + this._luckMax;
        this.mExchangeCostText.text = this._costStar + "";
        this._remainCount = this._maxCount;
        this.mStarAmountText.text = 0 + "";
    }

    private ClickExchange() {
        if (this._isPlaying) {
            return;
        }
        if (this._curStar >= this._costStar && this._remainCount > 0) {
            UIManager.Instance.SendExchangeStarReward();
        }
    }

    Start() {
        this.SetStarRewardItems();
    }

    private SetStarRewardItems() {
        this._starRewardItemArray = [];
        let starRewardArray = ConfigManager.STAR_REWARD_ARRAY;
        for (let i = 0; i < this.mRewardContainer.transform.childCount; i++) {
            let obj = this.mRewardContainer.transform.GetChild(i);
            let item = obj.GetComponent<StarRewardItem>();
            item.SetItem(starRewardArray[i].amount, starRewardArray[i].rewardType);
            this._starRewardItemArray.push(item);
        }
        this.mStarRewardMask.SetActive(false);
    }

    public UpdateStar(curStar: number) {
        this._curStar = curStar;
        this.mStarAmountText.text = curStar + "";
        this.RefreshExchangeButton();
    }

    public UpdateStarRewardInfo(starRewardInfo: any) {
        this.mCurrentLuckAmountText.text = starRewardInfo.luck + "";
        this._remainCount = this._maxCount - starRewardInfo.dailyCount;
        let str = "<color=#F0D256FF>" + this._remainCount + "</color>";
        this.mDailyCountText.text = Localization.Instance.GetLocalizedTextWithParam("Star_Reward_4", [str]);
        this.RefreshExchangeButton();
    }

    private RefreshExchangeButton() {
        if (this._curStar < this._costStar) {
            this.mExchangeBtn.interactable = false;
            return;
        }
        if (this._remainCount <= 0) {
            this.mExchangeBtn.interactable = false;
            return;
        }
        this.mExchangeBtn.interactable = true;
    }

    public ShowReward(amount: number, rewardType: RewardType) {
        let starRewardArray = ConfigManager.STAR_REWARD_ARRAY;
        for (let i = 0; i < starRewardArray.length; i++) {
            let starReward = starRewardArray[i];
            if (starReward.rewardType == rewardType && starReward.amount == amount) {
                this._rewardIndex = starReward.id - 1;
                break;
            }
        }
        this._amount = amount;
        this._rewardType = rewardType;
        this.StartPlayDrawAnimation();
    }

    private _amount: number = 0;
    private _rewardType: RewardType;

    private _drawEnd: boolean = true;
    private _drawWining: boolean = false;

    private _rewardTime = 1;
    private _rewardTiming = 0;

    private _haloIndex: number = 0;
    private _rewardIndex: number = 0;

    private _isPlaying: boolean = false;

    FixedUpdate() {
        if (this._drawEnd) {
            return;
        }
        this._rewardTiming += Time.deltaTime;
        if (this._rewardTiming >= this._rewardTime) {
            this._rewardTiming = 0;
            this._haloIndex++;
            if (this._haloIndex >= this._starRewardItemArray.length) {
                this._haloIndex = 0;
            }
            this.SetHaloPos(this._haloIndex);
        }
    }

    private SetHaloPos(index: number) {
        let lastIndex = 0;
        if (index == 0) {
            lastIndex = this._starRewardItemArray.length - 1;
        }
        else {
            lastIndex = index - 1;
        }
        this._starRewardItemArray[index].SetSelect(true);
        this._starRewardItemArray[lastIndex].SetSelect(false);
        if (this._drawWining && index == this._rewardIndex) {
            this._isPlaying = false;
            this._drawEnd = true;
        }
    }

    private StartPlayDrawAnimation() {
        if (!this._isPlaying) {
            this._isPlaying = true;
            this.mStarRewardMask.SetActive(true);
            this._drawEnd = false;
            this._drawWining = false;
            this.StartCoroutine(this.StartDrawAnimation());
        }
    }

    private *StartDrawAnimation() {
        this._rewardTime = 1;
        for (let i = 0; i < 9; i++) {
            yield new WaitForSeconds(0.1);
            this._rewardTime -= 0.1;
        }
        yield new WaitForSeconds(2.5);
        for (let i = 0; i < 5; i++) {
            yield new WaitForSeconds(0.1);
            this._rewardTime += 0.05;
        }
        yield new WaitForSeconds(0.5);
        this._drawWining = true;
        yield new WaitUntil(() => this._drawEnd);
        yield new WaitForSeconds(1);
        this.mStarRewardMask.SetActive(false);
        UIManager.Instance.ShowDailyRewardPanel(this._amount, this._rewardType);
        this.RefreshExchangeButton();
    }

}