from __future__ import print_function
import errno
import logging
import json
import sys
from flask import (
    Flask, request, redirect, send_file, jsonify, session, abort, url_for,
    send_from_directory
)
import db
import requests
import os
import os.path
from io import BytesIO
from subprocess import Popen, STDOUT
import uuid
import tempfile
from sign import sign
import codecs
from copy import deepcopy
from base64 import b64decode
try:
    from subprocess import DEVNULL  # py3k
except ImportError:
    import os
    DEVNULL = open(os.devnull, 'wb')

logging.basicConfig()

app = Flask(__name__, static_url_path='', static_folder='public')
config_file_path = os.environ.get('CONFIG_FILE') or sys.argv[1]
app.config.from_pyfile(os.path.join(os.getcwd(), config_file_path))

PORT = app.config.get('PORT')

TMP_DIR = '/tmp/.catalex_sign/'
SIGNATURE_FILE_PREFIX = 'signature_'
SIGNED_FILE_PREFIX = 'signed_'

ALLOWED_PDF_MIME_TYPES = [
    'application/pdf', 'application/x-pdf', 'application/acrobat',
    'applications/vnd.pdf', 'text/pdf', 'text/x-pd'
]

thumb_cmds = [
    'convert', '-thumbnail', '150x', '-background', 'white', '-alpha', 'remove'
]


def upload_document(files, set_id, document_id, user_id):
    document_info = []

    db.find_or_create_and_validate_document_set(set_id, user_id)
    for file in files:
        if (not file.content_type or
                file.content_type in ALLOWED_PDF_MIME_TYPES):
            document_info.append(db.add_document(
                set_id, document_id, file.filename, file.read(),
            ))
    return document_info


def generate_signed_filename(file_id):
    return SIGNED_FILE_PREFIX + file_id + '.pdf'



def save_temp_signature(signature_id, user_id):
    signature_binary = db.get_signature(signature_id, user_id)

    signature_filename = SIGNATURE_FILE_PREFIX + str(uuid.uuid4()) + '.png'
    signature_filepath = os.path.join(TMP_DIR, signature_filename)

    signature_writer = open(signature_filepath, "wb")
    signature_writer.write(signature_binary)
    signature_writer.close()

    return signature_filepath


def upload_signature(base64Image):
    signature_id = db.add_signature(
        session['user_id'],
        b64decode(base64Image.split(",")[1])
    )
    return {'signature_id': signature_id}


def delete_signature(id):
    signature_id = db.remove_signature(
        id,
        session['user_id']
    )
    return {}


def thumb(file_id):
    output = tempfile.NamedTemporaryFile(suffix='.png', delete=False)

    try:
        pdf_first_page_path = os.path.join(TMP_DIR, file_id + '.pdf[0]')
        args = thumb_cmds[:] + [pdf_first_page_path, output.name]
        Popen(args, stdout=DEVNULL, stderr=STDOUT).wait()
        return output.read()
    except Exception as e:
        raise e
    finally:
        output.close()


class InvalidUsage(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

'''
Documents
'''


@app.route('/api/documents', methods=['GET'])
def get_documents_list(uuid):
    return jsonify('test_one')


@app.route('/api/documents', methods=['POST'])
def document_upload():
    try:
        files = request.files.getlist('file[]')
        set_id = request.form.get('document_set_id')
        document_id = request.form.get('document_id')
        user_id = session['user_id']
        return jsonify(upload_document(files, set_id, document_id, user_id))
    except Exception as e:
        print(e)
        raise InvalidUsage(e.message, status_code=500)


@app.route('/api/documents/<doc_id>', methods=['GET'])
def get_documents(doc_id):
    try:
        documents = db.get_document_set(session['user_id'], doc_id)
        return jsonify(documents)
    except Exception as e:
        raise InvalidUsage(e.message, status_code=500)


@app.route('/api/document/<doc_id>', methods=['GET'])
def get_document(doc_id):
    try:
        document = db.get_document(session['user_id'], doc_id)

        if not document:
            abort(404)

        return send_file(BytesIO(document['data']), mimetype='application/pdf', attachment_filename=document['filename'], as_attachment=True)
    except Exception as e:
        print(e)
        raise InvalidUsage(e.message, status_code=500)

@app.route('/api/documents/thumb/<uuid>', methods=['GET'])
def thumbview(uuid):
    try:
        result = thumb(uuid)
        return send_file(BytesIO(result),
                         mimetype='image/png')
    except Exception as e:
        print(e)
        raise InvalidUsage(e.message, status_code=500)

'''
Signatures
'''


@app.route('/api/signatures/upload', methods=['POST'])
def signature_upload():
    try:
        base64Image = request.get_json()['base64Image']
        return jsonify(upload_signature(base64Image))
    except Exception as e:
        print(e)
        raise InvalidUsage(e.message, status_code=500)

@app.route('/api/signatures/<id>', methods=['DELETE'])
def signature_delete(id):
    try:
        return jsonify(delete_signature(id))
    except Exception as e:
        print(e)
        raise InvalidUsage(e.message, status_code=500)


@app.route('/api/signatures', methods=['GET'])
def signatures_list():
    try:
        signatures = db.get_signatures_for_user(session['user_id'])
        return jsonify(signatures)
    except Exception as e:
        print(e)
        raise InvalidUsage(e.message, status_code=500)


@app.route('/api/signatures/<id>', methods=['GET'])
def signature(id):
    try:
        signature = db.get_signature(id, session['user_id'])

        if not signature:
            abort(404)

        signature_file = BytesIO(signature)
        return send_file(signature_file, attachment_filename='signature.png')
    except Exception as e:
        print(e)
        raise InvalidUsage(e.message, status_code=500)

'''
Sign
'''


@app.route('/api/sign', methods=['POST'])
def sign_document():
    args = request.get_json()
    saveable = deepcopy(args)
    document_db = db.get_document(session['user_id'], args['documentId'])
    document_id = args['documentId']
    document =  BytesIO(document_db['data'])
    filename = document_db['filename']
    document_set_id = document_db['document_set_id']
    for signature in args['signatures']:
        signature['signature'] = BytesIO(db.get_signature(signature['signatureId'], session['user_id']))

    result = sign(document, args['signatures'])
    saved_document_id = db.add_document(document_set_id, None, filename, result.read())['document_id']
    db.sign_document(session['user_id'], document_id, saved_document_id, saveable)
    return jsonify({'document_id': saved_document_id})




@app.route('/login', methods=['GET'])
def login():
    try:
        user_data = {}

        if app.config.get('DEV_USER_ID'):
            user_data = {
                'user_id': app.config.get('DEV_USER_ID'),
                'name': 'Dev User',
                'email': 'dev@user.com'
            }
        else:
            args = request.args.to_dict()

            provided_code = args.get('code')
            if not all([provided_code]):
                return redirect(app.config.get('OAUTH_URL'))

            params = {
                'code': provided_code,
                'grant_type': 'authorization_code',
                'client_id': app.config.get('OAUTH_CLIENT_ID'),
                'client_secret': app.config.get('OAUTH_CLIENT_SECRET'),
                'redirect_uri': app.config.get('LOGIN_URL')
            }

            response = requests.post(
                app.config.get('AUTH_SERVER') + '/oauth/access_token',
                data=params
            )
            access_data = response.json()


            response = requests.get(
                app.config.get('AUTH_SERVER') + '/api/user',
                params={'access_token': access_data['access_token']}
            )

            user_data = response.json()
            user_data['user_id'] = user_data['id']



        db.upsert_user(user_data)
        session['user_id'] = user_data['user_id']
        return redirect(url_for('catch_all'))
    except Exception as e:
        print(e)
        raise InvalidUsage('Could not log in', status_code=500)


@app.route('/logout', methods=['GET'])
def logout():
    session.clear()
    return redirect(app.config.get('USER_LOGOUT_URL'))


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return send_from_directory(app.static_folder, 'index.html')


@app.errorhandler(404)
def send_index(path):
    return send_from_directory(app.static_folder, 'index.html')


@app.errorhandler(InvalidUsage)
def handle_invalid_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


@app.before_request
def before_request():
    if 'user_id' not in session and request.endpoint is not 'login':
        return redirect(url_for('login'))


try:
    os.makedirs(TMP_DIR)
except OSError as exception:
    if exception.errno != errno.EEXIST:
        raise
if __name__ == '__main__':
    print('Running on %d' % PORT)
    app.run(port=PORT, debug=True, host='0.0.0.0', threaded=True)
