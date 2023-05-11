import { GameObject } from 'UnityEngine';
import { Text, Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import Localization from '../Common/Localization/Scripts/Localization';
import TutorialBtnItem from './TutorialBtnItem';

export default class UIZemPanel extends ZepetoScriptBehaviour {

    public mTitleText: Text;
    public mBtn: Button;
    public mCloseBtn: Button;
    public mBtnLayout: GameObject;
    public mLeaderboardPanel: GameObject;
    public mDailyTaskPanel: GameObject;
    public mStarRewardPanel: GameObject;
    public mSeasonRewardPanel: GameObject;


    private btnNames: string[];
    private btnItems: TutorialBtnItem[];
    private currentBtnItem: TutorialBtnItem;

    Awake() {
        this.Localization();
        this.InitBtnItems();
    }

    private Localization(): void {
        let localization = Localization.Instance;

        this.btnNames = [
            localization.GetLocalizedText("Zem_btn_4"),
            // localization.GetLocalizedText("Zem_btn_3"),
            localization.GetLocalizedText("Zem_btn_1"),
            localization.GetLocalizedText("Zem_btn_2"),
        ];
    }

    private InitBtnItems() {
        this.btnItems = [];
        let btnItem = this.mBtnLayout.transform.GetChild(0).GetComponent<TutorialBtnItem>();
        btnItem.SetItem(this.btnNames[0], 0);
        this.btnItems.push(btnItem);
        for (let i = 1; i < this.btnNames.length; i++) {
            let btnItem: TutorialBtnItem = GameObject.Instantiate<GameObject>(this.mBtn.gameObject, this.mBtnLayout.transform).GetComponent<TutorialBtnItem>();
            btnItem.transform.SetSiblingIndex(i);
            btnItem.SetItem(this.btnNames[i], i);
            btnItem.SetStatus(false);
            this.btnItems.push(btnItem);
        }
        for (let i = 0; i < this.btnItems.length; i++) {
            let btnItem = this.btnItems[i];
            btnItem.SetStatus(false);
            let btn = btnItem.GetComponent<Button>();
            btn.onClick.AddListener(() => {
                this.SelectBtn(btnItem);
            })
        }
    }

    Start() {
        this.SelectBtn(this.btnItems[0]);
    }

    private SelectBtn(item: TutorialBtnItem) {
        if (this.currentBtnItem) {
            if (this.currentBtnItem == item) {
                return;
            }
            else {
                this.currentBtnItem.SetStatus(false);
            }
        }
        this.currentBtnItem = item;
        this.currentBtnItem.SetStatus(true);
        this.RefreshShowInfo(this.currentBtnItem.index);
    }

    private RefreshShowInfo(btnIndex: number) {
        this.mSeasonRewardPanel.SetActive(btnIndex == 0);
        // this.mStarRewardPanel.SetActive(btnIndex == 1);
        this.mLeaderboardPanel.SetActive(btnIndex == 1);
        this.mDailyTaskPanel.SetActive(btnIndex == 2);
    }
}