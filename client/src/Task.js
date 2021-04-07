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
            taskID: null,
            predictions: null
        }
    }

    componentDidMount(){
        var params = new URLSearchParams(this.props.location.search);
        var taskID = params.get("id");
        this.setState({taskID: taskID});
        API.getPredictionsByTaskID(cookies.get('datasetID'), taskID, (predictions) => {
            this.setState({predictions: this.sortPredictions(predictions)});
            console.log(this.sortPredictions(predictions));
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
        this.props.history.push(`/explaination?taskID=${this.state.taskID}&entityID=${entityID}`);
    }

    render(){
        return (

            <div>
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
                                        {row["Label"]}
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