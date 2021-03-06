"use strict";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Root from "./root";
import configureStore from './configureStore';
import { browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { formatUsage, formatUser } from './utils'
import configureRaven from './configureRaven';


let data : any = {};

try{
    const input : any = JSON.parse(document.getElementById("token").textContent)
    window._CSRF_TOKEN = input['_csrf_token'];
}catch(e){

}

try{
    const input : any = JSON.parse(document.getElementById("data").textContent)
    if(input.usage){
        data.usage = formatUsage(input.usage)
    }
    if(input.user){
        data.user = formatUser(input.user)
    }
    if(input.userMeta){
        data.userMeta = input.userMeta;
        if(!data.userMeta.tour){
            data.userMeta.tour = {};
        }
        if(data.userMeta.tour && data.userMeta.tour.tourDismissed){
            data.tour = {showing: false};
        }
    }

}catch(e){
    //do nothing
}

const store = configureStore(browserHistory, data);
const history = syncHistoryWithStore(browserHistory, store);
if(!DEV){
    // Sentry error reporting
    configureRaven(store.getState);
}

ReactDOM.render(
     <Root store={store} history={history} />,
    document.getElementById('main')
);

