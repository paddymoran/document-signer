import * as React from "react";
import { findDOMNode } from "react-dom";
import { connect } from 'react-redux';
import Loading from '../loading';
import { requestDocument } from '../../actions/index';
import { requestDocumentPage } from '../../actions/pdfStore';




interface PDFPageConnectProps {
    drawWidth: number;
    scale?: number;
    documentId: string;
    pageNumber: number;
    showLoading?: boolean;
}

interface PDFPageProps extends PDFPageConnectProps {
    page: PDFPageProxy;
    requestDocument: Function;
    requestDocumentPage: Function;
    documentExists: boolean;
}


export class PDFPage extends React.PureComponent<PDFPageProps>  {
    // count forces react to use a new canvas on rerender, preventing a broken output.
    // avoid unnecessary renders of this component
    private _count : number;

    constructor(props: PDFPageProps) {
        super(props);
        this._count = 0;
    }

    requestParts() {
        if(!this.props.documentExists){
            this.props.requestDocument(this.props.documentId);
        }
        else if(!this.props.page){
            this.props.requestDocumentPage({id: this.props.documentId, index: this.props.pageNumber});
        }
    }

    componentWillMount() {
        this.requestParts();
    }

    componentDidUpdate(prevProps: PDFPageProps) {
        if (this.props.page) {
            this.displayPage();
        }
        this.requestParts();
    }

    displayPage() {

    }

    render() {
        if (!this.props.page) {
            if(!this.props.showLoading){
                return false;
            }
            return <Loading />;
        }

        return <span>
            <div ref="loading" className="loading-container"><Loading /></div>
            <canvas style={{display: 'none'}} key={this._count++}  ref={(ref) => {
                  if (!ref) return;
                    const canvas : HTMLCanvasElement = ref as HTMLCanvasElement;
                    const context = canvas.getContext('2d', { alpha: false, });
                    const scale = this.props.scale || 1;
                    const viewport = this.props.page.getViewport(this.props.drawWidth / this.props.page.getViewport(scale).width);
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    this.props.page.render({ canvasContext: context, viewport })
                    .then(() => {
                        (findDOMNode(this.refs.loading) as HTMLElement).style.display = 'none';
                        canvas.style.display= 'block';
                    });
        }}/>
        </span>;
    }
}

export default connect(
    (state: Sign.State, ownProps: PDFPageConnectProps) => ({
        page: state.pdfStore[ownProps.documentId] ? state.pdfStore[ownProps.documentId].pages[ownProps.pageNumber] : null,
        documentExists: !!state.documents[ownProps.documentId]
    }),
    {
        requestDocument , requestDocumentPage
    }
)(PDFPage);