import React from 'react';
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import './App.css';
import {Button, Pagination, Modal, Badge, Container, Row, Col} from 'react-bootstrap';
import Cookies from 'universal-cookie';
 
const cookies = new Cookies();
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
            info: null,
            tailTasks: [],
            headTasks: []
        }
    }

    componentDidMount(){
        console.log(this.props);
        var params = new URLSearchParams(this.props.location.search);
        var id = params.get("id");
        API.getInfoByEntityID(cookies.get('datasetID'), cookies.get('explainationID'), id, (info) => this.setState({info: info}));
        API.getTasksByEntityID(cookies.get('explainationID'), id, (tasks) => this.addTasks(tasks));
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
                <Modal.Dialog className="w-none w-50 mw-100">
                <Modal.Header className="justify-content-center">
                    <h2>
                        {this.state.info?.Curie}: {this.state.info?.Label ? this.state.info?.Label : ""}
                    </h2>
                </Modal.Header>
                <Modal.Body>
                    <Container fluid className="text-left">
                        { this.state.info?.Synonyms ? 
                            [
                            <Row>
                                <Col>
                                    <h5>Synonyms</h5>
                                </Col>
                            </Row>,
                            <Row>
                                <Col>
                                    {this.state.info.Synonyms.join(", ")}
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
                                {this.state.info?.Description ? this.state.info?.Description : ""}
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <h5>Predictions</h5>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                {this.state.tailTasks.length > 0 ? "Predict heads" : ""}
                            </Col>
                        </Row>
                        <Row>
                            <Col className="text-center">
                                {this.state.tailTasks.map(row =>
                                    <Button id={row["TaskID"]} className='Relation-btn w-100 mb-1' variant="dark" onClick={() => this.onRelationSelection(row["TaskID"])}>
                                        <table className="w-100">
                                            <tbody>
                                                <tr>
                                                    <td className="w-25">
                                                        ?
                                                    </td>
                                                    <td className="w-50">
                                                        {row["RelationName"]}
                                                    </td>
                                                    <td  className="w-25">
                                                        {this.state.info?.Label ? this.state.info?.Label : this.state.info?.Curie}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </Button>
                                )}
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                            {this.state.headTasks.length > 0 ? "Predict tails" : ""}
                            </Col>
                        </Row>
                        <Row>
                            <Col className="text-center">
                                {this.state.headTasks.map(row =>
                                    <Button id={row["TaskID"]} className='Relation-btn w-100 mb-1' variant="dark" onClick={() => this.onRelationSelection(row["TaskID"])}>
                                        <table className="w-100">
                                            <tbody>
                                                <tr>
                                                    <td className="w-25">
                                                        {this.state.info?.Label ? this.state.info?.Label : this.state.info?.Curie}
                                                    </td>
                                                    <td className="w-50">
                                                        {row["RelationName"]}
                                                    </td>
                                                    <td  className="w-25">
                                                        ?
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </Button>
                                )}
                            </Col>
                        </Row>
                    </Container>
                </Modal.Body>
                </Modal.Dialog>
            </div>
        );
    }
}

export const Entity = withRouter(Entity_);