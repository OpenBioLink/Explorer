import React from 'react';
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import './App.css';
import {Container, Row, Col, ListGroup} from 'react-bootstrap';
import Cookies from 'universal-cookie';
 
const cookies = new Cookies();
const API = require('./API');

export class Task_ extends React.Component{

    static propTypes = {
        match: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
      };

    constructor(){
        super();
        this.state = {
            entityInfo: null,
            task: null,
            predictions: null,
        }
    }

    componentDidMount(){
        var params = new URLSearchParams(this.props.location.search);
        var id = params.get("id");
        API.getTaskByID(cookies.get('explainationID'), id, (task) => {
            console.log(task);
            API.getInfoByEntityID(cookies.get('datasetID'), cookies.get('explainationID'), task[0]["EntityID"], (info) => {console.log(info);this.setState({entityInfo: info})});
            this.setState({task: task[0]});
        });
        API.getPredictionsByTaskID(cookies.get('datasetID'), cookies.get('explainationID'), id, (predictions) => {
            this.setState({predictions: this.sortPredictions(predictions)});
        });
    }

    sortPredictions(predictions){
        return predictions.sort((a,b) => {
            var confA = a["Confidence"];
            var confB = b["Confidence"];
      
            if (confA < confB) {
                return 1;
            }
            else if (confA > confB) {
                return -1;
            } else {
                return 0;
            }
          });
    }

    onPredictionSelection(entityID){
        this.props.history.push(`/explaination?taskID=${this.state.task.TaskID}&entityID=${entityID}`);
    }

    render(){
        return (

            <div>
                <Container className="my-2">
                    <Row>
                    <Col>
                        <h2>{(this.state.task && this.state.entityInfo) ? this.state.task.IsHead === 1 ? this.state.entityInfo.Label : "?" : ""}</h2>
                    </Col>
                    <Col>
                        <h2>{(this.state.task && this.state.entityInfo) ? this.state.task.RelationName : ""}</h2>
                    </Col>
                    <Col>
                        <h2>{(this.state.task && this.state.entityInfo) ? this.state.task.IsHead === 0 ? this.state.entityInfo.Label : "?" : ""}</h2>
                    </Col>
                    </Row>
                </Container>
                <Container fluid>
                    <Row>
                    <Col/>
                    <Col>
                        <ListGroup>
                        {this.state.predictions ? 
                        this.state.predictions.map(row =>
                            <ListGroup.Item action as="button" variant="dark" onClick={() => this.onPredictionSelection(row["EntityID"])}>
                                <Container>
                                <Row>
                                    <Col>
                                        {row["Label"] ? row["Label"] : row["EntityName"]}
                                    </Col>
                                    <Col>
                                        {row["Confidence"]}
                                    </Col>
                                </Row>
                                </Container>
                            </ListGroup.Item>
                        )
                        : "" }
                        </ListGroup>
                    </Col>
                    <Col/>
                    </Row>
                </Container>
            </div>
        );
    }
}

export const Task = withRouter(Task_);