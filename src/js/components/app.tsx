import * as React from "react";
import Header from './header';
import { CSSTransitionGroup } from 'react-transition-group';
import Modals from './modals'
import CustomDragLayer from './dragLayer';
import * as moment from 'moment';
import * as momentLocalizer from 'react-widgets/lib/localizers/moment';
import { Col, Row } from 'react-bootstrap';
import Sidebar from './sidebar';

momentLocalizer(moment);

interface AppProps {
    location:  Location,
    children: any
}
export  class ContainerWithSideBar extends React.PureComponent<AppProps, {}> {
    render() {
        const { children, location: { pathname } } = this.props;
        return (
            <div className="container">
                <Row>
                <Col sm={2}>
                    <Sidebar pathname={pathname}/>
                </Col>

                <Col sm={10}>
                  <CSSTransitionGroup style={{position: 'relative', display:'block'}}
                          transitionName={'slideInRight'}
                          transitionEnterTimeout={400}
                          transitionLeaveTimeout={400}
                        >
                            <div  key={pathname} className="main-content">
                        { children }
                        </div>
                      </CSSTransitionGroup>
                </Col>
                </Row>
            </div>
        );
    }
}

export  class Container extends React.PureComponent<AppProps, {}> {
    render() {
        const { children, location: { pathname } } = this.props;
        return (
            <div className="container">

                    <div  key={pathname} className="main-content">
                { children }
                </div>

            </div>
        );
    }
}


export default class App extends React.PureComponent<AppProps, {}> {
    render() {
        const { children, location: { pathname } } = this.props;
        return (
            <div>
                <CustomDragLayer />
                <Header />

                        <div >
                             {children}
                      </div>
                <Modals />
            </div>
        );
    }
}