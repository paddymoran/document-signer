import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { closeModal, setActiveSignControl, saveDocumentView } from '../../actions';
import { connect } from 'react-redux';

interface ActivateControlModalProps {

}

interface UnconnectedActivateControlModalProps extends ActivateControlModalProps {
    closeModal: () => void;
    saveDraft: () => void;
    setActiveSignControl: (payload: Sign.Actions.SetActiveSignControlPayload) => void;
}

class UnconnectedActivateControlModal extends React.PureComponent<UnconnectedActivateControlModalProps> {

    constructor(props: UnconnectedActivateControlModalProps){
        super(props);

        this.activateControl = this.activateControl.bind(this);
        this.activateSignature = this.activateSignature.bind(this);
        this.activateInitial = this.activateInitial.bind(this);
        this.activateDate = this.activateDate.bind(this);
        this.activateText = this.activateText.bind(this);
        this.activatePrompt = this.activatePrompt.bind(this);
    }

    activateControl(activeSignControl: Sign.SignControl) {
        this.props.setActiveSignControl({ activeSignControl });
        this.props.closeModal();
    }

    activateSignature() {
        this.activateControl(Sign.SignControl.SIGNATURE);
    }

    activateInitial() {
        this.activateControl(Sign.SignControl.INITIAL);
    }

    activateDate() {
        this.activateControl(Sign.SignControl.DATE);
    }

    activateText() {
        this.activateControl(Sign.SignControl.TEXT);
    }

    activatePrompt() {
        this.activateControl(Sign.SignControl.PROMPT);
    }

    saveDraft() {
        this.props.saveDraft();
        this.props.closeModal();
    }

    render() {
        return (
            <Modal backdrop="static" show={true} onHide={this.props.closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Select Signing Control</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Button block bsSize="lg" onClick={this.activateSignature}>Signature</Button>
                    <Button block bsSize="lg" onClick={this.activateInitial}>Initial</Button>
                    <Button block bsSize="lg" onClick={this.activateDate}>Date</Button>
                    <Button block bsSize="lg" onClick={this.activateText}>Text</Button>
                    <Button block bsSize="lg" onClick={this.activatePrompt}>Request Signature</Button>
                    <Button block bsSize="lg" onClick={this.activateDate}>Save Draft</Button>
                    <Button block bsSize="lg" onClick={this.activateDate}>Invite</Button>
                </Modal.Body>
            </Modal>
        );
    }
}

export default connect(
    (state: Sign.State) => ({

    }),
    {
        closeModal: () => closeModal({ modalName: Sign.ModalType.ACTIVATE_CONTROL }),
        setActiveSignControl,
        saveDraft: saveDocumentView
    }
)(UnconnectedActivateControlModal);