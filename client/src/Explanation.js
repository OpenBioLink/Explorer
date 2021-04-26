import React, {useState, useContext} from 'react';
import { useAccordionToggle } from "react-bootstrap/AccordionToggle";
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import './App.css';
import {Container, Row, Col, ListGroup, Modal, Table, Accordion, Card, Button, AccordionContext} from 'react-bootstrap';
import { IconContext } from "react-icons";
import { RiArrowDropDownLine, RiArrowDropRightLine } from "react-icons/ri";
import Cookies from 'universal-cookie';
 
const cookies = new Cookies();
const API = require('./API');

export class Explanation_ extends React.Component{

    static propTypes = {
        match: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
      };

    constructor(){
        super();
        this.state = {
            info: null,
            explanation: null,
            showInstantiations: false,
            instantiations: null
        }
    }

    componentDidMount(){
        var params = new URLSearchParams(this.props.location.search);
        var taskID = params.get("taskID");
        var entityID = params.get("entityID");
        API.getPredictionInfo(cookies.get('datasetID'), cookies.get('explanationID'), taskID, entityID, (res) => {
            this.setState({info: res});
            console.log(res);
        });
        API.getExplanations(cookies.get('datasetID'), cookies.get('explanationID'), taskID, entityID, (explanation) => {
            console.log(explanation);
            this.setState({explanation: explanation});
        });
    }

    showInstantiations(ruleID){
        API.getInstantiations(cookies.get('datasetID'), cookies.get('explanationID'), ruleID, this.state.info.head.curie, this.state.info.tail.curie, (instantiations) => {
            console.log(instantiations);
            this.setState({
                instantiations: instantiations,
                showInstantiations: true
            });
        });
    }

    render(){
        return (
            <div>
            {this.state.info ?
                <Container className="my-2">
                    <Row>
                        <Col>
                            <h2><a href={'/entity?term=' + this.state.info.head.curie}>{this.state.info.head.label ? this.state.info.head.label : this.state.info.tail.curie}</a></h2>
                        </Col>
                        <Col>
                            <h2>{this.state.info.rel}</h2>
                        </Col>
                        <Col>
                            <h2><a href={'/entity?term=' + this.state.info.tail.curie}>{this.state.info.tail.label ? this.state.info.tail.label : this.state.info.tail.curie}</a></h2>
                        </Col>
                        <Col>
                            <h2>{this.state.info.confidence.toFixed(5)}</h2>
                        </Col>
                    </Row>
                </Container>
            : "" }
                <Accordion defaultActiveKey="0" className="w-75 m-auto">
                {this.state.explanation && this.state.info ? 
                this.state.explanation.map(cluster =>
                        <Card>
                            <CustomToggle eventKey={String(cluster["ID"])} confidence={cluster["Rules"][0]["Confidence"]} activeKey="0"/>
                            <Accordion.Collapse eventKey={String(cluster["ID"])}>
                                <Table className="w-auto m-auto"> 
                                    {cluster["Rules"].map(rule =>
                                        <tr className="mb-2">
                                            <td>
                                                <Table className="m-0">
                                                        <tbody>
                                                        {rule.Definition.bodies.map((body) =>
                                                                    <tr>
                                                                        <td className="w-25 border-top-0">
                                                                            {(this.state.info.head && this.state.info.tail) ?
                                                                                body.headLabel ? 
                                                                                    <a href={'/entity?term=' + body.head}>{body.headLabel}</a> 
                                                                                : body.head === "X" ? 
                                                                                    <b><a href={'/entity?term=' + this.state.info.head.curie}>{this.state.info.head.label}</a></b>
                                                                                : body.head === "Y" ? 
                                                                                    <b><a href={'/entity?term=' + this.state.info.tail.curie}>{this.state.info.tail.label}</a> </b>
                                                                                : body.head
                                                                                : ""
                                                                            }
                                                                        </td>
                                                                        <td className="w-50 border-top-0">
                                                                            {body.relation}
                                                                        </td>
                                                                        <td className="w-25 border-top-0">
                                                                            {(this.state.info.head.label && this.state.info.tail.label) ?
                                                                                body.tailLabel ? 
                                                                                    <a href={'/entity?term=' + body.tail}>{body.tailLabel}</a> 
                                                                                : body.tail === "X" ? 
                                                                                    <b><a href={'/entity?term=' + this.state.info.head.curie}>{this.state.info.head.label}</a></b>
                                                                                : body.tail === "Y" ? 
                                                                                    <b><a href={'/entity?term=' + this.state.info.tail.curie}>{this.state.info.tail.label}</a> </b> 
                                                                                : body.tail
                                                                                : ""
                                                                            }
                                                                        </td>
                                                                    </tr>
                                                        )}
                                                        </tbody>
                                                    </Table>
                                            </td>
                                            <td className="align-middle">
                                                {rule["Confidence"].toFixed(5)}
                                            </td>
                                            <td className="align-middle">
                                                {rule["CorrectlyPredicted"]}
                                            </td>
                                            <td className="align-middle">
                                                {rule["Predicted"]}
                                            </td>
                                            <td className="align-middle">
                                                <Button onClick={() => {this.showInstantiations(rule["ID"])}}>Instantiations</Button>
                                            </td>
                                        </tr>
                                    )}
                                    </Table>
                            </Accordion.Collapse>
                        </Card>
                )
                : "" }
                </Accordion>
                <Modal show={this.state.showInstantiations} onHide={() => {this.setState({showInstantiations: false})}}>
                    <Modal.Header closeButton>
                    <Modal.Title>Modal heading</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                    <Table>
                            <tbody>
                                { this.state.instantiations ? 
                                this.state.instantiations.map((instantiation) =>
                                    <tr>
                                        {Object.entries(instantiation).map(([variable, labeled_instantiation]) => 
                                            <>
                                            <td>
                                                {variable} = {labeled_instantiation["value"]}
                                            </td>
                                            </>
                                        )}
                                    </tr>
                                )
                                : "" }
                            </tbody>
                        </Table>
                    </Modal.Body>
                    <Modal.Footer>
                    <Button variant="secondary" onClick={() => {this.setState({showInstantiations: false})}}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={() => {this.setState({showInstantiations: false})}}>
                        Save Changes
                    </Button>
                    </Modal.Footer>
                </Modal>
        </div>
        );
    }
}

export const Explanation = withRouter(Explanation_);


function CustomToggle({eventKey, confidence, activeKey}) {
    const currentEventKey = useContext(AccordionContext);

    const decoratedOnClick = useAccordionToggle(eventKey);

    const isCurrentEventKey = currentEventKey === eventKey;

    return (
        <Card.Header onClick={decoratedOnClick}>
            <Table className="mb-0">
                <tr>
                    <td className="text-left border-top-0">
                        <IconContext.Provider value={{ size: "2em", className: "global-class-name" }}>
                            <div>
                                {isCurrentEventKey ? <RiArrowDropDownLine/> : <RiArrowDropRightLine/>}
                            </div>
                        </IconContext.Provider>
                    </td>
                    <td className="text-left border-top-0">
                        <h5 className="mb-0">Cluster</h5>
                    </td>
                    <td className="text-right border-top-0">
                        <h5 className="mb-0">{confidence.toFixed(5)}</h5>
                    </td>
                </tr>
            </Table>
        </Card.Header>
    );
  }