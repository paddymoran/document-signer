import * as React from 'react';
import { connect } from 'react-redux';
import { requestDocumentSets } from '../actions';
import * as moment from 'moment';
import { Link } from 'react-router';
import { Nav, NavItem } from 'react-bootstrap';
import { stringToDateTime } from '../utils';
import { SignStatus } from './requestedSignatures';

interface FileListProps {
    documents: Sign.DocumentData[],
}

interface DocumentSets {
    requestDocumentSets: () => void;
    documents: Sign.Documents,
    documentSets: Sign.DocumentSets
}

class FileList extends React.PureComponent<FileListProps> {

    render() {
        return <table className="table">
            <thead>
                <tr>
                    <th>Status</th>
                    <th>File Name</th>
                    <th>Created Date</th>
                </tr>
            </thead>
            <tbody>
                { this.props.documents.map((document : Sign.Document, i: number) => {
                    return <tr key={i}>
                        <td></td>
                        <td>{ document.filename}</td>
                        <td>{ moment(document.createdAt).format("Do MMM, h:mm:ss a") }</td>
                        </tr>
                }) }
            </tbody>
        </table>
    }

}


class UnconnectedCompletedDocumentSets extends React.PureComponent<DocumentSets>  {
    componentDidMount() {
        this.props.requestDocumentSets()
    }
    render() {

        const keys = Object.keys(this.props.documentSets).filter((setId: string) => {
            return this.props.documentSets[setId].documentIds.every(d => this.props.documents[d].signStatus === 'Signed')
        });

        return (
            <div>
                <div className="document-set-list">
                    { keys.map(documentSetId => <DocumentSetList key={documentSetId} documentSetId={documentSetId} />)}
                </div>
            </div>
        );
    }
}

interface DocumentSetListProps {
    documentSetId: string;
}

interface UnconnectedDocumentSetListProps extends DocumentSetListProps {
    documentSet: Sign.DocumentSet;
    documents: Sign.Documents;
}

class UnconnectedDocumentSetList extends React.PureComponent<UnconnectedDocumentSetListProps> {
    render() {
        const documentSetLabel = stringToDateTime(this.props.documentSet.createdAt);

        return (
            <div className="document-set">
                <div className="document-set-title">{documentSetLabel}</div>

                {this.props.documentSet.documentIds.map(documentId => {
                    const document = this.props.documents[documentId]

                    return (
                        <div key={documentId} className="document-line">
                            <SignStatus signStatus={document.signStatus}/>
                            <i className="fa fa-file-pdf-o" />{document.filename}
                        </div>
                    );
                })}
            </div>
        );
    }
}

const DocumentSetList = connect(
    (state: Sign.State, ownProps: DocumentSetListProps) => ({
        documents: state.documents,
        documentSet: state.documentSets[ownProps.documentSetId]
    })
)(UnconnectedDocumentSetList);

class UnconnectedPendingDocumentSets extends React.PureComponent<DocumentSets>  {
    componentDidMount() {
        this.props.requestDocumentSets()
    }
    render() {

        const keys = Object.keys(this.props.documentSets).filter((setId: string) => {
            return this.props.documentSets[setId].documentIds.some(d => this.props.documents[d].signStatus === 'Pending')
        });

        return (
            <div>
                <div className="document-set-list">
                    { keys.map(documentSetId => <DocumentSetList key={documentSetId} documentSetId={documentSetId} />)}
                </div>
            </div>
        );
    }
}


export const CompletedDocumentSets = connect((state: Sign.State) => ({
    documentSets: state.documentSets,
    documents: state.documents
}), {
    requestDocumentSets
})(UnconnectedCompletedDocumentSets);

export const PendingDocumentSets = connect((state: Sign.State) => ({
    documentSets: state.documentSets, //.filter(set => !set.status),
    documents: state.documents
}), {
    requestDocumentSets
})(UnconnectedPendingDocumentSets);

export class AllDocumentSets extends React.PureComponent<DocumentSets>  {
    render() {
        return (
            <div>
                <PendingDocumentSets />
                <CompletedDocumentSets />
            </div>
        );
    }
}
