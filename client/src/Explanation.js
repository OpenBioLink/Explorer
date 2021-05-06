import React, {useState, useContext} from 'react';
import { useAccordionToggle } from "react-bootstrap/AccordionToggle";
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import './App.css';
import {Container, Row, Col, ListGroup, Modal, Spinner, Table, Accordion, Card, Button, AccordionContext, OverlayTrigger, Tooltip} from 'react-bootstrap';
import { IconContext } from "react-icons";
import { RiArrowDropDownLine, RiArrowDropRightLine } from "react-icons/ri";
import { HiVariable, HiOutlineVariable } from "react-icons/hi"
import { AiOutlineFunction } from "react-icons/ai"
import { FaArrowRight } from "react-icons/fa";

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
            datasetID: null,
            explanationID: null,

            info: null,
            explanation: null,

            showInstantiations: false,
            selectedRule: null,
            instantiations: null
        }
    }

    componentDidMount(){
        var params = new URLSearchParams(this.props.location.search);
        var taskID = params.get("taskID");
        var entityID = params.get("entityID");
        var datasetID = this.props.match.params.dataset;
        var explanationID = this.props.match.params.explanation;

        this.setState({
            datasetID: datasetID,
            explanationID: explanationID
        });

        API.getPredictionInfo(datasetID, explanationID, taskID, entityID, (res) => {
            this.setState({info: res});
        });
        API.getExplanations(datasetID, explanationID, taskID, entityID, (explanation) => {
            this.setState({explanation: explanation});
        });
    }

    showInstantiations(rule){
        this.setState({
            selectedRule: rule,
            showInstantiations: true
        })
        API.getInstantiations(this.state.datasetID, this.state.explanationID, rule["ID"], this.state.info.head.curie, this.state.info.tail.curie, (instantiations) => {
            this.setState({
                instantiations: instantiations
            });
        });
    }

    render(){
        return (
            <div>
            {this.state.info ?
                <>
                <Container className="my-4">
                    <Row>
                        <Col style={{display: "flex"}}>
                            <h2 className="m-auto"><a href={`/entity/${this.state.datasetID}/${this.state.explanationID}?term=${this.state.info.head.curie}`}>{this.state.info.head.label ? this.state.info.head.label : this.state.info.tail.curie}</a></h2>
                        </Col>
                        <Col style={{display: "flex"}}>
                            <h2 className="m-auto">{this.state.info.rel}</h2>
                        </Col>
                        <Col style={{display: "flex"}}>
                            <h2 className="m-auto"><a href={`/entity/${this.state.datasetID}/${this.state.explanationID}?term=${this.state.info.tail.curie}`}>{this.state.info.tail.label ? this.state.info.tail.label : this.state.info.tail.curie}</a></h2>
                        </Col>
                    </Row>
                    <Row>
                        <Col className="mt-3" style={{display: "flex"}}>
                            <h4 className="m-auto">Confidence: {this.state.info.confidence.toFixed(5)}</h4>
                        </Col>
                    </Row>
                </Container>
                {this.state.explanation && this.state.info ?
                    this.state.explanation.length > 1 ? 
                        <Accordion defaultActiveKey="0" className="w-75 m-auto">
                        {this.state.explanation.map(cluster =>
                            <Card>
                                <CustomToggle eventKey={String(cluster["ID"])} confidence={cluster["Rules"][0]["Confidence"]} activeKey="0"/>
                                <Accordion.Collapse eventKey={String(cluster["ID"])}>
                                    <Cluster cluster={cluster} info={this.state.info} showInstantiations={(rule)=>this.showInstantiations(rule)}/>
                                </Accordion.Collapse>
                            </Card>
                        )}
                        </Accordion>
                    : <Cluster cluster={this.state.explanation[0]} info={this.state.info} showInstantiations={(rule)=>this.showInstantiations(rule)}/>
                : "" }
                <Modal show={this.state.showInstantiations} size="lg" onHide={() => {this.setState({instantiations: null, showInstantiations: false})}}>
                    <Modal.Header closeButton>
                    <Modal.Title>Instantiations</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Table className="m-0 text-center mb-3">
                            <tbody>
                                <tr>
                                    <td className="w-25 border-top-0">
                                        <b><a href={`/entity/${this.state.datasetID}/${this.state.explanationID}?term=${this.state.info.head.curie}`}>{this.state.info.head.label ? this.state.info.head.label : this.state.info.tail.curie}</a></b>
                                    </td>
                                    <td className="w-50 border-top-0">
                                        {this.state.info.rel}
                                    </td>
                                    <td className="w-25 border-top-0">
                                        <b><a href={`/entity/${this.state.datasetID}/${this.state.explanationID}?term=${this.state.info.tail.curie}`}>{this.state.info.tail.label ? this.state.info.tail.label : this.state.info.tail.curie}</a></b>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-center border-top-0" colSpan="3">
                                        <FaArrowRight/>
                                    </td>
                                </tr>
                            {this.state.selectedRule?.Definition.bodies.map((body) =>
                                        <tr>
                                            <td className="w-25 border-top-0">
                                                {(this.state.info.head && this.state.info.tail) ?
                                                    body.headLabel ? 
                                                        <a href={`/entity/${this.state.datasetID}/${this.state.explanationID}?term=${body.head}`}>{body.headLabel}</a> 
                                                    : body.head === "X" ? 
                                                        <a href={`/entity/${this.state.datasetID}/${this.state.explanationID}?term=${this.state.info.head.curie}`}>{this.state.info.head.label ? this.state.info.head.label : this.state.info.head.curie }</a>
                                                    : body.head === "Y" ? 
                                                        <a href={`/entity/${this.state.datasetID}/${this.state.explanationID}?term=${this.state.info.tail.curie}`}>{this.state.info.tail.label ? this.state.info.tail.label: this.state.info.tail.curie}</a>
                                                    : body.head
                                                    : "Hi"
                                                }
                                            </td>
                                            <td className="w-50 border-top-0">
                                                {body.relation}
                                            </td>
                                            <td className="w-25 border-top-0">
                                                {(this.state.info.head && this.state.info.tail) ?
                                                    body.tailLabel ? 
                                                        <a href={`/entity/${this.state.datasetID}/${this.state.explanationID}?term=${body.tail}`}>{body.tailLabel}</a> 
                                                    : body.tail === "X" ? 
                                                        <a href={`/entity/${this.state.datasetID}/${this.state.explanationID}?term=${this.state.info.head.curie}`}>{ this.state.info.head.label ? this.state.info.head.label : this.state.info.head.curie }</a>
                                                    : body.tail === "Y" ? 
                                                        <a href={`/entity/${this.state.datasetID}/${this.state.explanationID}?term=${this.state.info.tail.curie}`}>{ this.state.info.tail.label ? this.state.info.tail.label: this.state.info.tail.curie }</a>
                                                    : body.tail
                                                    : "Hi"
                                                }
                                            </td>
                                        </tr>
                            )}
                            </tbody>
                        </Table>
                        <Container className="text-center">
                                { this.state.instantiations ? 
                                this.state.instantiations.map((instantiation) =>
                                    <Row className="border-top py-2">
                                        {instantiation.map((variable) => 
                                            <>
                                            <Col>
                                                {variable.variable} = <a href={`/entity/${this.state.datasetID}/${this.state.explanationID}?term=${variable.curie}`}>{variable.label ? variable.label : variable.curie}</a>
                                            </Col>
                                            </>
                                        )}
                                    </Row>
                                )
                                : <Row><Col><Spinner animation="border" /></Col></Row> }
                        </Container>
                    </Modal.Body>
                    <Modal.Footer>
                    <Button variant="secondary" onClick={() => {this.setState({instantiations: null, showInstantiations: false})}}>
                        Close
                    </Button>
                    </Modal.Footer>
                </Modal>
                </>
            : "" }
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
                    <td className="w-auto text-left border-top-0">
                        <IconContext.Provider value={{ size: "2em", className: "global-class-name" }}>
                            <div>
                                {isCurrentEventKey ? <RiArrowDropDownLine/> : <RiArrowDropRightLine/>}
                            </div>
                        </IconContext.Provider>
                    </td>
                    <td className="w-75 align-middle text-left border-top-0">
                        <h5 className="mb-0">Cluster</h5>
                    </td>
                    <td className="w-25 align-middle text-right border-top-0">
                        <h5 className="mb-0">{confidence.toFixed(5)}</h5>
                    </td>
                </tr>
            </Table>
        </Card.Header>
    );
  }

function Cluster({cluster, info, showInstantiations}){
    return (
        <Table className="w-auto m-auto">
            <thead>
                <tr>
                    <th className="align-middle">
                        Rule
                    </th>
                    <th className="align-middle">
                        Confidence
                    </th>
                    <th className="align-middle">
                        Correctly predicted
                    </th>
                    <th className="align-middle">
                        Predicted
                    </th>
                    <th/>
                </tr>
            </thead>
            <tbody> 
            {cluster["Rules"].map(rule =>
                <tr className="mb-2">
                    <td>
                        <Table className="m-0">
                            <tbody>
                            {rule.Definition.bodies.map((body) =>
                                        <tr>
                                            <td className="w-25 border-top-0">
                                                {(info.head && info.tail) ?
                                                    body.headLabel ? 
                                                        <a href={'/entity?term=' + body.head}>{body.headLabel}</a> 
                                                    : body.head === "X" ? 
                                                        <b><a href={'/entity?term=' + info.head.curie}>{info.head.label ? info.head.label : info.head.curie}</a></b>
                                                    : body.head === "Y" ? 
                                                        <b><a href={'/entity?term=' + info.tail.curie}>{info.tail.label ? info.tail.label : info.tail.curie}</a> </b>
                                                    : body.head
                                                    : ""
                                                }
                                            </td>
                                            <td className="w-50 border-top-0">
                                                {body.relation}
                                            </td>
                                            <td className="w-25 border-top-0">
                                                {(info.head && info.tail) ?
                                                    body.tailLabel ? 
                                                        <a href={'/entity?term=' + body.tail}>{body.tailLabel}</a> 
                                                    : body.tail === "X" ? 
                                                        <b><a href={'/entity?term=' + info.head.curie}>{info.head.label ? info.head.label : info.head.curie}</a></b>
                                                    : body.tail === "Y" ? 
                                                        <b><a href={'/entity?term=' + info.tail.curie}>{info.tail.label ? info.tail.label : info.tail.curie}</a> </b> 
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
                        {rule.Definition["hasUnboundVariables"] ? 
                        <OverlayTrigger
                            key='top'
                            placement='top'
                            overlay={
                            <Tooltip id={`tooltip-top`}>
                                Show instantiations of variables.
                            </Tooltip>
                            }
                        >
                            <Button onClick={() => {showInstantiations(rule)}} className="p-1">
                                <IconContext.Provider value={{ size: "1.25em", className: "global-class-name" }}>
                                    <div>
                                        <HiOutlineVariable className="m-1"/>
                                    </div>
                                </IconContext.Provider>
                            </Button> 
                        </OverlayTrigger>
                        : ""}
                    </td>
                </tr>
            )}
            </tbody>
        </Table>
    )
}