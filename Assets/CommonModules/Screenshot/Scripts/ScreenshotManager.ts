import { Color, Coroutine, GameObject, Time, WaitForSeconds, Mathf, Camera } from 'UnityEngine';
import { Button, Image, Text, RawImage } from 'UnityEngine.UI';
import { VideoPlayer } from 'UnityEngine.Video';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
// import QuestManager from '../../../Scripts/QuestManager';
// import SoundManager from '../../../Scripts/SoundManager';
import ScreenshotController from './ScreenshotController';
import ScreenshotUIController from './ScreenshotUIController';
import ToastAnimator from './ToastAnimator';

export default class ScreenshotManager extends ZepetoScriptBehaviour {
    /**  
     * 스크린샷 기능(ScreenshotController)과 스크린샷 UI(ScreenshotUIController)를 매니징 하는 클래스 
     * @remarks ScreenshotController와 ScreenshotUIController 기능을 호출해서 플로우를 만듬. 
     */

    private _screenshotController: ScreenshotController;
    private _screenshotUIController: ScreenshotUIController;
    private _isPhoto: bool;
    private _progressDoughnut: Image;
    private _coProgressToast: Coroutine;
    private _coRecordingTimer: Coroutine;
    private _videoTimerText: Text;
    private _canEnterOrExit: bool;

    /** 스크린샷 UI on/off하는 함수 */
    public ToggleScreenshotUI() {
        if (this._screenshotUIController.IsUIActive) {
            this.HideScreenshotUI();
        } else {
            this.ShowScreenshotUI();
        }
    }

    /** 스크린샷 UI 보여주는 함수 */
    public ShowScreenshotUI() {
        // 스크린샷 UI를 변경할 수 있는 상황이 아니면 함수 종료
        if (!this._canEnterOrExit) {
            return;
        }
        this._screenshotUIController.ShowUI();

        // 유저 이름 디스플레이 관련 설정
        this.ToggleUserNameDisplay(true);
        this._screenshotUIController.UserNameOnButton.gameObject.SetActive(false);
        // this._screenshotUIController.UserNameOffButton.gameObject.SetActive(true);
    }

    /** 스크린샷 UI 숨겨주는 함수 */
    public HideScreenshotUI() {
        // 스크린샷 UI를 변경할 수 있는 상황이 아니면 함수 종료
        if (!this._canEnterOrExit) {
            return;
        }
        this._screenshotUIController.HideUI();

        // 유저 이름 디스플레이 관련 설정
        this.ToggleUserNameDisplay(true);
        this._screenshotUIController.UserNameOnButton.gameObject.SetActive(false);
        // this._screenshotUIController.UserNameOffButton.gameObject.SetActive(true);
    }


    /** 
     * 유저 이름을 보여주거나 숨겨주는 함수 
     * @param {bool} showUserName true면 유저 이름 보여주고, false면 유저 이름 숨겨줌 
     */
    public ToggleUserNameDisplay(showUserName: bool) {
        //TODO: [인형의집, 네온파티] 아래 내용 ZepetoPlayersCustomizer 통해서 구현 필요. 
        if (showUserName) {
            // 유저 네임 보여주기
            // ZepetoPlayersCustomizer.Instance.ShowFloatingUIs();
        } else {
            //유저 네임 숨기기
            // ZepetoPlayersCustomizer.Instance.HideFloatingUIs();
        }
    }

    /** 프로그래스 도넛 찾아서 저장하는 함수 */
    private ProgressImageSetting() {
        let children = this._screenshotUIController.ProgressToast.GetComponentsInChildren<Image>();
        children.forEach(i => {
            if (i.name == "ProgressDoughnut") {
                this._progressDoughnut = i;
            }
        });
    }

    /** 자동으로 도넛 채우는 함수 */
    private AutoLoading() {
        this._coProgressToast = this.StartCoroutine(this.CoAutoLoading());
    }

    /** 프로그래스 도넛을 채우는 코루틴 함수 */
    private *CoAutoLoading() {
        let startTime = Time.time;
        this._progressDoughnut.color = new Color(92, 70, 255);
        this._progressDoughnut.fillAmount = 0;

        while (true) {
            if (GameObject.op_Equality(this._progressDoughnut, null)) {
                return;
            }
            this._screenshotUIController.FillProgressDoughnut(startTime, 9.0, this._progressDoughnut);
            yield null;
        }
    }

    /** 
     * 진행바 멈추는 함수
     * @param {bool} result true면 도넛을 full로 채우고 false면 그대로 둠 
     */
    private StopProgressAutoLoading(result: bool) {
        if (this._coProgressToast) {
            this.StopCoroutine(this._coProgressToast);
            this._coProgressToast = null;
        }

        if (result) {
            this.StartCoroutine(this.CoAutoLoadingFastComplete(0.5));
        }
    }

    /** 
     * 도넛을 자동으로 빠르게 채우는 코루틴 함수 
     * @param {number} duration 도넛을 채우기까지 걸리는 시간. e.g. 0.5 전달 시 0.5내로 도넛을 빠르게 채움.
     */
    private *CoAutoLoadingFastComplete(duration: number) {
        let startingFillAmount = this._progressDoughnut.fillAmount;
        let timeElapsed = 0;

        while (true) {
            if (GameObject.op_Equality(this._progressDoughnut, null)) {
                return;
            }

            if (this._progressDoughnut.fillAmount >= 1) {
                break;
            }
            this._progressDoughnut.fillAmount = Mathf.SmoothStep(startingFillAmount, 1, timeElapsed / duration);
            timeElapsed += Time.deltaTime;
            yield null;
        }
    }

    /** 
     * 일정 시간 뒤 토스트창 숨기는 코루틴 함수 
     * @param {GameObject} toast 숨겨야 하는 토스트창
     * @param {number} timer 토스트 창을 숨기기 위한 타이머. 1초 전달 시 1초 후에 토스트창 숨김.
     */
    private *CoHideToastWithTimer(toast: GameObject, timer: number) {
        let waitForSeconds = new WaitForSeconds(timer);
        yield waitForSeconds;

        if (GameObject.op_Equality(toast, null)) {
            return;
        }
        else {
            toast.GetComponent<ToastAnimator>().HideToastWindow();
        }
    }

    /** 
     * 토스트창을 보여주는 코루틴 함수
     * @param {bool} result true면 success toast창 보여줌. false면 fail toast창 보여줌.
     */
    private *CoShowToastWindow(result: bool) {
        // 프로그래스 토스트창이 존재할 경우에만 토스트창 파괴
        if (!GameObject.op_Equality(this._screenshotUIController.ProgressToast, null)) {
            this.StopProgressAutoLoading(result);
            this._screenshotUIController.ProgressToast.GetComponent<ToastAnimator>().DestoryToastWindow(0.5);
            this._screenshotUIController.ProgressToast = null;
        }

        if (result) {
            yield new WaitForSeconds(0.7);
            this._screenshotUIController.ShowSuccessToastWindow();
            this._screenshotUIController.SuccessToast.GetComponent<Button>().onClick.AddListener(() => {
                this._screenshotUIController.SuccessToast.GetComponent<ToastAnimator>().HideToastWindow();
                this._screenshotUIController.SuccessToast = null;
            });
            if (this._screenshotUIController.IsPreviewWindowActive) {
                this._screenshotUIController.PreviewWindow.SetActive(false);
                this._screenshotUIController.PreviewInputField.text = this._screenshotUIController.OriginalFeedMsg;
                this.HideScreenshotUI();

                // Show character ui input controller
                // ZepetoPlayersCustomizer.Instance.ShowInputController();
            }
            this.StartCoroutine(this.CoHideToastWithTimer(this._screenshotUIController.SuccessToast, 3));
            this._screenshotUIController.SuccessToast = null;

            this._screenshotUIController.AllowOnlyOneClick(true);
        }
        else {
            yield new WaitForSeconds(0.7);
            this._screenshotUIController.ShowFailToastWindow();
            this._screenshotUIController.FailToast.GetComponent<Button>().onClick.AddListener(() => {
                this._screenshotUIController.FailToast.GetComponent<ToastAnimator>().HideToastWindow();
                this._screenshotUIController.FailToast = null;
            });
            this.StartCoroutine(this.CoHideToastWithTimer(this._screenshotUIController.FailToast, 3));
            this._screenshotUIController.FailToast = null;
            this._screenshotUIController.AllowOnlyOneClick(true);
        }
    }

    /** Toast창 세팅하는 함수 */
    private SetToastWindows() {
        // 프로그래스 이벤트 지정하기
        this._screenshotController.OnProgressEvent.AddListener(() => {
            this._screenshotUIController.ShowProgressToastWindow();
            this._screenshotUIController.AllowOnlyOneClick(false);

            // 프로그래스 토스트창 버튼 이벤트 지정하기
            this._screenshotUIController.ProgressToast.GetComponent<Button>().onClick.AddListener(() => {
                this._screenshotUIController.ProgressToast.GetComponent<ToastAnimator>().HideToastWindow();
                this._screenshotUIController.ProgressToast = null;
            });

            this.ProgressImageSetting();
            this.AutoLoading();
        })

        // 실패 이벤트
        this._screenshotController.OnFailEvent.AddListener(() => {
            this.StartCoroutine(this.CoShowToastWindow(false));
        });

        // 성공 이벤트
        this._screenshotController.OnSuccessEvent.AddListener(() => {
            this.StartCoroutine(this.CoShowToastWindow(true));
        })
    }

    /** 사진/비디오 업로드하는 함수 */
    private OnClickUploadButton() {
        if (this._isPhoto) {
            this._screenshotController.PhotoPostToFeed(this._screenshotUIController.PreviewInputField.text);
        }
        else {
            this._screenshotController.VideoPostToFeed(this._screenshotUIController.PreviewInputField.text);
        }
    }

    /** 스크린샷 간편 업로드 토스트창 버튼 세팅하는 함수 */
    private ResultToastButtonSetting(easyUploadToast: GameObject) {
        let buttons = easyUploadToast.GetComponentsInChildren<Button>();

        buttons.forEach(button => {
            console.log(button.name);
            switch (button.name) {
                case "ScreenshotEditButton":
                    button.onClick.AddListener(() => {
                        console.log("screenshotResultEditButton!");
                        this.OnClickEditButton(easyUploadToast);
                    });
                    break;
                case "ScreenshotUploadButton":
                    this._screenshotUIController.UploadButton = button;
                    button.onClick.AddListener(() => {
                        console.log("screenshotResultUploadButton!");
                        this.OnClickUploadButton();
                        easyUploadToast.GetComponent<ToastAnimator>().HideToastWindow();
                        easyUploadToast = null;
                        this._screenshotUIController.EasyUploadToast = null;
                        this._screenshotUIController.ActivateScreenshotButtons(true);
                    });
                    break;
                case "ScreenshotResultExit":
                    button.onClick.AddListener(() => {
                        console.log("exitButtonClicked!");
                        easyUploadToast.GetComponent<ToastAnimator>().HideToastWindow();
                        easyUploadToast = null;
                        this._screenshotUIController.EasyUploadToast = null;
                        this._screenshotUIController.ActivateScreenshotButtons(true);
                    });
                    break;
                default:
                    break;
            }
        });

        // 진행중 비활성화한 버튼 활성화하기
        this._screenshotUIController.AllowOnlyOneClick(true);
    }

    /** 사진/비디오 수정하는 함수 */
    private OnClickEditButton(easyUploadToast: GameObject) {
        this._screenshotUIController.PreviewWindow.SetActive(true);
        this.HideScreenshotUI();

        easyUploadToast.GetComponent<ToastAnimator>().DestoryToastWindow(0);
        easyUploadToast = null;
        this._screenshotUIController.EasyUploadToast = null;
        this._screenshotUIController.ActivateScreenshotButtons(true);

        if (this._isPhoto) {
            this._screenshotUIController.PreviewRawImage.GetComponent<RawImage>().texture = this._screenshotController.ScreenshotRenderTexture;
            GameObject.Destroy(this._screenshotUIController.PreviewRawImage.GetComponent<VideoPlayer>());
        } else {
            this._screenshotController.PlayPreviewVideo(this._screenshotUIController.PreviewRawImage, 640, 360);
        }

        // 진행중 비활성화한 버튼 활성화하기
        this._screenshotUIController.AllowOnlyOneClick(true);

        // Hide character ui input controller
        // ZepetoPlayersCustomizer.Instance.HideInputController();
    }

    /** 사진찍기 버튼 클릭 시 동작 설정하는 함수 */
    private TakePhotoScreenshotButtonAction() {
        this._screenshotController.OnScreenshotDone.AddListener(() => {
            this._screenshotUIController.ShowEasyUploadToastWindow();
            this._isPhoto = true;
            this.ResultToastButtonSetting(this._screenshotUIController.EasyUploadToast);

            // QuestManager.Instance.CheckMrBoneInScreen();
            // AudioMgr.Ins.PlaySFX("sfx_0001", 1, 1);
        });
        this._screenshotController.StartTakePhotoScreenshot();
    }

    /** 비디오 레코딩 타이머 시작하는 함수 */
    private StartTimer() {
        this._coRecordingTimer = this.StartCoroutine(this.CoStartTimer());

        // 비디오 촬영 시작하면 사진찍기 버튼 비활성화
        this._screenshotUIController.TakePhotoScreenshotButton.interactable = false;

        // 비디오 촬영 끝날 때 까지 메뉴 Exit 불가능
        this._screenshotUIController.ExitButton.interactable = false;
        this._canEnterOrExit = false;
        this.StartCoroutine(this.ImageColorPingpong(this._screenshotUIController.VideoTimer.GetComponent<Image>()));
    }

    /** 비디오 레코딩 타이머 마무리하는 함수 */
    private StopTimer() {
        this.StopCoroutine(this._coRecordingTimer);
        this._screenshotUIController.VideoTimer.SetActive(false);

        // 촬영 프로그레스 도넛 숨기기
        this._screenshotUIController.RecordingProgressDoughnut.gameObject.SetActive(false);

        // 비디오 녹화 끝나면 메뉴 Exit할 수 있는 버튼 활성화
        this._screenshotUIController.ExitButton.interactable = true;
        this._canEnterOrExit = true;
    }

    /** 전달받은 이미지의 색상을 lerp하는 함수. 비디오 녹화 타이머 배경 설정) */
    private *ImageColorPingpong(image: Image) {
        while (image.gameObject.activeSelf) {
            image.color = Color.Lerp(new Color(1.000, 0.271, 0.235, 1.000), new Color(0.851, 0.243, 0.208, 1.000), Mathf.PingPong(Time.time, 1));
            yield null;
        }
    }

    /** 비디오 녹화 시작 후 경과 시간 보여주는 코루틴 함수 */
    private *CoStartTimer() {
        let elapsedTime = 0;
        this._screenshotUIController.VideoTimer.SetActive(true);
        this._screenshotUIController.RecordingProgressDoughnut.gameObject.SetActive(true);

        while (true) {
            elapsedTime += Time.deltaTime;
            let time = Math.floor(elapsedTime);
            let timetext = "";

            if (time < 60) {
                timetext = `00:${time >= 10 ? time : '0' + time}`;
            } else {
                timetext = `${time % 60 >= 10 ? time % 60 : '0' + time % 60}:${time / 60 >= 10 ? time / 60 : '0' + time / 60}`;
            }
            this._videoTimerText.text = timetext;
            yield null;
        }
    }

    /** 비디오 찍기 버튼 클릭 시 동작 설정하는 함수 */
    private TakeVideoScreenshotButtonAction() {
        this._isPhoto = false;

        // 녹화 시작 시 이벤트
        this._screenshotController.ResetOnVideoRecordingStartEvent();
        this._screenshotController.OnVideoRecordingStartEvent.AddListener(() => {
            this.StartTimer();
            this._screenshotUIController.RecordingProgressDoughnut.color = Color.white;
            this._screenshotUIController.RecordingProgressDoughnut.fillAmount = 0;
        });

        this._screenshotController.ResetOnDuringVideoRecordingEvent();
        let startTimer = Time.time;
        this._screenshotController.OnDuringVideoRecordingEvent.AddListener(() => {
            this._screenshotUIController.FillProgressDoughnut(startTimer, this._screenshotController.MaxDuration);
        });

        this._screenshotController.ResetOnVideoRecordingStopEvent();
        this._screenshotController.OnVideoRecordingStopEvent.AddListener(() => {
            this._screenshotController.StartTakePhotoScreenshot(true);
            this._screenshotUIController.ShowEasyUploadToastWindow();
            this.ResultToastButtonSetting(this._screenshotUIController.EasyUploadToast);
            this.StopTimer();

            // 비디오 촬영 종료 후 사진찍기 버튼 활성화
            this._screenshotUIController.TakePhotoScreenshotButton.interactable = true;
            // 비디오 촬영 종료 후 Exit 버튼 활성화
            this._screenshotUIController.ExitButton.interactable = true;
            //JH 사운드
            // AudioMgr.Ins.PlaySFX("sfx_0032", 0.5, 1);
        });
        this._screenshotController.RecordVideo();

        //JH 사운드
        // AudioMgr.Ins.PlaySFX("sfx_0031", 0.5, 1);
    }

    /** 저장/공유/업드르 관련 실패시 토스트창 띄우는 코루틴 함수 */
    private *CoResultToastWindow(timer: number) {
        let waitForSeconds = new WaitForSeconds(timer);
        yield waitForSeconds;

        if (this._screenshotController.EventResult == true) {
            return;
        }

        this.StartCoroutine(this.CoShowToastWindow(false));
    }

    /** 초기화 함수 */
    private InitialzeScreenshotManager() {
        this._canEnterOrExit = true;
        this._screenshotController = this.gameObject.GetComponent<ScreenshotController>();
        this._screenshotUIController = this.gameObject.GetComponent<ScreenshotUIController>();
        this._videoTimerText = this._screenshotUIController.VideoTimer.GetComponentInChildren<Text>();

        this._screenshotUIController.TakePhotoScreenshotButton.onClick.AddListener(() => {
            this.TakePhotoScreenshotButtonAction();
        });

        this._screenshotUIController.TakeVideoScreenshotButton.onClick.AddListener(() => {
            this.TakeVideoScreenshotButtonAction();
        });

        this._screenshotUIController.ExitButton.onClick.AddListener(() => {
            this.HideScreenshotUI();
        });

        this._screenshotUIController.PreviewExitButton.onClick.AddListener(() => {
            this._screenshotUIController.PreviewWindow.SetActive(false);
            this._screenshotUIController.PreviewInputField.text = this._screenshotUIController.OriginalFeedMsg;

            if (this._screenshotUIController.TextLimitToast) {
                this._screenshotUIController.TextLimitToast.GetComponent<ToastAnimator>().DestoryToastWindow(0);
                this._screenshotUIController.TextLimitToast = null;
            }

            // ZepetoPlayersCustomizer.Instance.ShowInputController();
        });

        this._screenshotUIController.PreviewInputField.onValueChanged.AddListener(() => {
            if (this._screenshotUIController.PreviewInputField.text.length == this._screenshotUIController.PreviewInputField.characterLimit) {
                this._screenshotUIController.ShowTextLimitToastWindow();
                this._screenshotUIController.TextLimitToast.GetComponent<Button>().onClick.AddListener(() => {
                    this._screenshotUIController.TextLimitToast.GetComponent<ToastAnimator>().HideToastWindow();
                    this._screenshotUIController.TextLimitToast = null;
                });
            } else {
                if (this._screenshotUIController.TextLimitToast) {
                    this._screenshotUIController.TextLimitToast.GetComponent<ToastAnimator>().HideToastWindow();
                    this._screenshotUIController.TextLimitToast = null;
                }
            }
        });

        this._screenshotUIController.PreviewUploadButton.onClick.AddListener(() => {
            this.OnClickUploadButton();
        });

        this._screenshotUIController.PreviewShareButton.onClick.AddListener(() => {
            this._screenshotController.ResetOnFailCheckEvent();
            this._screenshotController.OnFailCheckEvent.AddListener(() => {
                let timer = 0;
                if (this._isPhoto) {
                    timer = 3;
                } else {
                    timer = 9;
                }
                this.StartCoroutine(this.CoResultToastWindow(timer));
            });

            if (this._isPhoto) {
                this._screenshotController.PhotoShare();
            } else {
                this._screenshotController.VideoShare();
            }
        });

        this._screenshotUIController.PreviewSaveButton.onClick.AddListener(() => {
            this._screenshotController.ResetOnFailCheckEvent();
            this._screenshotController.OnFailCheckEvent.AddListener(() => {
                this.StartCoroutine(this.CoResultToastWindow(3));
            });

            if (this._isPhoto) {
                this._screenshotController.PhotoSave();
            } else {
                this._screenshotController.VideoSave();
            }
        });

        this.SetToastWindows();

        this._screenshotUIController.InitializeUserNameButtonEvent.AddListener(() => {
            this._screenshotUIController.UserNameOnButton.gameObject.SetActive(false);
            this._screenshotUIController.UserNameOffButton.gameObject.SetActive(true);
        })

        this._screenshotUIController.UserNameOffButton.onClick.AddListener(() => {
            this.ToggleUserNameDisplay(false);
            this._screenshotUIController.UserNameOnButton.gameObject.SetActive(true);
            this._screenshotUIController.UserNameOffButton.gameObject.SetActive(false);
        });

        this._screenshotUIController.UserNameOnButton.onClick.AddListener(() => {
            this.ToggleUserNameDisplay(true);
            this._screenshotUIController.UserNameOnButton.gameObject.SetActive(false);
            this._screenshotUIController.UserNameOffButton.gameObject.SetActive(true);
        });
    }

    public CreateFeedImmediately(callback: Function) {
        this._screenshotController.CreateFeedImmediately(callback);
    }

    private static _instance: ScreenshotManager;
    public static get Instance(): ScreenshotManager {
        return ScreenshotManager._instance;
    }

    Awake() {
        ScreenshotManager._instance = this;
        this.InitialzeScreenshotManager();
    }

    Start() {
        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this._screenshotController.SetScreenshotCamera(
                GameObject.FindGameObjectWithTag("MainCamera").GetComponent<Camera>()
            );
        });
    }
}