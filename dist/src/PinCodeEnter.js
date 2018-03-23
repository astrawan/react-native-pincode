"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_native_1 = require("react-native");
const PinCode_1 = require("./PinCode");
const react_native_touch_id_1 = require("react-native-touch-id");
const Keychain = require("react-native-keychain");
const index_1 = require("../index");
class PinCodeEnter extends React.PureComponent {
    constructor(props) {
        super(props);
        this.endProcess = async (pinCode) => {
            if (this.props.handleResult) {
                this.props.handleResult(pinCode);
                return;
            }
            this.setState({ pinCodeStatus: index_1.PinResultStatus.initial });
            this.props.changeInternalStatus(index_1.PinResultStatus.initial);
            const pinAttemptsStr = await react_native_1.AsyncStorage.getItem(this.props.pinAttemptsAsyncStorageName);
            let pinAttempts = +pinAttemptsStr;
            const pin = this.props.storedPin || this.keyChainResult.password;
            if (pin === pinCode) {
                this.setState({ pinCodeStatus: index_1.PinResultStatus.success });
                react_native_1.AsyncStorage.multiRemove([this.props.pinAttemptsAsyncStorageName, this.props.timePinLockedAsyncStorageName]);
                if (this.props.finishProcess)
                    this.props.finishProcess();
                this.props.changeInternalStatus(index_1.PinResultStatus.success);
            }
            else {
                pinAttempts++;
                if (+pinAttempts >= this.props.maxAttempts) {
                    await react_native_1.AsyncStorage.setItem(this.props.timePinLockedAsyncStorageName, new Date().toISOString());
                    this.setState({ locked: true, pinCodeStatus: index_1.PinResultStatus.locked });
                    this.props.changeInternalStatus(index_1.PinResultStatus.locked);
                }
                else {
                    await react_native_1.AsyncStorage.setItem(this.props.pinAttemptsAsyncStorageName, pinAttempts.toString());
                    this.setState({ pinCodeStatus: index_1.PinResultStatus.failure });
                    this.props.changeInternalStatus(index_1.PinResultStatus.failure);
                }
            }
        };
        this.state = { pinCodeStatus: index_1.PinResultStatus.initial, locked: false };
        this.endProcess = this.endProcess.bind(this);
        this.launchTouchID = this.launchTouchID.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        if (nextProps.pinStatusExternal !== this.props.pinStatusExternal) {
            this.setState({ pinCodeStatus: nextProps.pinStatusExternal });
        }
    }
    async componentWillMount() {
        this.keyChainResult = await Keychain.getGenericPassword();
    }
    componentDidMount() {
        react_native_touch_id_1.default.isSupported()
            .then(() => {
            setTimeout(() => {
                this.launchTouchID();
            });
        })
            .catch((error) => {
            console.warn('TouchID error', error);
        });
    }
    async launchTouchID() {
        try {
            await react_native_touch_id_1.default.authenticate(this.props.touchIDSentence);
            this.endProcess(this.props.storedPin || this.keyChainResult.password);
        }
        catch (e) {
            console.warn('TouchID error', e);
        }
    }
    render() {
        const pin = this.props.storedPin || (this.keyChainResult && this.keyChainResult.password);
        return (React.createElement(react_native_1.View, { style: styles.container },
            React.createElement(PinCode_1.default, { endProcess: this.endProcess, sentenceTitle: this.props.title, subtitle: this.props.subtitle, status: PinCode_1.PinStatus.enter, previousPin: pin, pinCodeStatus: this.state.pinCodeStatus, buttonNumberComponent: this.props.buttonNumberComponent || null, passwordLength: this.props.passwordLength || 4, passwordComponent: this.props.passwordComponent || null, titleAttemptFailed: this.props.titleAttemptFailed || 'Incorrect PIN Code', titleConfirmFailed: this.props.titleConfirmFailed || 'Your entries did not match', subtitleError: this.props.subtitleError || 'Please try again', colorPassword: this.props.colorPassword || undefined, numbersButtonOverlayColor: this.props.numbersButtonOverlayColor || undefined, buttonDeleteComponent: this.props.buttonDeleteComponent || null, titleComponent: this.props.titleComponent || null, subtitleComponent: this.props.subtitleComponent || null })));
    }
}
exports.default = PinCodeEnter;
let styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
