import { GameObject, RectTransform, Sprite, Vector2, Vector3 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization from '../Common/Localization/Scripts/Localization';
import { Barrage, BarrageMap } from '../Data/Barrage';
import PoolManager from '../GameManager/PoolManager';
import BarrageItem from './BarrageItem';
import { QuickMessageType } from './UIMessagePanel';

export default class UIBarragePanel extends ZepetoScriptBehaviour {

    public mBarrageMap: Map<number, Barrage>;
    public mEmojiSprites: Sprite[];
    public raws: GameObject[];
    private barrageItems: BarrageItem[];

    public Init() {
        this.gameObject.SetActive(false);
        this.barrageItems = [];
    }

    public SetBarrageVisiable(visiable: boolean) {
        this.gameObject.SetActive(visiable);
        if (!visiable) {
            this.CleanAllBarrage();
        }
    }

    public AddBarrageItem(type: QuickMessageType, id: number, playerName: string, group: string) {
        if (!this.gameObject.activeSelf) {
            return;
        }
        let obj: GameObject;
        if (type == QuickMessageType.message) {
            obj = PoolManager.Instance.Spawn("BarrageItem");
            let raw = this.RandomRaw();
            obj.transform.SetParent(raw.transform);
            obj.transform.localScale = Vector3.one;
            obj.GetComponent<RectTransform>().anchoredPosition = Vector2.zero;
            let item = obj.GetComponent<BarrageItem>();
            let barrage = this.mBarrageMap.get(id);
            let des = `${playerName}：${Localization.Instance.GetLocalizedText(barrage.des)}`;
            item.PlayBarrageItem(des, group);
            item.SetCompletedAction(this.OnCompletedAction.bind(this));
            this.barrageItems.push(item);
        }
        else if (type == QuickMessageType.emoji) {
            obj = PoolManager.Instance.Spawn("BarrageEmojiItem");
            let raw = this.RandomRaw();
            obj.transform.SetParent(raw.transform);
            obj.transform.localScale = Vector3.one;
            obj.GetComponent<RectTransform>().anchoredPosition = Vector2.zero;
            let item = obj.GetComponent<BarrageItem>();
            let des = `${playerName}：`;
            item.PlayBarrageEmojiItem(des, group, this.mEmojiSprites[id]);
            item.SetCompletedAction(this.OnCompletedAction.bind(this));
            this.barrageItems.push(item);
        }
    }

    private RandomRaw(): GameObject {
        let index = Math.round(Math.random() * (this.raws.length - 1));
        return this.raws[index];
    }

    private OnCompletedAction(item: BarrageItem) {
        this.barrageItems.pop();
        item.gameObject.SetActive(false);
        PoolManager.Instance.UnSpawn(item.gameObject);
    }

    private CleanAllBarrage() {
        for (let i = 0; i < this.barrageItems.length; i++) {
            let item = this.barrageItems[i];
            item.gameObject.SetActive(false);
            PoolManager.Instance.UnSpawn(item.gameObject);
        }
        this.barrageItems = [];
    }
}