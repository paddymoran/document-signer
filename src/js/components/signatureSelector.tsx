import  * as React from "react";
import SignatureCanvas from 'react-signature-canvas';
import { Alert, Button, Modal, Tab, Tabs } from 'react-bootstrap';
import SignatureUpload from './signatureUpload';
import { uploadSignature, selectSignature, selectInitial, showSignatureSelection,  deleteSignature, addSignatureToDocument, requestSignatures, closeModal, showInitialSelectionModal } from '../actions/index';
import { connect } from 'react-redux';
import Loading from './loading';

interface SignatureSelectorProps {
    uploading: boolean;
    loadStatus: Sign.DownloadStatus;
    ids: number[];
    selectedId: number;
    title: string;
    closeModal: () => void;
    selectSignature: (id: number) => void;
    uploadSignature: (data: string) => void;
    deleteSignature: (signatureId: number) => void;
    addSignatureToDocument: (payload: Sign.Actions.AddSignatureToDocumentPayload) => void;
    requestSignatures: () => void;
}

interface SignatureSelectorState {
    currentTab: number;
    signatureUploaderErrors?: string
}

const SELECT_SIGNATURE_TAB = 1;
const DRAW_SIGNATURE_TAB = 2;
const UPLOAD_SIGNATURE_TAB = 3;



export class SignatureSelector extends React.Component<SignatureSelectorProps, SignatureSelectorState> {
    private signatureCanvas: SignatureCanvas;

    constructor(props: SignatureSelectorProps) {
        super(props);

        this.state = {
            currentTab: SELECT_SIGNATURE_TAB
        };
    }

    componentDidMount() {
        this.props.requestSignatures();
    }

    changeTab(newTab: number) {
        this.setState({ currentTab: newTab });
    }

    changeSelectedSignature(selectedSignatureId: number) {
        this.props.selectSignature(selectedSignatureId);
    }

    clearCanvas() {
        this.signatureCanvas.clear();
    }

    deleteSignature() {
        this.props.deleteSignature(this.props.selectedId);
        this.props.selectSignature(null);
    }

    select() {
        if (this.state.currentTab == UPLOAD_SIGNATURE_TAB) {
            const signature = this.signatureCanvas.toDataURL();
            if (signature === null) {
                this.setState({ signatureUploaderErrors: 'Please upload a file' });
            }
            else {
                this.props.uploadSignature(signature);
            }
        }
        else if (this.state.currentTab == DRAW_SIGNATURE_TAB) {
            const signature = this.signatureCanvas.getTrimmedCanvas().toDataURL();
            this.props.uploadSignature(signature);
        }

        this.props.closeModal();
    }

    render() {
        const signatureCanvasOptions = {
            width: 500,
            height: 200
        };
        return  (
            <Modal show={true} onHide={() => this.props.closeModal()}>
                <Modal.Header closeButton>
                    <Modal.Title>Select {this.props.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Tabs activeKey={this.state.currentTab} onSelect={this.changeTab.bind(this)} animation={false} id='select-signature-tabs'>
                        <Tab eventKey={SELECT_SIGNATURE_TAB} title="Select Signature" className="select-signature">
                            <div className="row">
                                {this.props.loadStatus === Sign.DownloadStatus.InProgress && <Loading />}

                                {this.props.loadStatus === Sign.DownloadStatus.Complete && this.props.ids.map((id: number, i: number) => {
                                        let classes = 'col-sm-6 selectable';
                                        classes += id === this.props.selectedId ? ' selected' : '';

                                        return (
                                            <div className={classes} key={i} onClick={() => this.changeSelectedSignature(id) }>
                                                <img className='img-responsive' src={`/api/signatures/${id}`} />
                                            </div>
                                        )
                                    })
                                }

                                {this.props.loadStatus === Sign.DownloadStatus.Complete && this.props.ids.length == 0 &&
                                    <div className="col-xs-12">
                                        <p>No saved signatures</p>
                                    </div>
                                }
                            </div>
                        </Tab>

                        <Tab eventKey={DRAW_SIGNATURE_TAB} title="Draw Signature">
                            <div className='signature-canvas-conatiner clearfix'>
                                { this.props.uploading && <Loading />}
                                { !this.props.uploading &&
                                    <div className='signature-display'>
                                        <SignatureCanvas canvasProps={signatureCanvasOptions} ref={(ref: SignatureCanvas) => this.signatureCanvas = ref} />
                                        <a className='btn btn-default btn-block' onClick={this.clearCanvas.bind(this)}>Clear</a>
                                    </div>
                                }
                            </div>
                        </Tab>

                        <Tab eventKey={UPLOAD_SIGNATURE_TAB} title="Upload Signature">
                            { this.state.signatureUploaderErrors &&
                                <Alert bsStyle='danger'>
                                    { this.state.signatureUploaderErrors }
                                </Alert>
                            }
                            {this.props.uploading && <Loading />}
                            {!this.props.uploading && <SignatureUpload ref='signature-uploader' />}
                        </Tab>
                    </Tabs>
                </Modal.Body>
                <Modal.Footer>
                    <Button bsStyle="warning" disabled={!this.props.selectedId} onClick={() => this.deleteSignature()}>Delete {this.props.title}</Button>
                    <Button onClick={() => this.props.closeModal()}>Close</Button>
                    <Button bsStyle='primary' onClick={this.select.bind(this)} >Select</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

class ModalButton extends React.Component<any> {
    render(){
        return (
            <div>
                <Button  onClick={() => this.props.showModal()}>
                    {this.props.text}
                </Button>
            </div>
        )
    }
}

export const SignatureButton = connect(
    (state) => ({
        text: 'Add Signature'
    }),
    {
        showModal: showSignatureSelection
    }
)(ModalButton);

export const InitialButton = connect(
    (state) => ({
        text: 'Add Initial'
    }),
    {
        showModal: showInitialSelectionModal
    }
)(ModalButton);

export const SignatureModal = connect(
    (state: Sign.State) => ({
        uploading: false,
        loadStatus: state.signatures.status,
        ids: state.signatures.signatureIds,
        selectedId: state.documentViewer.selectedSignatureId,
        title: 'Signature',
    }),
    {
        uploadSignature: (data: string) => uploadSignature({ data, type: Sign.SignatureType.SIGNATURE }),
        selectSignature,
        deleteSignature,
        addSignatureToDocument,
        requestSignatures,
        closeModal: () => closeModal({ modalName: 'selectSignature' })
    }
)(SignatureSelector);

export const InitialsModal = connect(
    (state: Sign.State) => ({
        uploading: false,
        loadStatus: state.signatures.status,
        ids: state.signatures.initialIds,
        selectedId: state.documentViewer.selectedInitialId,
        title: 'Initial',
    }),
    {
        uploadSignature: (data: string) => uploadSignature({ data, type: Sign.SignatureType.INITIAL }),
        selectSignature: (initialId: number) => selectInitial({ initialId }),
        deleteSignature,
        addSignatureToDocument,
        requestSignatures,
        closeModal: () => closeModal({ modalName: 'selectInitial' })
    }
)(SignatureSelector);
