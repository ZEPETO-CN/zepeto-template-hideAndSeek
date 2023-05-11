import { GameObject, RectTransform, Sprite, Transform, WaitForEndOfFrame, Vector2 } from 'UnityEngine';
import { IBeginDragHandler, PointerEventData } from 'UnityEngine.EventSystems';
import { Text, Button, ToggleGroup, ScrollRect, Toggle, Image } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import Localization from '../Common/Localization/Scripts/Localization';
import TutorialBtnItem from './TutorialBtnItem';
import TutorialItem from './TutorialItem';

export default class UITutorialPanel extends ZepetoScriptBehaviour {

    public mTitleText: Text;
    public mTipText: Text;
    public mMiddleBtn: Button;
    public mLeftArrowBtn: Button;
    public mRighArrowtBtn: Button;
    // public mMaskBtn: Button;
    public mCloseBtn: Button;

    public mScroll: ScrollRect;
    public mBtnLayout: GameObject;
    public mDotLayout: GameObject;
    public mSprites: Sprite[];

    private btnNames: string[];
    private btnItems: TutorialBtnItem[];
    private currentBtnItem: TutorialBtnItem;
    private spriteMap: Map<string, Sprite>;

    private dotToggles: Toggle[];
    private tipItems: TutorialItem[];

    private guideTips: string[][];
    private guideImgRess: string[][];
    private currentTips: string[];
    private currentImgRess: string[];
    private currentPage: number;


    Awake() {
        this.InitImages();
        this.Localization();
        this.InitBtnItems();
        this.InitDotToggles();
        this.InitTipItems();
        this.mLeftArrowBtn.onClick.AddListener(this.clickLeft.bind(this));
        this.mRighArrowtBtn.onClick.AddListener(this.clickRight.bind(this));
        // this.mMaskBtn.onClick.AddListener(this.clickMaskImg.bind(this));
    }

    private Localization(): void {
        let localization = Localization.Instance;

        this.guideTips = [
            [localization.GetLocalizedText("Rule_Desc_1_1"), localization.GetLocalizedText("Rule_Desc_1_2")],
            [localization.GetLocalizedText("Rule_Desc_2_1"), localization.GetLocalizedText("Rule_Desc_2_2"), localization.GetLocalizedText("Rule_Desc_2_3"), localization.GetLocalizedText("Rule_Desc_2_4")]
        ];

        this.btnNames = [
            localization.GetLocalizedText("Rule_button_1"),
            localization.GetLocalizedText("Rule_button_2"),
        ];
    }

    private InitImages() {
        this.spriteMap = new Map<string, Sprite>();
        this.mSprites.forEach((sprite: Sprite) => {
            this.spriteMap.set(sprite.name, sprite);
        });
        this.guideImgRess = [
            ["Rule_Desc_1_1", "Rule_Desc_1_2"],
            ["Rule_Desc_2_1", "Rule_Desc_2_2", "Rule_Desc_2_3", "Rule_Desc_2_4"],
        ];
    }

    private InitTipItems() {
        let tipItem = this.mScroll.content.transform.GetChild(0).gameObject.GetComponent<TutorialItem>();
        this.tipItems = [];
        this.tipItems.push(tipItem);
    }

    private InitBtnItems() {
        this.btnItems = [];
        let leftBtnItem = this.mBtnLayout.transform.GetChild(0).GetComponent<TutorialBtnItem>();
        leftBtnItem.SetItem(this.btnNames[0], 0);
        this.btnItems.push(leftBtnItem);
        let lastChileIndex = this.mBtnLayout.transform.childCount - 1;
        let rightBtnItem = this.mBtnLayout.transform.GetChild(lastChileIndex).GetComponent<TutorialBtnItem>();
        rightBtnItem.SetItem(this.btnNames[this.btnNames.length - 1], this.btnNames.length - 1);
        this.btnItems.push(rightBtnItem);

        for (let i = 1; i < this.btnNames.length - 1; i++) {
            let btnItem: TutorialBtnItem = GameObject.Instantiate<GameObject>(this.mMiddleBtn.gameObject, this.mBtnLayout.transform).GetComponent<TutorialBtnItem>();
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

    private InitDotToggles() {
        let dotToggle = this.mDotLayout.transform.GetChild(0).GetComponent<Toggle>();
        this.dotToggles = [];
        this.dotToggles.push(dotToggle);
    }

    private clickMaskImg() {
        this.gameObject.SetActive(false);
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
        this.currentTips = this.guideTips[btnIndex];
        this.currentImgRess = this.guideImgRess[btnIndex];
        this.SetDots(btnIndex);
        this.SetItems(btnIndex);
    }

    private SetDots(btnIndex: number) {
        let num = this.guideImgRess[btnIndex].length;
        for (let i = 0; i < this.dotToggles.length; i++) {
            let dotToggle = this.dotToggles[i];
            dotToggle.isOn = false;
            dotToggle.GetComponent<RectTransform>().rect.width = 14;
            dotToggle.gameObject.SetActive(false);
        }

        for (let i = 0; i < num; i++) {
            let dotToggle: Toggle;
            if (i < this.dotToggles.length) {
                dotToggle = this.dotToggles[i];
            }
            else {
                dotToggle = GameObject.Instantiate<Toggle>(this.dotToggles[0], this.mDotLayout.transform);
                this.dotToggles.push(dotToggle);
            }
            dotToggle.gameObject.SetActive(true);
        }
    }

    private SetItems(btnIndex: number) {
        let num = this.guideImgRess[btnIndex].length;
        for (let i = 0; i < this.tipItems.length; i++) {
            let item = this.tipItems[i];
            item.gameObject.SetActive(false);
        }

        for (let i = 0; i < num; i++) {
            let item: TutorialItem;
            if (i < this.tipItems.length) {
                item = this.tipItems[i];
            }
            else {
                let obj = GameObject.Instantiate<GameObject>(this.tipItems[0].gameObject, this.mScroll.content.transform);;
                item = obj.GetComponent<TutorialItem>();
                this.tipItems.push(item);
            }
            item.setImg(this.spriteMap.get(this.currentImgRess[i]));
            item.gameObject.SetActive(true);
        }
        this.RefreshPage(0);
    }

    private RefreshPage(pageNum: number) {
        this.currentPage = pageNum;
        for (let i = 0; i < this.dotToggles.length; i++) {
            let dotToggle = this.dotToggles[i];
            dotToggle.isOn = i == pageNum;
            dotToggle.GetComponent<RectTransform>().sizeDelta = dotToggle.isOn ? new Vector2(44, 14) : new Vector2(14, 14);
        }

        this.mTipText.text = this.currentTips[pageNum];
        this.SetArrowBtnVisiable(pageNum);
        for (let i = 0; i < this.tipItems.length; i++) {
            let item = this.tipItems[i];
            item.gameObject.SetActive(i == pageNum);
        }
    }

    private SetArrowBtnVisiable(pageNumber) {
        this.mLeftArrowBtn.gameObject.SetActive(pageNumber != 0);
        this.mRighArrowtBtn.gameObject.SetActive(pageNumber < this.currentImgRess.length - 1);
    }

    private clickLeft() {
        this.ChangePage(-1);
    }

    private clickRight() {
        this.ChangePage(1);
    }

    private ChangePage(direction: number) {
        let pageNum = this.currentPage + direction;
        if (pageNum >= 0 && pageNum <= this.currentImgRess.length - 1) {
            this.RefreshPage(pageNum);
        }
    }
}