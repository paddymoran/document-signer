import * as React from "react";
import { findDOMNode } from "react-dom";
import SignatureCanvas from 'react-signature-canvas'
import { Button, Modal, Tabs, Tab } from 'react-bootstrap';
import * as Promise from 'bluebird';
import * as axios from 'axios';

interface SignatureSelectorProps {
    isVisible: boolean;
    onSignatureSelected: Function;
    showModal: Function;
    hideModal: Function;
}

const SELECT_SIGNATURE_TAB = 1;
const DRAW_SIGNATURE_TAB = 2;

export default class SignatureSelector extends React.Component<SignatureSelectorProps, any> {
    constructor(props) {
        super(props);
        this.state = {
            selectedSignature: 0,
            currentTab: SELECT_SIGNATURE_TAB,
            signatureIds: []
        };
    }

    componentDidMount() {
        axios.get('/signatures') .then((response) => {
            let signatureIds = [];
            response.data.map((signature) => signatureIds.push(signature.id));

            this.setState({ signatureIds });
        });
    }

    changeTab(newTab) {
        this.setState({ currentTab: newTab });
    }

    changeSelectedSignature(key) {
        this.setState({ selectedSignature: key });
    }

    clearCanvas() {
        const signatureCanvas = this.refs['signature-canvas'];
        signatureCanvas.clear();
    }

    select() {
        let signatureId = -1;

        // If the user selected an existing signature, trigger the parents signatureSelected method with the signature ID
        if (this.state.currentTab == SELECT_SIGNATURE_TAB) {
            signatureId = this.state.signatureIds[this.state.selectedSignature];
            this.props.onSignatureSelected(signatureId);
        } else {
            // Get the signature image as a Data URL
            const signature = this.refs['signature-canvas'].getTrimmedCanvas().toDataURL();
            
            // Upload image and trigger the parents signatureSelected method with the signature ID
            axios.post('/signatures/upload', {
                base64Image: signature
            }).then((response) => {
                signatureId = response.data.signature_id;
                this.props.onSignatureSelected(signatureId);
            });
        }
    }

    render() {
        const signatureCanvasOptions = {
            width: 500,
            height: 200,
            className: 'signature-drawer'
        };

        return (
            <div>
                <Button bsStyle='primary' onClick={() => this.props.showModal()}>
                    Add Signature
                </Button>

                <Modal show={this.props.isVisible} onHide={() => this.props.hideModal()}>
                    <Modal.Header closeButton>
                        <Modal.Title>Select Signature</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Tabs activeKey={this.state.currentTab} onSelect={this.changeTab.bind(this)} animation={false} id='select-signature-tabs'>
                            <Tab eventKey={SELECT_SIGNATURE_TAB} title="Select Signature" className="select-signature">
                                <div className="row">
                                    {this.state.signatureIds.map((id, i) => {
                                            let classes = 'col-sm-6 selectable';
                                            classes += i == this.state.selectedSignature ? ' selected' : '';

                                            return (
                                                <div className={classes} key={i} onClick={() => this.changeSelectedSignature(i) }>
                                                    <img className='img-responsive' src={`/signatures/${id}`} />
                                                </div>
                                            )
                                        })
                                    }

                                    { this.state.signatureIds.length == 0 &&
                                        <div className="col-xs-12">
                                            <p>No saved signatures</p>
                                        </div>
                                    }
                                </div>
                            </Tab>

                            <Tab eventKey={DRAW_SIGNATURE_TAB} title="Draw Signature">
                                <div className='signature-canvas-conatiner clearfix'>
                                    <SignatureCanvas canvasProps={signatureCanvasOptions} ref='signature-canvas' />
                                    <a className='pull-right' onClick={this.clearCanvas.bind(this)}>Clear</a>
                                </div>
                            </Tab>
                        </Tabs>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button onClick={() => this.props.hideModal()}>Close</Button>
                        <Button bsStyle='primary' onClick={this.select.bind(this)} >Select</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
}