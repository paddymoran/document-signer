import * as React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { connect } from 'react-redux';
import { signDocument, closeModal } from '../../actions';

interface SignConfirmationProps {
    signRequestStatus: Sign.DownloadStatus;
    documentId: string;
    documentSetId: string;
    signRequestId: number;
    hideModal: () => void;
    signDocument: (payload: Sign.Actions.SignDocumentPayload) => void;
}

class SignConfirmation extends React.PureComponent<SignConfirmationProps> {
    constructor(props: SignConfirmationProps) {
        super(props);
        this.sign = this.sign.bind(this);
    }

    sign() {
        this.props.signDocument({ documentId: this.props.documentId, documentSetId: this.props.documentSetId, signRequestId: this.props.signRequestId });
    }

    renderLoading() {
        return (
            <div>
                <div className='loading' />
                <p>Signing document, please wait.</p>
            </div>
        );
    }

    renderBody() {
        return (
            <div>
                <i className="fa fa-pencil modal-icon" aria-hidden="true"></i>

                <p className='text-center'>Are you sure you want to sign this document?</p>

                <Button bsStyle='primary' bsSize="lg" onClick={this.sign}>Sign</Button>
            </div>
        );
    }

    render() {
        return (
            <Modal show={true} onHide={this.props.hideModal} className="icon-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Sign Confirmation</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {this.props.signRequestStatus === Sign.DownloadStatus.InProgress ? this.renderLoading() : this.renderBody()}
                </Modal.Body>
            </Modal>
        );
    }
}

export default connect(
    (state: Sign.State) => ({
        signRequestStatus: state.documentViewer.signRequestStatus,
        documentId: state.modals.documentId,
        documentSetId: state.modals.documentSetId,
        signRequestId: state.modals.signRequestId
    }),
    { signDocument, hideModal: () => closeModal({modalName: Sign.ModalType.SIGN_CONFIRMATION})  },
)(SignConfirmation);