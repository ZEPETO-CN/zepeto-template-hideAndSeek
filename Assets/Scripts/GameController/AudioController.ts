import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { AudioClip, AudioSource, Vector3, WaitForSeconds } from "UnityEngine"
export default class AudioController extends ZepetoScriptBehaviour {

    public mEffectAudioSource: AudioSource;
    public mBGMAudioSource: AudioSource;

    /* Singleton */

    private static _instance: AudioController;
    public static get Instance(): AudioController {
        return AudioController._instance;
    }

    @Header("音效")
    public mReadyBGM: AudioClip;
    public mStarGameBGM: AudioClip;
    public mPeakBGM: AudioClip;
    public mTimeout: AudioClip;
    public mRoundOver: AudioClip;
    public mGameOver: AudioClip;
    public mOpenLight: AudioClip;
    public mGetReward: AudioClip;


    Awake() {
        AudioController._instance = this;
    }

    public PlayBGM(clip: AudioClip) {
        this.mBGMAudioSource.clip = clip;
        this.mBGMAudioSource.Play();
    }

    public PlayReadyBGM() {
        this.mBGMAudioSource.clip = this.mReadyBGM;
        this.mBGMAudioSource.Play();
        this.mBGMAudioSource.volume = 1;
    }

    public PlayStartGameBGM() {
        this.mBGMAudioSource.clip = this.mStarGameBGM;
        this.mBGMAudioSource.Play();
        this.mBGMAudioSource.volume = 1;
    }

    public PlayPeakBGM() {
        this.mBGMAudioSource.clip = this.mPeakBGM;
        this.mBGMAudioSource.volume = 0.5;
        this.mBGMAudioSource.Play();
    }

    //有可能会在1秒内调用多次，所以暂时先不处理
    // private _isPlayingTimeOut: boolean = false;
    public PlayTimeout() {
        // if (this._isPlayingTimeOut) {
        //     return;
        // }
        // this.PlayOneShot(this.mTimeout);
        // this._isPlayingTimeOut = true;
        // this.StartCoroutine(this.RunSFXCallBack(1, () => {
        //     this._isPlayingTimeOut = false;
        // }));
    }

    // *RunSFXCallBack(waitTime: number, cb: Function) {
    //     yield new WaitForSeconds(waitTime);
    //     cb();
    // }

    public PlayRoundOver() {
        this.PlayOneShot(this.mRoundOver);
    }

    public PlayGameOver() {
        this.PlayOneShot(this.mGameOver);
    }

    public PlayOpenLight() {
        this.PlayOneShot(this.mOpenLight);
    }

    public PlayOneShot(clip: AudioClip) {
        //console.error("playOneShot " + clip.name);
        this.mEffectAudioSource.PlayOneShot(clip);
    }

    public PlayAtPoint(clip: AudioClip, point: Vector3) {
        AudioSource.PlayClipAtPoint(clip, point);
    }

    public PlayGetReward() {
        this.PlayOneShot(this.mGetReward);
    }

}