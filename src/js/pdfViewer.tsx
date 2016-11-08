import * as React from 'react';
import { findDOMNode } from 'react-dom';
import * as Promise from 'bluebird';
import { Button } from 'react-bootstrap';
import { PDFPreview } from './pdfPreview.tsx';
import { PDFPage } from './pdfPage.tsx';
import SignatureSelector from './signatureSelector.tsx';
import SignatureDragContainer from './signatureDragContainer.tsx';
import * as axios from 'axios';
const PDFJS = require('pdfjs-dist');

Promise.config({
    cancellation: true
});

interface PDFViewerProps {
    data: ArrayBuffer;
    filename: string;
    file: Any;
    worker?: boolean;
    url?: string;
    removeDocument: Function;
}

export class PDFViewer extends React.Component<PDFViewerProps, any> {
    _pdfPromise;
    _pagePromises;

    constructor(props) {
        super(props);
        this._pdfPromise = null;
        this._pagePromises = null;
        this.state = {
            pageNumber: 1,
            show: false,
            pdfActualHeight: 0,
            pdfActualHeight: 0
        };
        this.completeDocument = this.completeDocument.bind(this);
    }

    componentDidMount() {
        if (this.props.worker === false) {
            PDFJS.disableWorker = true;
        }
        this.loadDocument(this.props);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.data && newProps.data !== this.props.data) {
            this.loadDocument(newProps);
        }
    }

    loadDocument(newProps) {
        if (newProps.data || newProps.url) {
            this.cleanup();
            this._pdfPromise = Promise.resolve(PDFJS.getDocument(newProps.data ? { data: newProps.data } : newProps.url))
                .then(this.completeDocument)
                .catch(PDFJS.MissingPDFException, () => this.setState({error: "Can't find PDF"}))
                .catch((e) => this.setState({error: e.message}))
        }
    }

    completeDocument(pdf) {
        this.setState({ pdf: pdf, error: null });
        this._pagePromises && this._pagePromises.isPending() && this._pagePromises.cancel();

        return this._pagePromises = Promise.map(Array(this.state.pdf.numPages).fill(), (p, i) => {
            return pdf.getPage(i + 1);
        })
        .then((pages) => {
            this.setState({ pages: pages });
            return pages;
        });
    }

    componentWillUnmount() {
        this.cleanup();
    }

    cleanup() {
        this._pdfPromise && this._pdfPromise.isPending() && this._pdfPromise.cancel();
        this._pagePromises && this._pagePromises.isPending() && this._pagePromises.cancel();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.pageNumber != prevProps.pageNumber) {
            this.loadPage(this.props.pageNumber);
        }
    }

    changePage(newPageNumber) {
        if (newPageNumber != this.state.pageNumber) {
            this.setState({ pageNumber: newPageNumber });
        }
    }

    showModal() {
        this.setState({show: true});
    }

    hideModal() {
        this.setState({show: false});
    }

    signatureSelected(signatureId) {
        this.setState({
            signatureId: signatureId,
            show: false
        });
    }

     save() {
        const signatureContainer = this.refs['signature-container'];
        const position = signatureContainer.relativeSignaturePosition();

        let data = new FormData();
        data.append('file', this.props.file.file);
        data.append('signature_id', this.state.signatureId);
        data.append('page_number', this.state.pageNumber);
        data.append('x_offset', position.x);
        data.append('y_offset', position.y);
        data.append('width_ratio', position.width);
        data.append('height_ratio', position.height);

        axios.post('/sign', data).then((response) => {
            const signedPDFLink = 'http://localhost:5669/signed-documents/' + response.data.file_id + '?filename=test.pdf';
            window.open(signedPDFLink, '_blank');
        });
    }

    render() {
        if (this.state.error) {
            return <div>{ this.state.error }</div>
        }

        if (!this.state.pdf || !this.state.pages) {
            return <div>Loading...</div>
        }

        const page = this.state.pages[this.state.pageNumber - 1];

        return (
            <div className='pdf-viewer'>
                <PDFPreview
                    pages={this.state.pages}
                    changePage={this.changePage.bind(this)}
                    activePageNumber={this.state.pageNumber}
                    width={120} />

                <div className='pdf-container'>

                    <div className='pdf-title'>{this.props.file.filename}</div>
                    <div className='pdf-page-number'>Page {this.state.pageNumber} of {this.state.pdf.numPages}</div>

                    <div className="button-row">
                        <Button bsStyle='info' onClick={() => this.props.removeDocument()}>
                            Close Document
                        </Button>

                        <SignatureSelector
                            isVisible={this.state.show}
                            showModal={this.showModal.bind(this)}
                            hideModal={this.hideModal.bind(this)}
                            onSignatureSelected={this.signatureSelected.bind(this)} />

                        <Button onClick={this.save.bind(this)}>Sign Document</Button>
                    </div>

                    <SignatureDragContainer
                        signatureId={this.state.signatureId}
                        className='pdf-page-wrapper'
                        ref='signature-container'
                    >
                        <PDFPage
                            page={page}
                            drawWidth={1000} />
                    </SignatureDragContainer>
                </div>
            </div>
        );
    }
}