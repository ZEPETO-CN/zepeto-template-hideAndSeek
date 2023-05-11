import { TextMeshPro } from 'TMPro';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization from './Localization';

export default class TextMeshProLocalizer extends ZepetoScriptBehaviour {

    public localizationKey: string;

    //TODO: Implement below
    // public isUsingLocalizationDefaultSettings: boolean;

    private _isInitialized: boolean = false;
    private _localization: Localization;

    Start() {
        this._localization = Localization.Instance;

        if (!this.localizationKey || this.localizationKey == "") {
            this._isInitialized = false;
            console.error("Text Localizer is not initialized. Enter localization key first.");
            return;
        } else {
            this._isInitialized = true;
        }

        //When UI text doesn't exist
        if (!this.gameObject.GetComponent<Text>()) {
            console.error("Text Localizer is not initialized. There's no UI Text.");
            return;
        }

        let _uiText = this.gameObject.GetComponent<TextMeshPro>();

        //Set Default Settings when in use
        //TODO: Implement below
        // if (this.isUsingLocalizationDefaultSettings) {
        //     _uiText.font = this._localization.CurrentFont;
        //     _uiText.supportRichText = false;
        // }

        //Set Localized Text
        _uiText.text = this._localization.GetLocalizedText(this.localizationKey);
    }

}