import { GameObject, RectTransform, Time, Transform } from 'UnityEngine';
import { UnityEvent } from 'UnityEngine.Events';
import { Button, Image, InputField, Text, RawImage } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization from '../../../Scripts/Common/Localization/Scripts/Localization';
import ToastAnimator from './ToastAnimator';

export default class ScreenshotUIController extends ZepetoScriptBehaviour {
    /**  
     * 스크린샷 UI 관련 기능을 가지고 있는 클래스 
     * @remarks 플로우, 기능 호출은 ScreenshotManager 클래스에서 컨트롤 
     */

    @SerializeField() private _screenshotCanvas: GameObject;

    @Header("Screenshot Main Buttons")
    @SerializeField() private _screenShotButton: Button;
    @SerializeField() private _takePhotoScreenshotButton: Button;
    @SerializeField() private _takeVideoScreenshotButton: Button;
    // @SerializeField() private selfieButton: Button; /** 지금 사용 안함 */
    @SerializeField() private _userNameOnButton: Button;
    @SerializeField() private _userNameOffButton: Button;
    @SerializeField() private _exitButton: Button;

    @Header("Video Recording UI")
    @SerializeField() private _recordingProgressDoughnut: Image;
    @SerializeField() private _videoTimer: GameObject;

    // Localization
    @Header("Screenshot Text")
    public screenshotResultText: Text;
    public screenshotResultEditText: Text;
    public screenshotResultUploadText: Text;
    public screenshotFailText: Text;
    public screenshotSuccessText: Text;
    public screenshotProgressText: Text;
    public previewDescriptionText: Text;
    public previewUploadButtonText: Text;
    public LimitToastText: Text;

    @Header("Easy Upload Toast Window Prefab")
    @SerializeField() private _toastPanel: GameObject;
    @SerializeField() private _easyUploadToastPrefab: GameObject;
    @SerializeField() private _failToastPrefab: GameObject;
    @SerializeField() private _successToastPrefab: GameObject;
    @SerializeField() private _progressToastPrefab: GameObject;

    @Header("Preview Window Prefab")
    @SerializeField() private _previewPanel: GameObject;
    @SerializeField() private _previewInputField: InputField;
    @SerializeField() private textLimitToast: GameObject;
    @SerializeField() private _previewExitButton: Button;
    @SerializeField() private _previewShareButton: Button;
    @SerializeField() private _previewSaveButton: Button;
    @SerializeField() private _previewUploadButton: Button;
    @SerializeField() private _previewRawImage: GameObject;

    private _originalFeedMsg: string;

    // Toast windows
    private _easyUploadButton: Button;
    private _textLimitToast: GameObject;
    private _failToast: GameObject;
    private _successToast: GameObject;
    private _progressToast: GameObject;
    private _easyUploadToast: GameObject;

    // 유저 네임 디스플레이 버튼 초기화 이벤트
    private _initializeUserNameButtonEvent: UnityEvent;

    private _isLocalize: boolean = false;
    public LocalizeUITexts() {
        this._isLocalize = true;

        this.screenshotResultText.text = Localization.Instance.GetLocalizedText("SCREENSHOT_SCREENSHOTSHOOTDONE");
        this.screenshotResultEditText.text = Localization.Instance.GetLocalizedText("SCREENSHOT_SCREENSHOTEDIT");
        this.screenshotResultUploadText.text = Localization.Instance.GetLocalizedText("SCREENSHOT_UPLOAD");
        this.screenshotFailText.text = Localization.Instance.GetLocalizedText("SCREENSHOT_TOASTFAIL");
        this.screenshotSuccessText.text = Localization.Instance.GetLocalizedText("SCREENSHOT_TOASTSUCCESS");
        this.screenshotProgressText.text = Localization.Instance.GetLocalizedText("SCREENSHOT_TOASTPROGRESS");
        this.previewUploadButtonText.text = Localization.Instance.GetLocalizedText("SCREENSHOT_PREVIEWUPLOAD");
        this.previewDescriptionText.text = Localization.Instance.GetLocalizedText("SCREENSHOT_PREVIEWDESCRIPTIONTITLE");
        this._previewInputField.text = Localization.Instance.GetLocalizedText("SCREENSHOT_PREVIEWFEEDMESSAGEPLACEHOLDER");
        this.LimitToastText.text = Localization.Instance.GetLocalizedText("SCREENSHOT_TOASTMAXCHARACTER");
        this._originalFeedMsg = Localization.Instance.GetLocalizedText("SCREENSHOT_PREVIEWFEEDMESSAGEPLACEHOLDER");
    }

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

    /**  @returns {Button} 사진 찍기 버튼 레퍼런스 반환 */
    public get TakePhotoScreenshotButton() {
        if (!this.IsValid(this._takePhotoScreenshotButton)) {
            console.error("Invalid PhotoScreenshot Button");
        }
        return this._takePhotoScreenshotButton;
    }

    /** @returns {Button} 비디오 찍기 버튼 레퍼런스 반환 */
    public get TakeVideoScreenshotButton() {
        if (!this.IsValid(this._takeVideoScreenshotButton)) {
            console.error("Invalid VideoScreenshot Button");
        }
        return this._takeVideoScreenshotButton;
    }

    /** @returns {Button} 유저 네임 On Button 레퍼런스 반환 */
    public get UserNameOnButton() {
        if (!this.IsValid(this._userNameOnButton)) {
            console.error("Invalid UserNameOnButton Button");
        }
        return this._userNameOnButton;
    }

    /** @returns {Button} 유저 네임 Off Button 레퍼런스 반환 */
    public get UserNameOffButton() {
        if (!this.IsValid(this._userNameOffButton)) {
            console.error("Invalid UserNameOffButton Button");
        }
        return this._userNameOffButton;
    }

    /**  @returns {Button} Exit Button 레퍼런스 반환 */
    public get ExitButton() {
        if (!this.IsValid(this._exitButton)) {
            console.error("Invalid ExitButton Button");
        }
        return this._exitButton;
    }

    /** @returns {Image} 프로그래스창 도넛 이미지 반환 */
    public get RecordingProgressDoughnut() {
        if (!this.IsValid(this._recordingProgressDoughnut)) {
            console.error("Invalid RecordingProgressDoughnut Image");
        }
        return this._recordingProgressDoughnut;
    }

    /** @returns {GameObject} 비디오 녹화 타이머 게임 오브젝트 반환 */
    public get VideoTimer() {
        if (!this.IsValid(this._videoTimer)) {
            console.error("Invalid VideoTimer GameObject");
        }
        return this._videoTimer;
    }

    /** @returns {bool} 스크린샷 UI 활성화 여부 반환 */
    public get IsUIActive(): bool {
        if (!this.IsValid(this._screenshotCanvas)) {
            console.error("Invalid screenshotCanvas");
        }
        return this._screenshotCanvas.activeSelf;
    }

    /** @returns {string} 피드의 원본 문자열을 저장하는 변수 반환 */
    public get OriginalFeedMsg() {
        if (!this.IsValid(this._originalFeedMsg)) {
            console.error("Invalid OriginalFeed");
        }
        return this._originalFeedMsg;
    }

    /** @param {any} value - 간편 업로드 토스트창 인스턴스 변수 */
    public set EasyUploadToast(value: any) {
        this._easyUploadToast = value;
    }

    /** 
     * @returns {GameObject} 간편 업로드 토스트창 인스턴스 레퍼런스 반환 
     */
    public get EasyUploadToast() {
        return this._easyUploadToast;
    }

    /** @param {any} value - 프로그래스 토스트창 인스턴스 변수 */
    public set ProgressToast(value: any) {
        this._progressToast = value;
    }

    /** @returns {GameObject} 프로그래스 토스트창 인스턴스 레퍼런스 반환 */
    public get ProgressToast(): GameObject {
        return this._progressToast;
    }

    /** @param {any} value - 실패 토스트창 인스턴스 변수 */
    public set FailToast(value: any) {
        this._failToast = value;
    }

    /** @returns {GameObject} 실패 토스트창 인스턴스 레퍼런스 반환 */
    public get FailToast(): GameObject {
        return this._failToast;
    }

    /** @param {any} value - 성공 토스트창 인스턴스 변수 */
    public set SuccessToast(value: any) {
        this._successToast = value;
    }

    /** @returns {GameObject} 성공 토스트창 인스턴스 레퍼런스 반환 */
    public get SuccessToast(): GameObject {
        return this._successToast;
    }

    /** @param {any} value - 프리뷰 텍스트 리밋 경고 토스트장 변수 */
    public set TextLimitToast(value: any) {
        this._textLimitToast = value;
    }

    /** @returns {GameObject} 프리뷰 텍스트 리밋 경고 토스트창 인스턴스 레퍼런스 반환 */
    public get TextLimitToast(): GameObject {
        return this._textLimitToast;
    }

    /** @param {Button} uploadButton - 간편 업로드 버튼 할당 */
    public set UploadButton(uploadButton: Button) {
        this._easyUploadButton = uploadButton;
    }

    /** @returns {UnityEvent} 플레이 시작 시 유저 네임 디스플레이 버튼 어떻게 보여줄지 초기화하는 유니티 이벤트 레퍼런스 반환 */
    public get InitializeUserNameButtonEvent() {
        if (!this.IsValid(this._initializeUserNameButtonEvent)) {
            this._initializeUserNameButtonEvent = new UnityEvent();
        }
        return this._initializeUserNameButtonEvent;
    }

    /** * @returns {bool} 프리뷰 창의 활성화 여부 반환 */
    public get IsPreviewWindowActive() {
        if (!this.IsValid(this._previewPanel)) {
            console.error("Invalid Preview Panel");
        }
        return this._previewPanel.activeSelf;
    }

    /** @returns {GameObject} 프리뷰 창 레퍼런스 반환 */
    public get PreviewWindow() {
        if (!this.IsValid(this._previewPanel)) {
            console.error("Invalid Preview Panel");
        }
        return this._previewPanel;
    }

    /** @returns {InputField} 프리뷰 창 피드 텍스트 인풋 필드 레퍼런스 반환 */
    public get PreviewInputField() {
        if (!this.IsValid(this._previewInputField)) {
            console.error("Invalid Preview Input Field");
        }
        return this._previewInputField;
    }

    /** 
     * @returns {Button} 프리뷰 창 Exit 버튼 레퍼런스 반환 
     */
    public get PreviewExitButton() {
        if (!this.IsValid(this._previewExitButton)) {
            console.error("Invalid Preview Exit Button");
        }
        return this._previewExitButton;
    }

    /** @returns {Button} 프리뷰 창 공유 버튼 레퍼런스 반환 */
    public get PreviewShareButton() {
        if (!this.IsValid(this._previewShareButton)) {
            console.error("Invalid Preview Share Button");
        }
        return this._previewShareButton;
    }

    /** @returns {Button} 프리뷰 창 저장 버튼 레퍼런스 반환 */
    public get PreviewSaveButton() {
        if (!this.IsValid(this._previewSaveButton)) {
            console.error("Invalid Preview Save Button");
        }
        return this._previewSaveButton;
    }

    /** @returns {Button} 프리뷰 창 업로드 버튼 레퍼런스 반환 */
    public get PreviewUploadButton() {
        if (!this.IsValid(this._previewUploadButton)) {
            console.error("Invalid Preview Upload Button");
        }
        return this._previewUploadButton;
    }

    /** @returns {GameObject} 프리뷰 창 미리보기 이미지의 게임 오브젝트 반환 */
    public get PreviewRawImage() {
        if (!this.IsValid(this._previewRawImage)) {
            console.error("Invalid Preview Raw Image");
        }
        return this._previewRawImage;
    }

    /** @returns {Texture} PreviewRawImage의 mainTexture를 반환 */
    public get GetPreviewRawImageMainTexture() {
        if (!this.IsValid(this._previewRawImage)) {
            console.error("Invalid Preview Raw Image");
        }
        return this._previewRawImage.GetComponent<RawImage>().mainTexture;
    }

    /** 스크린샷 UI 보여주는 함수 */
    public ShowUI() {
        if (!this._isLocalize) {
            this.LocalizeUITexts();
        }
        this._screenshotCanvas.SetActive(true);
        this.SetScreenButtonStatus(true);
    }

    /** 스크린샷 UI 숨겨주는 함수 */
    public HideUI() {
        this._screenshotCanvas.SetActive(false);
        this.SetScreenButtonStatus(false);
    }

    public SetScreenButtonStatus(isOn: boolean) {
        if (this._screenShotButton) {
            if (this._screenShotButton.transform.childCount > 0) {
                this._screenShotButton.transform.GetChild(0).gameObject.SetActive(isOn);
            }
        }
    }

    /** 
     * 공유/저장/업로드 버튼 한번만 클릭하도록 만들 때 사용하는 함수
     * @param {bool} isInteractable - true 전달 시 클릭 활성화. false 전달 시 클릭 비활성화.  
     */
    public AllowOnlyOneClick(isInteractable: bool) {
        // 프리뷰 업로드 버튼
        if (this._previewPanel.activeSelf && this._previewUploadButton) {
            this._previewUploadButton.interactable = isInteractable;
        }

        // 프리뷰 저장 버튼
        if (this._previewPanel.activeSelf && this._previewSaveButton) {
            this._previewSaveButton.interactable = isInteractable;
        }

        // 프리뷰 공유 버튼
        if (this._previewPanel.activeSelf && this._previewShareButton) {
            this._previewShareButton.interactable = isInteractable;
        }

        // 간편 업로드 버튼
        if (!GameObject.op_Equality(this._easyUploadButton, null)) {
            this._easyUploadButton.interactable = isInteractable;
        }
    }

    /** 
     * 사진 찍기 버튼, 비디오 찍기 버튼 비활성/활성하는 함수
     * @param {bool} isActive - true 전달 시 클릭 활성화. false 전달 시 클릭 비활성화.
     */
    public ActivateScreenshotButtons(isActive: bool) {
        this._takePhotoScreenshotButton.interactable = isActive;
        this._takeVideoScreenshotButton.interactable = isActive;
    }

    /** 
     * 프로그래스 도넛 채우는 함수. 시간 기준 
     * @param {number} startTime - 도넛을 채우기 사직하는 시간
     * @param {number} duration  - 도넛을 채우기까지 걸리는 시간
     * @param {Image}  doughnut  - 전달되는 도넛 이미지가 없으면 레코딩 도넛 사용
     */
    public FillProgressDoughnut(startTime: number, duration: number, doughnut?: Image) {
        if (!this.IsValid(doughnut)) {
            doughnut = this._recordingProgressDoughnut;
        }
        doughnut.fillAmount = (Time.time - startTime) / duration;
    }

    /** 간편 업로드 토스트창 보여주는 함수 */
    public ShowEasyUploadToastWindow() {
        this._easyUploadToast = this.InstantiateToast(this._easyUploadToast, this._easyUploadToastPrefab, this._toastPanel.transform);
    }

    /** 진행 상황 토스트창 보여주는 함수 */
    public ShowProgressToastWindow() {
        this._progressToast = this.InstantiateToast(this._progressToast, this._progressToastPrefab, this._toastPanel.transform);
    }

    /** Fail 토스트창 보여주는 함수 */
    public ShowFailToastWindow() {
        this._failToast = this.InstantiateToast(this._failToast, this._failToastPrefab, this._toastPanel.transform);
    }

    /** Success 토스트창 보여주는 함수 */
    public ShowSuccessToastWindow() {
        this._successToast = this.InstantiateToast(this._successToast, this._successToastPrefab, this._toastPanel.transform);
    }

    /** 텍스트 길이 경고 토스트창 보여주는 함수 */
    public ShowTextLimitToastWindow() {
        this._textLimitToast = this.InstantiateToast(this._textLimitToast, this.textLimitToast, this._toastPanel.transform);
    }

    /** 
     * 토스트창 생성하는 함수. 먼저 내려온 토스트창이 있을 시 덮어씌우고 이전 것은 사라짐 
     * @param {GameObject} toast  - 새로 생성된 토스트창 인스턴스를 저장하는 변수
     * @param {GameObject} prefab - 생성할 토스트창의 프리팹
     * @param {Transform}  parent - 생성된 토스트창을 붙일 부모 객체의 트랜스폼
     * @returns {GameObject} 새로 생성된 토스트창 반환 
     */
    private InstantiateToast(toast: GameObject, prefab: GameObject, parent: Transform): GameObject {
        if (toast) {
            toast.GetComponent<ToastAnimator>().DestoryToastWindow(1.0);
        }
        toast = GameObject.Instantiate(prefab) as GameObject;
        toast.transform.SetParent(parent, false);
        toast.gameObject.GetComponent<RectTransform>().SetAsLastSibling();
        toast.gameObject.GetComponent<ToastAnimator>().ShowToastWindow();
        return toast;
    }

    /** 버튼, 텍스트 필드 초기화하는 함수 */
    private InitializeScreenshotUI() {
        // 초기 피드 문자열 저장
        this._originalFeedMsg = this._previewInputField.text;

        /* --------------------------- TODO --------------------------- */
        // 유저 이름 버튼 설정 초기화 이벤트 
        //this._initializeUserNameButtonEvent.Invoke();
    }

    Awake() {
        // 초기화
        this.InitializeScreenshotUI();
    }
}