import * as React from 'react';
import { IndexRoute, Route } from 'react-router';
import App from '../components/app';
import SelectWorkflow from '../components/selectWorkflow';
import DocumentView from '../components/documentView';
import UploadDocuments, { DocumentSetView } from '../components/uploadDocuments';

export default () => {
    return (
        <Route path='/' component={App}>
            <IndexRoute component={SelectWorkflow} />

            <Route path='selfsign/:documentSetId' component={UploadDocuments} />
            <Route path='documents/:documentSetId' component={DocumentSetView} />
            <Route path='documents/:documentSetId/:documentId' component={DocumentView} />
        </Route>
    );
}
