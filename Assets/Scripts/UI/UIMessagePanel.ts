import { GameObject, Sprite, Time, Vector3 } from 'UnityEngine';
import { Button, Image, ScrollRect, Toggle } from 'UnityEngine.UI'
import { ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Barrage, BarrageMap } from '../Data/Barrage';
import PlayerManager from '../GameManager/PlayerManager';
import UIManager from '../GameManager/UIManager';
import { BarrageGroup } from './BarrageItem';
import EmojiItem from './EmojiItem';
import QuickMessageItem from './QuickMessageItem';
import UIBarragePanel from './UIBarragePanel';

export enum QuickMessageType {
    message = 1,
    emoji = 2
}
export default class UIMessagePanel extends ZepetoScriptBehaviour {

    public mQuickMessageBtn: Button;
    public mEmojiBtn: Button;
    public mBarrageToggle: Toggle;
    public mQuickMessagePanel: GameObject;
    public mEmojiPanel: GameObject;
    public mBarragePanel: GameObject;
    public mBarrageUI: UIBarragePanel;
    public mQuickMessageItemObj: GameObject;
    public mEmojiItemObj: GameObject;
    public mQMCDImage: Image;
    public mEmojiCDImage: Image;

    private quickMessageItems: QuickMessageItem[];
    private emojiItems: EmojiItem[];

    private qmScrollView: ScrollRect;
    private emojiScrollView: ScrollRect;
    private barrageGroup: Map<string, Barrage[]>;
    private currentGroup: string = "";
    private messageCD: number = 10;
    private currentQMTime: number;
    private currentEmojiTime: number;
    private isStart: boolean;
    private isHunter: boolean;


    Awake() {
        this.mQuickMessageBtn.onClick.AddListener(() => { this.ClickQuickMessageBtn() });
        this.mEmojiBtn.onClick.AddListener(() => { this.ClickEmojiBtn() });
        this.mBarrageToggle.onValueChanged.AddListener((isOn: boolean) => { this.ClickBarrageToggle(isOn) });
        this.qmScrollView = this.mQuickMessagePanel.transform.GetChild(0).GetComponent<ScrollRect>();
        this.emojiScrollView = this.mEmojiPanel.transform.GetChild(0).GetComponent<ScrollRect>();
    }

    Update() {
        this.UpdateMessageCD();
    }

    public Init() {
        this.mBarrageUI = this.mBarragePanel.GetComponent<UIBarragePanel>();
        this.mBarrageUI.Init();
        this.barrageGroup = new Map<string, Barrage[]>();
        this.mBarrageUI.mBarrageMap = new BarrageMap().data;
        this.mBarrageUI.mBarrageMap.forEach((v, k) => {
            if (!this.barrageGroup.has(v.group)) {
                this.barrageGroup.set(v.group, []);
            }
            this.barrageGroup.get(v.group).push(v);
        });
        this.gameObject.SetActive(false);
        this.quickMessageItems = [];
        this.quickMessageItems.push(this.mQuickMessageItemObj.GetComponent<QuickMessageItem>());
        this.emojiItems = [];
        this.emojiItems.push(this.mEmojiItemObj.GetComponent<EmojiItem>());
        this.SetEmojiItems();
        this.InitQuickMessage();
    }

    private InitQuickMessage() {
        this.gameObject.SetActive(true);
        this.isStart = false;
        this.SetQMTouchable(true);
        this.SetEmojiTouchable(true);
        this.mBarragePanel.SetActive(this.mBarrageToggle.isOn);
        this.RefreshQuickMessage(BarrageGroup.common);
    }

    private SetEmojiItems() {
        for (let i = 0; i < this.mBarrageUI.mEmojiSprites.length; i++) {
            var item: EmojiItem;
            if (i > this.emojiItems.length - 1) {
                let obj = GameObject.Instantiate<GameObject>(this.mEmojiItemObj, this.emojiScrollView.content);
                item = obj.GetComponent<EmojiItem>();
                this.emojiItems.push(item);
            }
            else {
                item = this.emojiItems[i];
            }
            item.transform.localScale = Vector3.one;
            item.SetEmoji(i, this.mBarrageUI.mEmojiSprites[i]);
            item.SetClickCallback(this.ClickEmojiItem.bind(this));
            item.gameObject.SetActive(true);
        }
    }

    private ClickQuickMessageBtn() {
        if (this.mQuickMessagePanel.activeSelf) {
            this.mQuickMessagePanel.SetActive(false);
        }
        else {
            this.mQuickMessagePanel.SetActive(true);
            this.mEmojiPanel.SetActive(false);
        }
    }

    private ClickEmojiBtn() {
        if (this.mEmojiPanel.activeSelf) {
            this.mEmojiPanel.SetActive(false);
        }
        else {
            this.mEmojiPanel.SetActive(true);
            this.mQuickMessagePanel.SetActive(false);
        }
    }

    private ClickBarrageToggle(isOn: boolean) {
        this.mBarrageUI.SetBarrageVisiable(isOn);
    }

    public OnGamwWait() {
        this.InitQuickMessage();
    }

    public OnGameStart(isHunter: boolean) {
        this.gameObject.SetActive(true);
        this.mQuickMessagePanel.SetActive(false);
        this.mEmojiPanel.SetActive(false);
        this.mBarragePanel.SetActive(this.mBarrageToggle.isOn);
        this.isStart = true;
        this.isHunter = isHunter;
        let group = isHunter ? BarrageGroup.hunter : BarrageGroup.hider;
        if (this.currentGroup == group) {
            return;
        }
        this.RefreshQuickMessage(group);
    }

    public OnRoundOver() {
        this.mQuickMessagePanel.SetActive(false);
        this.mEmojiPanel.SetActive(false);
        this.mBarragePanel.SetActive(false);
        this.gameObject.SetActive(false);
    }

    private RefreshQuickMessage(group: string) {
        for (let i = 0; i < this.quickMessageItems.length; i++) {
            const item = this.quickMessageItems[i];
            item.gameObject.SetActive(false);
        }

        let barrages = this.barrageGroup.get(group);
        for (let i = 0; i < barrages.length; i++) {
            var item: QuickMessageItem;
            if (i > this.quickMessageItems.length - 1) {
                let obj = GameObject.Instantiate<GameObject>(this.mQuickMessageItemObj, this.qmScrollView.content);
                item = obj.GetComponent<QuickMessageItem>();
                this.quickMessageItems.push(item);
            }
            else {
                item = this.quickMessageItems[i];
            }
            item.transform.localScale = Vector3.one;
            item.SetQuickMessage(barrages[i]);
            item.SetClickCallback(this.ClickQuickMessageItem.bind(this));
            item.gameObject.SetActive(true);
        }
        this.currentGroup = group;
    }

    private _qmTimeId: number = 0;
    private ClickQuickMessageItem(barrage: Barrage) {
        this.mQuickMessagePanel.SetActive(false);
        this.SetQMTouchable(false);
        this._qmTimeId = setTimeout(() => {
            this.SetQMTouchable(true);
            clearTimeout(this._qmTimeId);
            this._qmTimeId = 0;
        }, this.messageCD * 1000);

        const data = new RoomData();
        data.Add("name", PlayerManager.Instance.LocalPlayer.name);
        data.Add("type", QuickMessageType.message);
        data.Add("id", barrage.id);
        data.Add("group", barrage.group);
        UIManager.Instance.SendQuickMessage(data);
    }

    private _emojiTimeId: number = 0;
    private ClickEmojiItem(id: number) {
        this.mEmojiPanel.SetActive(false);
        this.SetEmojiTouchable(false);
        this._emojiTimeId = setTimeout(() => {
            this.SetEmojiTouchable(true);
            clearTimeout(this._emojiTimeId);
            this._emojiTimeId = 0;
        }, this.messageCD * 1000);

        const data = new RoomData();
        data.Add("name", PlayerManager.Instance.LocalPlayer.name);
        data.Add("type", QuickMessageType.emoji);
        data.Add("id", id);
        let group = BarrageGroup.common;
        if (this.isStart) {
            group = this.isHunter ? BarrageGroup.hunter : BarrageGroup.hider;
        }
        data.Add("group", group);
        UIManager.Instance.SendQuickMessage(data);
    }

    public UpdateMessageCD() {
        if (!this.mQuickMessageBtn.interactable) {
            this.currentQMTime += Time.deltaTime;
            this.mQMCDImage.fillAmount = this.currentQMTime / this.messageCD;
            if (this.currentQMTime >= this.messageCD) {
                this.SetQMTouchable(true);
            }
        }
        if (!this.mEmojiBtn.interactable) {
            this.currentEmojiTime += Time.deltaTime;
            this.mEmojiCDImage.fillAmount = this.currentEmojiTime / this.messageCD;
            if (this.currentEmojiTime >= this.messageCD) {
                this.SetEmojiTouchable(true);
            }
        }
    }

    private SetQMTouchable(touchable: boolean) {
        if (touchable) {
            this.mQMCDImage.fillAmount = 1;
            this.currentQMTime = 0;
            this.mQuickMessageBtn.interactable = true;
        }
        else {
            this.mQMCDImage.fillAmount = 0;
            this.mQuickMessageBtn.interactable = false;
        }
    }

    private SetEmojiTouchable(touchable: boolean) {
        if (touchable) {
            this.mEmojiCDImage.fillAmount = 1;
            this.currentEmojiTime = 0;
            this.mEmojiBtn.interactable = true;
        }
        else {
            this.mEmojiCDImage.fillAmount = 0;
            this.mEmojiBtn.interactable = false;
        }
    }

}