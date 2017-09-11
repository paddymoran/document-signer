import { all, takeEvery, put, call, select, take } from 'redux-saga/effects';
import axios from 'axios';
import { setSignRequestStatus, showResults, closeModal, showFailureModal, setSaveStatus, resetDocuments, requestDocument } from '../actions';
import { push } from 'react-router-redux';
import { findSetForDocument, stringToCanvas, getNextDocument } from '../utils';

function *signDocumentWithRedirect(action: Sign.Actions.SignDocument){
    const success = yield signDocument(action);
    if (success) {
        yield put(push(`/documents/${action.payload.documentSetId}`));
    }
}

function *signDocument(action: Sign.Actions.SignDocument) {
    const status = yield select((state: Sign.State) => state.documentViewer.signRequestStatus);
    if(status === Sign.DownloadStatus.InProgress){
        return;
    }
    yield put(setSignRequestStatus(Sign.DownloadStatus.InProgress));

    const { documentViewer, reject, rejectedMessage, signRequestId } = yield select((state: Sign.State) => ({
        documentViewer: state.documentViewer,
        reject: state.documentViewer.documents[action.payload.documentId].signStatus === Sign.SignStatus.REJECTED,
        rejectedMessage: state.documentViewer.documents[action.payload.documentId].rejectReason,
        signRequestId: state.requestedSignatures.documentSets &&
            state.requestedSignatures.documentSets[action.payload.documentSetId] &&
            state.requestedSignatures.documentSets[action.payload.documentSetId][action.payload.documentId] &&
            state.requestedSignatures.documentSets[action.payload.documentSetId][action.payload.documentId].signRequestId
    }));

    const signatures = Object.keys(documentViewer.signatures).map(key => documentViewer.signatures[key]).filter(signature => signature.documentId === action.payload.documentId);
    const dates = Object.keys(documentViewer.dates).map(key => documentViewer.dates[key]).filter(date => date.documentId === action.payload.documentId);
    const texts = Object.keys(documentViewer.texts).map(key => documentViewer.texts[key]).filter(text => text.documentId === action.payload.documentId);
    const scaleFactor = 4;

    const overlays = [...dates, ...texts].map(o => {
        const canvas = stringToCanvas(o.height * scaleFactor, o.value, Sign.DefaultSignatureSize.MIN_WIDTH * scaleFactor);
        const dataUrl = canvas.toDataURL();
        return {...o, dataUrl}
    });

    const postPayload = {
        ...action.payload,
        signatures,
        overlays,
        reject,
        rejectedMessage,
        signRequestId
    };

    try {
        const response = yield call(axios.post, '/api/sign', postPayload);

        yield put(setSignRequestStatus(Sign.DownloadStatus.Complete));
        return true;
    }
    catch (e) {
        yield put(setSignRequestStatus(Sign.DownloadStatus.Failed));
        throw e;
    }
}


function hasSomethingToSign(documentViewer : Sign.DocumentViewer, documentId : string) {
    const signatures = Object.keys(documentViewer.signatures).map(key => documentViewer.signatures[key]).filter(signature => signature.documentId === documentId);
    const dates = Object.keys(documentViewer.dates).map(key => documentViewer.dates[key]).filter(date => date.documentId === documentId);
    const texts = Object.keys(documentViewer.texts).map(key => documentViewer.texts[key]).filter(text => text.documentId === documentId);
    const rejected = documentViewer.documents[documentId].signStatus === Sign.SignStatus.REJECTED;
    return signatures.length || dates.length || texts.length || rejected;
}

function *submitDocumentSet() {
    yield takeEvery(Sign.Actions.Types.SUBMIT_DOCUMENT_SET, submit);

    function *submit(action: Sign.Actions.SubmitDocumentSet) {
        const documentViewer = yield select((state: Sign.State) => state.documentViewer);
        const documentSets = yield select((state: Sign.State) => state.documentSets);
        const documentIds = documentSets[action.payload.documentSetId].documentIds;
        try{
            for(let documentId of documentIds){
                if(hasSomethingToSign(documentViewer, documentId)){
                    yield signDocument({type: Sign.Actions.Types.SIGN_DOCUMENT, payload: {documentSetId: action.payload.documentSetId, documentId}} as Sign.Actions.SignDocument);
                }
            }
            const status = yield select((state: Sign.State) => state.documentViewer.signRequestStatus);
            if(status === Sign.DownloadStatus.InProgress){
                return;
            }
        }catch (e) {
            yield  put(closeModal({ modalName: Sign.ModalType.SIGN_CONFIRMATION }));
            if(e.response && e.response.data && e.response.data.type === 'OLD_VERSION'){
                yield put(showFailureModal({message: 'Sorry, this version of the document has already been signed.'}));
                yield all([
                          put(resetDocuments()),
                          put(push(`/documents/${action.payload.documentSetId}`))
                          ]);
            }
            else{
                yield put(showFailureModal({message: 'Sorry, we could not sign at this time.'}));
            }
            return;
        }
        try {
            if(action.payload.signatureRequests.length){
                yield put(setSignRequestStatus(Sign.DownloadStatus.InProgress));
                const response = yield call(axios.post, '/api/request_signatures', action.payload);
            }

            yield all([
                put(setSignRequestStatus(Sign.DownloadStatus.Complete)),
                put(closeModal({ modalName: Sign.ModalType.SIGN_CONFIRMATION })),
                put(push(`/documents/${action.payload.documentSetId}`)),
            ]);
            yield put(resetDocuments());
        }
        catch (e) {
            yield all([
                put(closeModal({ modalName: Sign.ModalType.SIGN_CONFIRMATION })),
                put(showFailureModal({message: 'Sorry, we could not send invitations at this time.'})),
                put(setSignRequestStatus(Sign.DownloadStatus.Failed))
            ]);
        }
    }
}

function *saveDocumentViewSaga() {
    yield takeEvery(Sign.Actions.Types.SAVE_DOCUMENT_VIEW, saveDocumentView);

    function *saveDocumentView(action: Sign.Actions.SaveDocumentView) {
        const recipients = yield select((state: Sign.State) => state.documentSets[action.payload.documentSetId].recipients);
        const documentView = yield select((state: Sign.State) => state.documentViewer);
        const remove = (obj: any) => {
            Object.keys(obj).map(k => {
                if(obj[k].documentId !== action.payload.documentId){
                    delete obj[k];
                }
            })
            return obj;
        }
        const signatures = remove({...documentView.signatures});
        const prompts = remove({...documentView.prompts})
        const texts = remove({...documentView.texts})
        const dates = remove({...documentView.dates})
        yield put(setSaveStatus({status: Sign.DownloadStatus.InProgress, documentId: action.payload.documentId}));
        const view = {
            signatures, prompts, texts, dates
        }
        try{
            const response = yield call(axios.post, `/api/save_view/${action.payload.documentId}`, {recipients, view});
            yield put(setSaveStatus({status: Sign.DownloadStatus.Complete, documentId: action.payload.documentId}));
        }
        catch(e) {
            yield put(setSaveStatus({status: Sign.DownloadStatus.Failed, documentId: action.payload.documentId}));
        }

    }
}

export function* preloader() {
  let downloaded;
  let viewing : Sign.Actions.ViewDocumentPayload;
  while (true) {
    const result = yield take([Sign.Actions.Types.FINISH_ADD_PDF_TO_STORE , Sign.Actions.Types.VIEW_DOCUMENT])
    switch (result.type) {
      case Sign.Actions.Types.FINISH_ADD_PDF_TO_STORE: downloaded = result.payload; break;
      case Sign.Actions.Types.VIEW_DOCUMENT: viewing = result.payload; break;
    }
    if(downloaded && viewing && downloaded.id === viewing.documentId){
        const data = yield select((state: Sign.State) => ({
            documentSet: state.documentSets[viewing.documentSetId],
            documents: state.documentViewer.documents
        }));
        const nextDocumentId = getNextDocument(data.documentSet.documentIds, data.documents, viewing.documentId);
        if(nextDocumentId){
            yield put(requestDocument(nextDocumentId))
        }

    }
  }
}

export default [submitDocumentSet(), saveDocumentViewSaga(), preloader()];