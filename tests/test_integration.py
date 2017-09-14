from tests import DBTestCase
import server
from io import BytesIO
from uuid import uuid4
from flask import session
from db import (
    upsert_user
)
import os
import json
from io import BytesIO

USER_ID = 1

SIGNATURE_USER_ID = 2
SIGNATURE_STEALER_ID = 3

class Integration(DBTestCase):

    def setUp(self):
        server.app.testing = True
        self.app = server.app.test_client()
        with server.app.app_context():
            upsert_user({
                        'user_id': USER_ID,
                        'name': 'testuser',
                        'email': 'testuser@email.com',
                        'subscribed': True
                        })
            upsert_user({
                        'user_id': SIGNATURE_USER_ID,
                        'name': 'siggy',
                        'email': 'siggy@email.com',
                        'subscribed': True
                        })
            upsert_user({
                        'user_id': SIGNATURE_STEALER_ID,
                        'name': 'siggy stealer',
                        'email': 'siggystealer@email.com',
                        'subscribed': True
                        })



    def login(self, user_id):
         with self.app.session_transaction() as sess:
            # Modify the session in this context block.
            sess["user_id"] = user_id

    def test_0001_protected_routes(self):
        index = self.app.get('/')
        # root does redirect
        self.assertEqual(index.status_code, 302)

        verify = self.app.get('/verify')
        # verify is publically accessible
        self.assertEqual(verify.status_code, 200)

        # try uploading
        upload = self.app.post('/api/documents')
        self.assertEqual(upload.status_code, 401)

        self.login(USER_ID)

        # now logged in
        index = self.app.get('/')
        self.assertEqual(index.status_code, 200)

        self.app.get('/logout')
        index = self.app.get('/')
        # root does redirect
        self.assertEqual(index.status_code, 302)


    def test_0002_upload_document_set(self):

        def doc_count():
            response = self.app.get('/api/documents')
            data = json.loads(response.get_data(as_text=True))
            print(data)

            if not data:
                return 0

            return len(data[0]['documents'])

        def upload_doc(doc_id, set_id, file):
            data = { 'file[]': file, 'document_id': doc_id, 'document_set_id': set_id }
            self.app.post('/api/documents', data=data, content_type='multipart/form-data')

        with self.app.session_transaction() as sess:
            # Modify the session in this context block.
            sess["user_id"] = USER_ID

        document_set_id = str(uuid4())
        document_ids = [str(uuid4()), str(uuid4()), str(uuid4()), str(uuid4())]

        files = [
            (BytesIO(b'one'), 'file_one.pdf'),
            (BytesIO(b'two'), 'file_two.pdf'),
            (BytesIO(b'three'), 'file_three.pdf')
        ]

        # Upload a document
        upload_doc(document_ids[0], document_set_id, files[0])
        self.assertEqual(doc_count(), 1) # Check it was uploaded

        # Remove that document
        self.app.delete('/api/document/%s' % document_ids[0])
        self.assertEqual(doc_count(), 0) # Check it was deleted

        # Upload two more docs
        upload_doc(document_ids[1], document_set_id, files[1])
        upload_doc(document_ids[2], document_set_id, files[2])

        # Check both were uploaded
        self.assertEqual(doc_count(), 2)



    def test_0003_sign_and_verify_document(self):
        # upload document
        # sign it with overlay (read a fixture file, base64 encoded)
        # get result
        # verify document
        # delete document
        # confirm document set gone
        # verify document again
        pass

    def test_0004_invite_others(self):
        # upload document
        # invite two others to sign it
        # check pending status
        # log in as another
        # check signature_requests
        # sign document
        # check signature_requests
        # log in as third
        # check signature_requests
        # reject it
        # check signature_requests
        # log in as first
        # check complete status
        # check contacts
        pass

    def test_0005_self_sign_invite_other(self):
        # like above, but with self sign step
        # invite one other, check statuses
        pass

    def test_0006_usage_limits(self):
        # new user, unsubscribed
        # self sign 1 document
        # invite others two a sign another x documents (where x is config.MAX_SIGNS - 1)
        # confirm they can't upload anymore
        # delete sets
        # confirm they still can't upload anymore
        # set them to subscribed
        # confirm they can upload more
        pass

    def test_0007_signature_access(self):
        # new user creates signature
        # new user deletes it
        # new user creates signature
        # gets full list of signatures
        # tests can sign with signature
        # log in as another user
        # confirm cannot request that signature
        # confirm cannot sign with that signature
        # confirm cannot delete that signature
        self.login(SIGNATURE_USER_ID)



    def test_0008_revoke_requests(self):
        # revoke some requests or sometthing
        pass
