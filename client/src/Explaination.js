import React from 'react';
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import './App.css';
import {Container, Row, Col, ListGroup} from 'react-bootstrap';
import Cookies from 'universal-cookie';
 
const cookies = new Cookies();
const util = require('./Util');
const API = require('./API');

export class Explaination_ extends React.Component{

    static propTypes = {
        match: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
      };

    constructor(){
        super();
        this.state = {
            taskID: null,
            entityID: null,
            explaination: null
        }
    }

    componentDidMount(){
        var params = new URLSearchParams(this.props.location.search);
        var taskID = params.get("taskID");
        var entityID = params.get("entityID");
        this.setState({
            taskID: taskID,
            entityID: entityID
        });
        API.getExplainations(cookies.get('datasetID'), taskID, entityID, (explaination) => {
            console.log(explaination);
            this.setState({explaination: explaination});
        });
    }

    render(){
        return (
            <div>
            <Container fluid>
                <Row>
                <Col>
                    <Container>
                    {this.state.explaination ? 
                    this.state.explaination.map(cluster =>
                        [
                            <Row>
                                <Col>
                                    {cluster["ID"]}
                                </Col>
                                <Col>
                                    {cluster["Confidence"]}
                                </Col>
                            </Row>,
                            <Row>
                                <Col>
                                    <Container> 
                                    {cluster["Rules"].map(rule =>
                                        <Row>
                                            <Col>
                                                <Container>
                                                    <Row>
                                                        <Col>
                                                            <Container>
                                                                <Row>
                                                                    <Col>
                                                                        {rule.Definition.headLabel ? rule.Definition.headLabel : rule.Definition.head}
                                                                    </Col>
                                                                    <Col>
                                                                        {rule.Definition.relation}
                                                                    </Col>
                                                                    <Col>
                                                                        {rule.Definition.tailLabel ? rule.Definition.tailLabel : rule.Definition.tail}
                                                                    </Col>
                                                                </Row>
                                                            </Container>
                                                        </Col>
                                                    </Row>
                                                    {rule.Definition.bodies.map((body) =>
                                                        <Row>
                                                            <Col>
                                                                <Container>
                                                                    <Row>
                                                                        <Col>
                                                                            {body.headLabel ? body.headLabel : body.head}
                                                                        </Col>
                                                                        <Col>
                                                                            {body.relation}
                                                                        </Col>
                                                                        <Col>
                                                                            {body.tailLabel ? body.tailLabel : body.tail}
                                                                        </Col>
                                                                    </Row>
                                                                </Container>
                                                            </Col>
                                                        </Row>
                                                    )}
                                                </Container>
                                                
                                            </Col>
                                            <Col>
                                                {rule["Confidence"]}
                                            </Col>
                                        </Row>
                                    )}
                                    </Container>
                                </Col>
                            </Row>
                        ]
                    )
                    : "" }
                    </Container>
                </Col>
                </Row>
            </Container>
        </div>
        );
    }
}

export const Explaination = withRouter(Explaination_);