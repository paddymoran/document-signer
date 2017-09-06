import * as React from 'react';
import { IndexRoute, Route } from 'react-router';
import App, { ContainerWithStatusBar } from '../components/app';
import DocumentView, { RequestedDocumentView}  from '../components/documentView';
import { DocumentSetView, UploadDocumentsWithDocumentSetId } from '../components/uploadDocuments';
import { CompletedDocumentSets, PendingDocumentSets, AllDocumentSets } from '../components/documentSets';
import RequestedSignatures from '../components/requestedSignatures';
import NotFound from '../components/notFound';
import Documents from '../components/documents';


export default () => {
    return (
        <Route path='/' component={App}>
            <Route path='documents/:documentSetId/:documentId' component={ DocumentView } />
            <Route path='sign/:documentSetId/:documentId' component={ RequestedDocumentView } />
            <Route component={ContainerWithStatusBar}>
                <IndexRoute component={UploadDocumentsWithDocumentSetId} />
                <Route component={Documents}>
                    <Route path='all' component={ AllDocumentSets } />
                    <Route path='to_sign' component={ RequestedSignatures } />
                    <Route path='pending' component={ PendingDocumentSets } />
                    <Route path='completed' component={ CompletedDocumentSets  } />
                </Route>
                <Route path='documents/:documentSetId' component={ DocumentSetView } />
                <Route path='*' component={ NotFound } />
            </Route>
        </Route>
    );
}
