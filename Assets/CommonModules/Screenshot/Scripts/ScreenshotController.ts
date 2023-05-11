import { AudioListener, Camera, Coroutine, GameObject, LayerMask, Rect, RenderTexture, Screen, Sprite, Texture2D, TextureFormat, Vector2, WaitForEndOfFrame } from 'UnityEngine'
import { UnityEvent } from 'UnityEngine.Events';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { VideoResolutions, WorldVideoRecorder, ZepetoWorldContent } from 'ZEPETO.World';
import { Image } from 'UnityEngine.UI';

export default class ScreenshotController extends ZepetoScriptBehaviour {
    /**  
     * 스크린샷 관련 기능(사진/비디오찍기, 피드 올리기 등)을 가지고 있는 클래스 
     * @remarks 플로우, 기능 호출은 ScreenshotManager 클래스에서 컨트롤 
     */

    @SerializeField() private _screenshotRenderTexture: RenderTexture;
    @SerializeField() private _maxDuration: number = 60;
    @SerializeField() private _resolutionType: VideoResolutions = VideoResolutions.W720xH1280;
    @SerializeField() private _layerToHideFromScreenshot: string;

    private _mainCamera: Camera; // 제페토 캐릭터에 붙어 있는 메인 카메라
    private _screenshotCamera: Camera; // 로직 충돌 방지를 위해 메인 카메라를 복제한 스크린샷 전용 카메라를 사용
    private _onScreenshotDone: UnityEvent;
    private _onFailCheckEvent: UnityEvent;
    private _onFailEvent: UnityEvent;
    private _onSuccessEvent: UnityEvent;
    private _onProgressEvent: UnityEvent;
    private _onVideoRecordingStartEvent: UnityEvent;
    private _onDuringVideoRecordingEvent: UnityEvent;
    private _onVideoRecordingStopEvent: UnityEvent;
    private _coRecordVideo: Coroutine;
    private _eventResult: boolean;

    /** 
     * 변수의 데이터가 유효한 지 체크하는 함수 
     * @param {any} value - defined 혹은 null인지 체크할 변수 전달. 
     * @returns {bool} 값이 defined 혹은 null 이면 false 반환. 
     */
    private IsValid(value: any) {
        if (value == undefined || value == null) {
            return false;
        }
        return true;
    }
    /** @returns {RenderTexture} 사진 렌더 텍스쳐 반환 */
    public get ScreenshotRenderTexture() {
        if (!this.IsValid(this._screenshotRenderTexture)) {
            console.error("Invalid screenshot RenderTexture for recording");
            return null;
        }
        return this._screenshotRenderTexture;
    }

    /** @returns {number} 녹화 가능 최대 시간 반환 */
    public get MaxDuration() {
        if (!this.IsValid(this._maxDuration)) {
            console.error("Invalid max duration for recording");
            return 0;
        }
        return this._maxDuration;
    }

    /** @returns {bool} 결과물 업로드, 저장, 공유에 대한 결과를 반환 */
    public get EventResult(): boolean {
        if (!this.IsValid(this._maxDuration)) {
            console.error("Invalid Event Result");
            return false;
        }
        return this._eventResult;
    }

    /** @returns {UnityEvent} 스크린샷 찍은 후 취할 이벤트 변수를 반환 */
    public get OnScreenshotDone() {
        if (!this.IsValid(this._onScreenshotDone)) {
            this._onScreenshotDone = new UnityEvent();
        }
        return this._onScreenshotDone;
    }

    /** @returns {UnityEvent} Fail check를 위한 이벤트 변수를 반환 */
    public get OnFailCheckEvent() {
        if (!this.IsValid(this._onFailCheckEvent)) {
            this._onFailCheckEvent = new UnityEvent();
        }
        return this._onFailCheckEvent;
    }

    /** Fail check 이벤트를 초기화 */
    public ResetOnFailCheckEvent() {
        if (!this.IsValid(this._onFailCheckEvent)) {
            console.error("Invalid OnFailCheckEvent");
            return;
        }
        this._onFailCheckEvent.RemoveAllListeners();
    }

    /** @returns {UnityEvent} 결과물 업로드, 저장, 공유를 실패했을 시 취할 이벤트 반환 */
    public get OnFailEvent() {
        if (!this.IsValid(this._onFailEvent)) {
            this._onFailEvent = new UnityEvent();
        }
        return this._onFailEvent;
    }

    /** 결과물 업로드, 저장, 공유를 실패했을 시 취할 이벤트를 초기화 */
    public ResetOnFailEvent() {
        if (!this.IsValid(this._onFailEvent)) {
            console.error("Invalid OnFailEvent");
            return;
        }
        this._onFailEvent.RemoveAllListeners();
    }

    /** @returns {UnityEvent} 결과물 업로드, 저장, 공유를 성공했을 시 취할 이벤트 반환 */
    public get OnSuccessEvent() {
        if (!this.IsValid(this._onSuccessEvent)) {
            this._onSuccessEvent = new UnityEvent();
        }
        return this._onSuccessEvent;
    }

    /** 결과물 업로드, 저장, 공유를 성공했을 시 취할 이벤트를 초기화 */
    public ResetOnSuccessEvent() {
        if (!this.IsValid(this._onSuccessEvent)) {
            console.error("Invalid OnSuccessEvent");
            return
        };

        this._onSuccessEvent.RemoveAllListeners();
    }

    /** @returns {UnityEvent} 업로드, 저장, 공유 진행 중 취할 이벤트를 반환 (예시: 프로그래스 토스트창) */
    public get OnProgressEvent() {
        if (!this.IsValid(this._onProgressEvent)) {
            this._onProgressEvent = new UnityEvent();
        }
        return this._onProgressEvent;
    }

    /** 결과물 업로드, 저장, 공유 진행 중 취할 이벤트를 반환 */
    public ResetProgressEvent() {
        if (!this.IsValid(this._onProgressEvent)) {
            console.error("Invalid ProgreeEventt");
            return;
        }
        this._onProgressEvent.RemoveAllListeners();
    }

    /** @returns {UnityEvent} 비디오 녹화를 시작할 때 취할 이벤트를 리턴 */
    public get OnVideoRecordingStartEvent() {
        if (!this.IsValid(this._onVideoRecordingStartEvent)) {
            this._onVideoRecordingStartEvent = new UnityEvent();
        }
        return this._onVideoRecordingStartEvent;
    }

    /** 비디오 녹화를 시작할 때 취할 이벤트를 초기화 */
    public ResetOnVideoRecordingStartEvent() {
        if (!this.IsValid(this._onVideoRecordingStartEvent)) {
            console.error("Invalid OnVideoRecordingStartEvent");
            return;
        }
        this._onVideoRecordingStartEvent.RemoveAllListeners();
    }

    /** @returns {UnityEvent} 비디오 녹화 중 취할 이벤트를 반환. */
    public get OnDuringVideoRecordingEvent() {
        if (!this.IsValid(this._onDuringVideoRecordingEvent)) {
            this._onDuringVideoRecordingEvent = new UnityEvent();
        }
        return this._onDuringVideoRecordingEvent;
    }

    /** 비디오 녹화 중 취할 이벤트를 초기화 */
    public ResetOnDuringVideoRecordingEvent() {
        if (!this.IsValid(this._onDuringVideoRecordingEvent)) {
            console.error("Invalid OnDuringVideoRecordingEvent");
            return;
        }
        this._onDuringVideoRecordingEvent.RemoveAllListeners();

    }

    /** @returns {UnityEvent} 비디오 녹화가 끝났을 때 취할 이벤트 반환 */
    public get OnVideoRecordingStopEvent() {
        if (!this.IsValid(this._onVideoRecordingStopEvent)) {
            this._onVideoRecordingStopEvent = new UnityEvent();
        }
        return this._onVideoRecordingStopEvent;
    }

    /** 비디오 녹화가 끝났을 때 취할 이벤트를 초기화 */
    public ResetOnVideoRecordingStopEvent() {
        if (!this.IsValid(this._onVideoRecordingStopEvent)) {
            console.error("Invalid OnVideoRecoringStopEvent");
            return;
        }
        this._onVideoRecordingStopEvent.RemoveAllListeners();
    }

    /** 사진을 찍는 함수 */
    public StartTakePhotoScreenshot(isVideo?: boolean) {
        // 메인 카메라 복제 후 스크린샷 카메라로 사용. 카메라 설정 충돌을 피하기 위하여. (e.g. cullingMask 충돌)
        let screenshotCamera = (GameObject.Instantiate(this._mainCamera) as GameObject).GetComponent<Camera>();
        GameObject.Destroy(screenshotCamera.GetComponent<AudioListener>());
        screenshotCamera.gameObject.name = "ScreenshotCamera";

        if (this._layerToHideFromScreenshot) {
            screenshotCamera.cullingMask = ~(1 << LayerMask.NameToLayer(this._layerToHideFromScreenshot));
        }

        screenshotCamera.targetTexture = this._screenshotRenderTexture;
        this.StartCoroutine(this.CoTakePhotoScreenshot(screenshotCamera, isVideo));
    }

    /** 사진 찍는 코루틴 함수 */
    private *CoTakePhotoScreenshot(camera: Camera, isVideo?: boolean) {
        let waitForEndOfFrame = new WaitForEndOfFrame();
        yield waitForEndOfFrame;
        camera.transform.position = this._mainCamera.transform.position;
        camera.transform.rotation = this._mainCamera.transform.rotation;
        camera.Render();
        camera.targetTexture = null;
        yield waitForEndOfFrame;

        // 스크린샷 찍은 후 Unity Event 실행
        if (!this.IsValid(isVideo)) {
            if (this.IsValid(this._onScreenshotDone)) {
                this._onScreenshotDone.Invoke();
            }
        }

        // 사진 찍은 후 임시 카메라 파괴
        GameObject.Destroy(camera.gameObject);
    }

    /** 비디오 녹화 시작/정지하는 함수 */
    public RecordVideo() {
        if (WorldVideoRecorder.IsRecording()) {
            // 레코딩 멈추기
            this.StopCoroutine(this._coRecordVideo);
            this.RecordingDone();
        } else {
            // 레코딩 시작
            this._coRecordVideo = this.StartCoroutine(this.CoRecordVideo());
        }
    }

    /** 비디오 녹화 코루틴 함수 */
    private *CoRecordVideo() {
        // 메인 카메라 복제 후 스크린샷 카메라로 사용. 카메라 설정 충돌을 피하기 위하여. (e.g. cullingMask 충돌)
        this._screenshotCamera = (GameObject.Instantiate(this._mainCamera) as GameObject).GetComponent<Camera>();
        GameObject.Destroy(this._screenshotCamera.GetComponent<AudioListener>());
        this._screenshotCamera.gameObject.name = "ScreenshotCamera";

        if (this._layerToHideFromScreenshot) {
            // 녹화된 영상에서 아이콘 숨겨주기 위해 녹화 카메라의 컬링마스크 변경
            this._screenshotCamera.cullingMask = ~(1 << LayerMask.NameToLayer(this._layerToHideFromScreenshot));
        }

        // 녹화 시작
        let startRecording = WorldVideoRecorder.StartRecording(this._screenshotCamera, this._resolutionType, this._maxDuration);

        if (!startRecording) {
            // 비디오 녹화 시작 실패 시 이벤트
            if (this.IsValid(this._onFailEvent)) {
                this._onFailEvent.Invoke();
            }
        } else {
            // 녹화 비디오 녹화 시작 성공 시 이벤트
            if (this.IsValid(this._onVideoRecordingStartEvent)) {
                this._onVideoRecordingStartEvent.Invoke();
            }
        }

        // 녹화는 시작되었으나 녹화 진행은 실패할 시 실패 이벤트 호출
        if (startRecording && !WorldVideoRecorder.IsRecording()) {
            if (this.IsValid(this._onFailEvent)) {
                this._onFailEvent.Invoke();
            }
            return;
        }

        // 녹화가 진행되는 동안 이벤트 계속 호출
        while (WorldVideoRecorder.IsRecording()) {
            this._onDuringVideoRecordingEvent.Invoke();
            yield null;
        }

        // max duration 시간을 넘겨 녹화가 자동 정지 되었을 때 녹화 마무리하는 함수 호출
        this.RecordingDone();
    }

    /** 비디오 녹화가 끝났을 때 호출되는 함수 */
    private RecordingDone() {
        if (this.IsValid(this._onVideoRecordingStopEvent)) {
            this._onVideoRecordingStopEvent.Invoke();
        }
        WorldVideoRecorder.StopRecording();
        GameObject.Destroy(this._screenshotCamera.gameObject);
        this._screenshotCamera = null;
    }

    /** 프리뷰창에서 녹화된 영상을 플레이하는 함수
     *  @param {GameObject} playerObject - 비디오가 재생될 GameObject
     *  @param {number} width - 재생될 영상의 가로 길이
     *  @param {number} height - 재생될 영상의 세로 길이
     */
    public PlayPreviewVideo(playerObject: GameObject, width: number, height: number) {
        let videoPlayer = WorldVideoRecorder.AddVideoPlayerComponent(playerObject, width, height);
        if (videoPlayer == null) {
            return;
        }
        videoPlayer.isLooping = true;
        videoPlayer.Play();
    }

    /** 스크린 샷을 위한 카메라를 세팅하는 함수 */
    public SetScreenshotCamera(camera: Camera) {
        this._mainCamera = camera;
    }

    /** 피드에 사진 올리는 함수*/
    public PhotoPostToFeed(feedMessage: string) {
        /** 스크린샷 매니저에서 지정된 프로그래스 이벤트 실행 */
        if (this.IsValid(this._onProgressEvent)) {
            this._onProgressEvent.Invoke();
        }

        ZepetoWorldContent.CreateFeed(this._screenshotRenderTexture, feedMessage, (result: boolean) => {
            if (result && this.IsValid(this._onSuccessEvent)) {
                this._onSuccessEvent.Invoke();
            }

            if (!result && this.IsValid(this._onFailEvent)) {
                this._onFailEvent.Invoke();
            }
            console.log(`CreateFeedScreenShot Result: ${result}`);
        });
        console.log("CreateFeedScreenShot Called");
    }

    public PhotoTexturePostToFeed(feedMessage: string, texture2D: Texture2D, callback: Function) {
        ZepetoWorldContent.CreateFeed(texture2D, feedMessage, (result: boolean) => {
            if (result && this.IsValid(callback)) {
                callback(result);
            }
            console.log(`CreateFeedScreenShot Result: ${result}`);
        });
        console.log("CreateFeedScreenShot Called");
    }

    /** 사진 저장하는 함수 */
    public PhotoSave() {
        /** 스크린샷 매니저에서 지정된 프로그래스 이벤트 실행 */
        if (this.IsValid(this._onProgressEvent)) {
            this._onProgressEvent.Invoke();
        }

        if (this.IsValid(this._onFailCheckEvent)) {
            this._onFailCheckEvent.Invoke();
            this._eventResult = false;
        }

        ZepetoWorldContent.SaveToCameraRoll(this._screenshotRenderTexture, (result: boolean) => {
            if (result) {
                if (result && this.IsValid(this._onSuccessEvent)) {
                    this._eventResult = true;
                    this._onSuccessEvent.Invoke();
                }

                if (!result && this.IsValid(this._onFailEvent)) {
                    this._onFailEvent.Invoke();
                }
            }
            console.log(`SaveScreenShot Result: ${result}`);
        });
        console.log("SaveScreenShot Called");
    }

    /** 사진 공유하는 함수 */
    public PhotoShare() {
        /** 스크린샷 매니저에서 지정된 프로그래스 이벤트 실행 */
        if (this.IsValid(this._onProgressEvent)) {
            this._onProgressEvent.Invoke();
        }

        if (this.IsValid(this._onFailCheckEvent)) {
            this._onFailCheckEvent.Invoke();
            this._eventResult = false;
        }

        ZepetoWorldContent.Share(this._screenshotRenderTexture, (result: boolean) => {

            if (result && this.IsValid(this._onSuccessEvent)) {
                this._eventResult = true;
                this._onSuccessEvent.Invoke();
            }

            if (!result && this.IsValid(this._onFailEvent)) {
                this._onFailEvent.Invoke();
            }
            console.log(`ShareScreenShot Result: ${result}`);
        });
        console.log("ShareScreenShot Called");
    }

    /** 피드에 비디오 올리는 함수 */
    public VideoPostToFeed(feedMessage: string) {
        /** 스크린샷 매니저에서 지정된 프로그래스 이벤트 실행 */
        if (this.IsValid(this._onProgressEvent)) {
            this._onProgressEvent.Invoke();
        }

        WorldVideoRecorder.CreateFeed(feedMessage, (result) => {
            if (result && this.IsValid(this._onSuccessEvent)) {
                this._eventResult = true;
                this._onSuccessEvent.Invoke();
            }

            if (!result && this.IsValid(this._onFailEvent)) {
                this._onFailEvent.Invoke();
            }

            console.log(`CreateFeedScreenShot Result: ${result}`);
        });
        console.log("CreateFeedScreenShot Called");
    }

    /** 비디오 저장하는 함수 */
    public VideoSave() {
        /** 스크린샷 매니저에서 지정된 프로그래스 이벤트 실행 */
        if (this.IsValid(this._onProgressEvent)) {
            this._onProgressEvent.Invoke();
        }

        if (this.IsValid(this._onFailCheckEvent)) {
            this._onFailCheckEvent.Invoke();
            this._eventResult = false;
        }

        WorldVideoRecorder.SaveToCameraRoll((result) => {
            if (result) {
                if (result && this.IsValid(this._onSuccessEvent)) {
                    this._eventResult = true;
                    this._onSuccessEvent.Invoke();
                }

                if (!result && this.IsValid(this._onFailEvent)) {
                    this._onFailEvent.Invoke();
                }
            }
            console.log(`SaveScreenShot Result: ${result}`);
        });
        console.log("SaveScreenShot Called");
    }

    /** 비디오 공유하는 함수 */
    public VideoShare() {
        /** 스크린샷 매니저에서 지정된 프로그래스 이벤트 실행 */
        if (this.IsValid(this._onProgressEvent)) {
            this._onProgressEvent.Invoke();
        }

        if (this.IsValid(this._onFailCheckEvent)) {
            this._onFailCheckEvent.Invoke();
            this._eventResult = false;
        }

        WorldVideoRecorder.Share((result) => {
            if (result) {
                if (result && this.IsValid(this._onSuccessEvent)) {
                    this._eventResult = true;
                    this._onSuccessEvent.Invoke();
                }

                if (!result && this.IsValid(this._onFailEvent)) {
                    this._onFailEvent.Invoke();
                }
            }
            console.log(`ShareScreenShot Result: ${result}`);
        });
        console.log("ShareScreenShot Called");
    }

    LateUpdate() {
        if (!this.IsValid(this._screenshotCamera)) {
            return;
        }

        // 촬영 카메라의 위치, 회전을 메인 카메라의 값과 같게 해준다. 
        this._screenshotCamera.transform.position = this._mainCamera.transform.position;
        this._screenshotCamera.transform.rotation = this._mainCamera.transform.rotation;
    }

    public CreateFeedImmediately(callback: Function) {
        this.StartCoroutine(this.CoCreateFeedImmediately(callback));
    }

    private *CoCreateFeedImmediately(callback: Function) {
        let waitForEndOfFrame = new WaitForEndOfFrame();
        yield waitForEndOfFrame;
        let tex: Texture2D = new Texture2D(Screen.width, Screen.height, TextureFormat.RGB24, false);
        tex.ReadPixels(new Rect(0, 0, tex.width, tex.height), 0, 0);
        tex.Apply();
        this.PhotoTexturePostToFeed("没有办法，我就是这么强大，啦啦啦啦啦！敢来和我一起玩躲猫猫吗？", tex, callback);
    }
}