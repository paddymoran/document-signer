import * as React from 'react';
import { findDOMNode } from "react-dom";
import { DragSource } from 'react-dnd';
import ReactRnd from 'react-rnd';
import { moveSignature, removeSignatureFromDocument } from '../actions';
import { connect } from 'react-redux';

interface ConnectedSignatureProps {
    signatureIndex: string;
}

interface SignatureProps extends ConnectedSignatureProps {
    moveSignature: (payload: Sign.Actions.MoveSignaturePayload) => void;
    signature: Sign.DocumentSignature;
    removeSignatureFromDocument: (payload: Sign.Actions.RemoveSignatureFromDocumentPayload) => void;
}

interface SignatureState {
    yOffset: number;
}

const style = {
    border: '1px dashed black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const handleStyles = {
    bottomRight: {
        background: 'black',
        position: 'absolute',
        width: '20px',
        height: '20px',
        right: '-10px',
        bottom: '-10px',
        cursor: 'nw-resize',
    }
};

class Signature extends React.PureComponent<SignatureProps, SignatureState> {
    private signature: ReactRnd;

    constructor(props: SignatureProps) {
        super(props);

        this.state = {
            yOffset: (props.signature.height / 2) + 1
        };
        
        this.onMove = this.onMove.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    onMove(event: ReactRnd.DraggableData, resizeData: ReactRnd.ResizeData) {
        this.props.moveSignature({
            signatureIndex: this.props.signatureIndex,
            x: resizeData.x,
            y: resizeData.y - this.state.yOffset
        });
    }

    onResize(event: any, resizeHandle: string, element: any) {
        const signature: ReactRnd = this.signature;

        this.props.moveSignature({
            signatureIndex: this.props.signatureIndex,
            width: element.clientWidth,
            height: element.clientHeight
        });
    }

    render() {
        const { signature } = this.props;
        const defaults = {
            x: 0,
            y: (signature.height / 2) + 1,
            width: signature.width,
            height: signature.height
        };

        const stylesWithbackground = {
            ...style,
            background: `url("/api/signatures/${this.props.signature.signatureId}"`,
            backgroundSize: '100% 100%',
        };

        return (
            <ReactRnd
                ref={(ref: ReactRnd) => this.signature = ref as ReactRnd}
                default={defaults}
                style={stylesWithbackground}
                onDragStop={this.onMove}
                bounds=".pdf-page"
                resizeHandlerStyles={handleStyles}
                onResizeStop={this.onResize}
            ><button onClick={() => this.props.removeSignatureFromDocument({ signatureIndex: this.props.signatureIndex })}>x</button></ReactRnd>
        );
    }
}

export default connect(
    (state: Sign.State, ownProps: ConnectedSignatureProps) => ({ signature: state.documentViewer.signatures[ownProps.signatureIndex] }),
    { moveSignature, removeSignatureFromDocument }
)(Signature);