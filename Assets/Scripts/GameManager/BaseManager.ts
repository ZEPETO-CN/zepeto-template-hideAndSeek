import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameMain, { GameRule }from '../GameMain'
import { sEventArg, GameState } from "./NetManager"
import {AudioClip, Vector3} from "UnityEngine";
import AudioController from '../GameController/AudioController'
import { sGameInfo } from 'ZEPETO.Multiplay.Schema';

export default class BaseManager extends ZepetoScriptBehaviour {

    
    public get mGameState(): GameState{ return GameMain.Instance.mGameState;}

    public get mGameRule() : GameRule { return GameMain.Instance.mGameRule;}
    
    public OnActionEvent(eventName : string, message : any){
        GameMain.Instance.OnActionEvent(eventName, message);
    }
    
    public SendEvent(eventName : sEventArg, message : any){
        GameMain.Instance.SendEvent(eventName, message);
    }

    public CheckGesture(gestrue : number) : boolean{
        return GameMain.Instance.CheckGesture(gestrue);
    }

    public GetStartPoint(index : number, gameState : number) : any{
        return GameMain.Instance.GetStartPoint(index, gameState);
    }
    
    public GetPlayerInfoVO(level : number) : any{
        return GameMain.Instance.GetPlayerInfoVO(level);
    }
    
    public GetModelInfoVO(name : string) : any{
        return GameMain.Instance.GetModelInfoVO(name);
    }
    
    public GetModelCost() : any{
        return GameMain.Instance.GetModelCost();
    }
    
    public Toast(msg : string, duration : number){
        return GameMain.Instance.Toast(msg, duration);
    }
    
    public CheckCanChangeModel(cost : number){
        return GameMain.Instance.CheckCanChangeModel(cost);
    }
    
    // AudioController
    public PlayBGM(clip : AudioClip){
        AudioController.Instance.PlayBGM(clip);
    }

    public PlayOneShot(clip : AudioClip){
        AudioController.Instance.PlayOneShot(clip);
    }

    public PlayAtPoint(clip : AudioClip, point : Vector3){
        AudioController.Instance.PlayAtPoint(clip, point);

    }
    
    public SetScore(userId : string, score : number){
        GameMain.Instance.SetScore(userId, score);
    }
}