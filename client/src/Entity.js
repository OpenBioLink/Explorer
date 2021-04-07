import React from 'react';
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import './App.css';
import {Button, Pagination, Badge, Container, Row, Col} from 'react-bootstrap';
import Cookies from 'universal-cookie';
 
const cookies = new Cookies();
const util = require('./Util');
const API = require('./API');

export class Entity_ extends React.Component{

    static propTypes = {
        match: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
      };

    constructor(){
        super();
        this.state = {
            curie: "",
            label: "",
            description: "",
            synonyms: [],
            tailTasks: [],
            headTasks: []
        }
    }

    componentDidMount(){
        console.log(this.props);
        var params = new URLSearchParams(this.props.location.search);
        var curie = params.get("id");
        this.setState({curie: curie});
        API.getInfoByCurie(cookies.get('datasetID'), curie, (info) => this.addInfo(info));
        API.getTasksByCurie(cookies.get('datasetID'), curie, (tasks) => this.addTasks(tasks));
    }

    addInfo(info){
        console.log(info);
        this.setState({
            label: info.Label,
            description: info.Description,
            synonyms: info.Synonyms
        });
    }

    addTasks(tasks) {
        var headTasks = [];
        var tailTasks = [];
        for(var i = 0; i < tasks.length; i++){
            if(tasks[i]["IsHead"] === 1){
                headTasks.push(tasks[i]);
            } else {
                tailTasks.push(tasks[i]);
            }
        }
        console.log(headTasks);
        console.log(tailTasks);
        this.setState({
            headTasks: headTasks,
            tailTasks: tailTasks
        });
    }

    onRelationSelection(taskID){
        this.props.history.push("/task?id=" + taskID);
    }

    render(){
        return (
            
            <div>
                <h2>
                    {this.state.curie}: {this.state.label ? this.state.label : ""} <Badge variant="secondary">Movie</Badge>
                </h2>
                <Container className="mx-auto text-left">
                    { this.state.synonyms ? 
                        [
                        <Row>
                            <Col>
                                <h5>Synonyms</h5>
                            </Col>
                        </Row>,
                        <Row>
                            <Col>
                                {this.state.synonyms.join(", ")}
                            </Col>
                        </Row>
                        ]
                        : ""
                    }
                    <Row>
                        <Col>
                            <h5>Description</h5>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            {this.state.description ? this.state.description : ""}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <h5>Predictions</h5>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            Predict heads<br/>
                            {this.state.tailTasks.map(row =>
                                <Button id={row["TaskID"]} className='Relation-btn' variant="dark" onClick={() => this.onRelationSelection(row["TaskID"])}>{row["RelationName"]}</Button>
                            )}
                        </Col>
                        <Col>
                            Predict tails<br/>
                            {this.state.headTasks.map(row =>
                                <Button id={row["TaskID"]} className='Relation-btn' variant="dark" onClick={() => this.onRelationSelection(row["TaskID"])}>{row["RelationName"]}</Button>
                            )}
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}

export const Entity = withRouter(Entity_);