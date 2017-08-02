export function addDocument(payload: Sign.Actions.AddDocumentPayload): Sign.Actions.AddDocument {
    return {
        type: Sign.Actions.Types.ADD_DOCUMENT,
        payload
    };
}
export function requestDocument(documentId: string): Sign.Actions.RequestDocument {
    return {
        type: Sign.Actions.Types.REQUEST_DOCUMENT,
        payload: { documentId }
    }
}

export function downloadDocument(id: string) {
    return {
        type: Sign.Actions.Types.DOWNLOAD_DOCUMENT,
        payload: { id }
    }
}

export function updateDocument(payload: Sign.Actions.UpdateDocumentPayload): Sign.Actions.UpdateDocument {
    return {
        type: Sign.Actions.Types.UPDATE_DOCUMENT,
        payload
    };
}

export function submitDocuments(payload: string) {
    return {
        type: Sign.Actions.Types.SUBMIT_DOCUMENTS,
        payload
    };
}

export function removeDocument(documentId: string): Sign.Actions.RemoveDocument {
    return {
        type: Sign.Actions.Types.REMOVE_DOCUMENT,
        payload: { documentId }
    };
}

export function updateForm(payload: string) {
    return {
        type: Sign.Actions.Types.UPDATE_FORM,
        payload
    };
}

export function uploadSignature(payload: string) {
    return {
        type: Sign.Actions.Types.UPLOAD_SIGNATURE,
        payload
    };
}

export function selectSignature(id: number) {
    return {
        type: Sign.Actions.Types.SELECT_SIGNATURE,
        id
    };
}


export function showSignatureSelection() {
    return {
        type: Sign.Actions.Types.SHOW_SIGNATURE_SELECTION
    };
}

export function hideSignatureSelection() {
    return {
        type: Sign.Actions.Types.HIDE_SIGNATURE_SELECTION
    };
}

export function deleteSignature(id: number) {
    return {
        type: Sign.Actions.Types.DELETE_SIGNATURE,
        payload: id
    };
}

export function updateDocumentSet(payload: Sign.Actions.DocumentSetPayload): Sign.Actions.UpdateDocumentSet {
    return { type: Sign.Actions.Types.UPDATE_DOCUMENT_SET, payload };
}

export function createDocumentSet(payload: Sign.Actions.DocumentSetPayload): Sign.Actions.CreateDocumentSet {
    return { type: Sign.Actions.Types.CREATE_DOCUMENT_SET, payload };
}

export function requestDocumentSet(documentSetId: string): Sign.Actions.RequestDocumentSet {
    return { type: Sign.Actions.Types.REQUEST_DOCUMENT_SET, payload: { documentSetId } };
}

export function setUploadDocumentsDocumentSetId(documentSetId: string): Sign.Actions.SetUploadDocumentsDocumentSetId {
    return { type: Sign.Actions.Types.SET_UPLOAD_DOCUMENTS_DOCUMENT_SET_ID, payload: { documentSetId } };
}

export function generateUploadDocumentsDocumentSetId(): Sign.Actions.GenerateUploadDocumentsDocumentSetId {
    return { type: Sign.Actions.Types.GENERATE_UPLOAD_DOCUMENTS_DOCUMENT_SET_ID };
}