import { AnimationCurve, Coroutine, GameObject, Mathf, RectTransform, Time, Vector3, WaitForEndOfFrame, WaitForSeconds } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class ToastAnimator extends ZepetoScriptBehaviour {

    
    public originalYPos: number;
    public targetYPos: number;

    public showMotionDuration: number;
    public showMotionAnimCurve: AnimationCurve;

    public hideMotionDuration: number;
    public hideMotionAnimCurve: AnimationCurve;

    private _rectTransform: RectTransform;
    private _coroutine: Coroutine;
    private _currentYPos: number;

    /** 토스트창 내려줌 */
    ShowToastWindow() {
        // if(this._coroutine) {
        //     this.StopCoroutine(this._coroutine);
        //     this._coroutine = null;
        // }

        if (!this.gameObject.activeSelf) {
            this.gameObject.SetActive(true);
        }
        this.StartCoroutine(this.CoEnagleToastWindow());

        // } else {
        //     this.HideAndShowWindow();
        // }
    }

    *CoEnagleToastWindow() {
        this._rectTransform = this.gameObject.GetComponent<RectTransform>();
        let waitForEndofFrame = new WaitForEndOfFrame();
        let _timeElapsed = 0;
        let _currentPos = this._rectTransform.anchoredPosition3D;

        while (true) { 
            let _adjustedTime = this.showMotionAnimCurve.Evaluate(_timeElapsed/this.showMotionDuration);
            let _newYPos = Mathf.Lerp(this._rectTransform.anchoredPosition3D.y, this.targetYPos, _adjustedTime);
            this._rectTransform.anchoredPosition3D = new Vector3(_currentPos.x, _newYPos, _currentPos.z);
            _timeElapsed += Time.deltaTime;
            yield waitForEndofFrame;

            if(_timeElapsed > this.showMotionDuration)
                break;
        }

        this._rectTransform.anchoredPosition3D = new Vector3(_currentPos.x, this.targetYPos, _currentPos.z);
    }

    /** 토스트창이 이미 내려와 있을 때 다시 보여줘야 할 경우 사용. 반만 올라갔다가 다시 내려옴 */
    HideAndShowWindow() {
        // this.StartCoroutine(this.CoHideAndShowWindow());
    }

    // *CoHideAndShowWindow() {
    //     if (this._coroutine) {
    //         this.StopCoroutine(this._coroutine);
    //         this._coroutine = null;
    //     }

    //     let waitForEndofFrame = new WaitForEndOfFrame();

    //     while (this._rectTransform.anchoredPosition3D.y < this.originalYPos / 2) {
    //         let Ypos = this._rectTransform.anchoredPosition3D.y + Time.deltaTime * this.speed;
    //         this._rectTransform.anchoredPosition3D = new Vector3(this._rectTransform.anchoredPosition3D.x, Ypos, this._rectTransform.anchoredPosition3D.z);
    //         yield waitForEndofFrame;
    //     }

    //     while (this._rectTransform.anchoredPosition3D.y > this.targetYPos) {
    //         let Ypos = this._rectTransform.anchoredPosition3D.y - Time.deltaTime * this.speed;
    //         this._rectTransform.anchoredPosition3D = new Vector3(this._rectTransform.anchoredPosition3D.x, Ypos, this._rectTransform.anchoredPosition3D.z);
    //         yield waitForEndofFrame;
    //     }
    //     this._coroutine = null;
    // }

    /** 토스트창 올린 후 숨기기 */
    HideToastWindow() {
        if (this.gameObject.activeSelf) {
            this._coroutine = this.StartCoroutine(this.CoHideToastWindow());
        }

    }

    *CoHideToastWindow() {
        this._rectTransform = this.gameObject.GetComponent<RectTransform>();
        let waitForEndofFrame = new WaitForEndOfFrame();
        let _timeElapsed = 0;
        let _currentPos = this._rectTransform.anchoredPosition3D;

        while (true) { 
            let _adjustedTime = this.hideMotionAnimCurve.Evaluate(_timeElapsed/this.hideMotionDuration);
            let _newYPos = Mathf.Lerp(this._rectTransform.anchoredPosition3D.y, this.originalYPos, _adjustedTime);
            this._rectTransform.anchoredPosition3D = new Vector3(_currentPos.x, _newYPos, _currentPos.z);
            _timeElapsed += Time.deltaTime;
            yield waitForEndofFrame;

            if(_timeElapsed > this.hideMotionDuration)
                break;
        }

        this._rectTransform.anchoredPosition3D = new Vector3(_currentPos.x, this.originalYPos, _currentPos.z);
        this.gameObject.SetActive(false);
        GameObject.Destroy(this.gameObject);
        this._coroutine = null;
    }

    DestoryToastWindow(timer: number) {
        this.StartCoroutine(this.CoDestoryToastWindow(timer));
    }

    *CoDestoryToastWindow(timer: number) {
        let waitForSeconds = new WaitForSeconds(timer);
        yield waitForSeconds;
        GameObject.Destroy(this.gameObject);
    }
}